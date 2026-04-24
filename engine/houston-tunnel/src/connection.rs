//! Outbound tunnel connection to the Houston relay.
//!
//! `TunnelClient::run` dials `{relay}/e/{tunnelId}/register` over WSS,
//! loops reading frames, and dispatches:
//!   - `HttpRequest` → loopback HTTP → `HttpResponse`
//!   - `WsOpen` → loopback WS + spawned pumps → `WsOpenAck` + forwarded messages
//!   - `WsMessage { dir: c2s }` → push into the matching leg
//!   - `WsClose` → drop the leg
//!   - `PairRequest` → [`PairingService::redeem`] → `PairResponse`
//!   - `Ping` → `Pong`
//!
//! Reconnects on drop with exponential backoff up to 60s.

use crate::frame::{PairResponseFrame, PingFrame, PongFrame, TunnelFrame};
use crate::pairing::PairingService;
use crate::proxy::{close_leg, forward_c2s, proxy_http, proxy_ws_open, EngineEndpoint, LegsMap};
use futures_util::{SinkExt, StreamExt};
use std::collections::HashMap;
use std::sync::atomic::{AtomicI64, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio_tungstenite::tungstenite::Message as WsMsg;

/// Heartbeat cadence: desktop sends a `Ping` frame this often. The relay
/// DO mirrors with its own ~20s heartbeat, so the aggregate "a frame
/// passes in each direction" interval is ~10-15s — enough to keep any
/// reasonable CF / intermediary idle timeout far away.
const HEARTBEAT_EVERY: Duration = Duration::from_secs(30);

/// Watchdog: if no frame (pong, ping, or anything else) has been received
/// in this window, the tunnel is dead even if the OS hasn't noticed the
/// TCP FIN. Close + reconnect.
const WATCHDOG_SILENCE: Duration = Duration::from_secs(90);

/// Internal classification of `run_once` outcomes. `Unauthorized` means
/// the relay explicitly rejected our tunnel token on the register
/// handshake (4xx auth); the outer loop triggers identity
/// re-allocation. `Other` is every transient — network blip, TLS
/// hiccup, DNS fail — handled by the normal backoff.
enum RunError {
    Unauthorized,
    Other(anyhow::Error),
}

/// Detect whether a `tokio_tungstenite` connect error was a 401/403
/// handshake response (as opposed to a transport error). The relay
/// returns 401 when it can't verify our tunnel_token against the
/// TUNNEL_SHARED_SECRET — recoverable only via re-allocation.
fn is_auth_failure(e: &tokio_tungstenite::tungstenite::Error) -> bool {
    use tokio_tungstenite::tungstenite::Error;
    if let Error::Http(resp) = e {
        let status = resp.status().as_u16();
        return status == 401 || status == 403;
    }
    false
}

#[derive(Clone, Debug)]
pub struct TunnelConfig {
    /// Houston home directory — holds `tunnel.json` so the client can
    /// persist / invalidate / re-allocate identity without bouncing the
    /// engine.
    pub home_dir: std::path::PathBuf,
    /// Relay base URL, e.g. `https://tunnel.gethouston.ai`. The client
    /// derives the register URL (`wss://.../e/<tunnelId>/register`)
    /// itself using the current identity.
    pub tunnel_url: String,
    /// Initial identity (loaded or allocated by `identity::ensure`). On
    /// persistent auth failure the client calls `identity::invalidate`
    /// + `identity::ensure` to mint a fresh one.
    pub identity: crate::identity::TunnelIdentity,
    /// The loopback engine this proxy fronts.
    pub endpoint: EngineEndpoint,
}

/// Threshold for persistent-failure detection. After this many
/// consecutive `run_once` failures with NO successful connection in
/// between, assume the cached identity is bad (relay rotated secret,
/// DO pool changed, whatever) and re-allocate.
const REALLOCATE_AFTER_FAILURES: u32 = 6;

/// Cheap clone; spawn once per process.
pub struct TunnelClient {
    cfg: tokio::sync::Mutex<TunnelConfig>,
    pairing: Arc<dyn PairingService>,
}

impl TunnelClient {
    pub fn new(cfg: TunnelConfig, pairing: Arc<dyn PairingService>) -> Self {
        Self {
            cfg: tokio::sync::Mutex::new(cfg),
            pairing,
        }
    }

    /// Long-running task. Never returns (reconnect loop). Caller should
    /// `tokio::spawn` it.
    pub async fn run(self) {
        let mut backoff_ms = 500u64;
        let mut consecutive_failures: u32 = 0;
        loop {
            let run_result = self.run_once().await;
            match run_result {
                Ok(()) => {
                    tracing::info!(target: "houston_tunnel", "tunnel closed cleanly, reconnecting");
                    backoff_ms = 500;
                    consecutive_failures = 0;
                }
                Err(RunError::Unauthorized) => {
                    tracing::warn!(
                        target: "houston_tunnel",
                        "tunnel register rejected (401/403) — invalidating cached identity, re-allocating"
                    );
                    self.reallocate_identity().await;
                    backoff_ms = 500;
                    consecutive_failures = 0;
                }
                Err(RunError::Other(e)) => {
                    consecutive_failures += 1;
                    tracing::info!(
                        target: "houston_tunnel",
                        error = %e,
                        backoff_ms,
                        consecutive_failures,
                        "tunnel dropped, retrying"
                    );
                    if consecutive_failures >= REALLOCATE_AFTER_FAILURES {
                        tracing::warn!(
                            target: "houston_tunnel",
                            consecutive_failures,
                            "hit failure threshold — re-allocating identity"
                        );
                        self.reallocate_identity().await;
                        consecutive_failures = 0;
                        backoff_ms = 500;
                    }
                }
            }
            tokio::time::sleep(Duration::from_millis(backoff_ms)).await;
            backoff_ms = (backoff_ms * 2).min(60_000);
        }
    }

    /// Delete the cached `tunnel.json` and allocate a fresh identity
    /// from the relay. Used when we detect that the relay will no
    /// longer honour our token (401/403 on register, or sustained
    /// unexplained failures). Logs + swallows errors — the outer
    /// reconnect loop will keep trying with whatever identity we have.
    async fn reallocate_identity(&self) {
        let mut cfg = self.cfg.lock().await;
        crate::identity::invalidate(&cfg.home_dir);
        match crate::identity::ensure(&cfg.home_dir, &cfg.tunnel_url).await {
            Ok(fresh) => {
                tracing::info!(
                    target: "houston_tunnel",
                    tunnel_id = %fresh.tunnel_id,
                    host = %fresh.public_host,
                    "allocated fresh tunnel identity"
                );
                cfg.identity = fresh;
            }
            Err(e) => {
                tracing::error!(
                    target: "houston_tunnel",
                    error = %e,
                    "re-allocation failed — will keep retrying with current identity"
                );
            }
        }
    }

    /// Snapshot the current identity + register URL under the mutex,
    /// then release it so the long-running read loop doesn't hold it.
    fn register_url_for(&self, cfg: &TunnelConfig) -> Option<String> {
        let base = cfg.tunnel_url.trim_end_matches('/');
        if let Some(rest) = base.strip_prefix("https://") {
            Some(format!("wss://{rest}/e/{}/register", cfg.identity.tunnel_id))
        } else if let Some(rest) = base.strip_prefix("http://") {
            Some(format!("ws://{rest}/e/{}/register", cfg.identity.tunnel_id))
        } else {
            tracing::warn!(
                target: "houston_tunnel",
                tunnel_url = %cfg.tunnel_url,
                "unexpected scheme — expected http:// or https://"
            );
            None
        }
    }

    async fn run_once(&self) -> Result<(), RunError> {
        use tokio_tungstenite::tungstenite::client::IntoClientRequest;
        use tokio_tungstenite::tungstenite::http::HeaderValue;

        // Snapshot config so we don't hold the mutex during the long
        // reader loop.
        let (register_url, tunnel_token, endpoint) = {
            let guard = self.cfg.lock().await;
            let Some(url) = self.register_url_for(&guard) else {
                return Err(RunError::Other(anyhow::anyhow!("bad tunnel_url scheme")));
            };
            (url, guard.identity.tunnel_token.clone(), guard.endpoint.clone())
        };

        // `into_client_request()` builds the proper WS handshake request
        // (Sec-WebSocket-Key/Version/etc). Then we attach our bearer.
        let mut request = register_url
            .as_str()
            .into_client_request()
            .map_err(|e| RunError::Other(e.into()))?;
        request.headers_mut().insert(
            "Authorization",
            HeaderValue::from_str(&format!("Bearer {tunnel_token}"))
                .map_err(|e| RunError::Other(e.into()))?,
        );

        let (stream, _resp) = match tokio_tungstenite::connect_async(request).await {
            Ok(x) => x,
            Err(e) => {
                if is_auth_failure(&e) {
                    return Err(RunError::Unauthorized);
                }
                return Err(RunError::Other(e.into()));
            }
        };
        tracing::info!(target: "houston_tunnel", "tunnel connected");

        let (mut sink, mut src) = stream.split();
        let (out_tx, mut out_rx) = tokio::sync::mpsc::unbounded_channel::<TunnelFrame>();
        let legs: LegsMap = Arc::new(Mutex::new(HashMap::new()));

        // Writer task — serialises every outbound frame to text and ships it.
        let writer = tokio::spawn(async move {
            while let Some(frame) = out_rx.recv().await {
                let text = match serde_json::to_string(&frame) {
                    Ok(s) => s,
                    Err(e) => {
                        tracing::warn!(target: "houston_tunnel", error = %e, "serialize frame");
                        continue;
                    }
                };
                if sink.send(WsMsg::Text(text.into())).await.is_err() {
                    break;
                }
            }
        });

        let http = reqwest::Client::builder()
            .tcp_nodelay(true)
            .build()
            .expect("reqwest client builds");

        // last_recv_ms is bumped on every inbound frame (any kind). The
        // watchdog tick reads it; if we've been silent for longer than
        // WATCHDOG_SILENCE we declare the tunnel dead and break out of
        // the read loop, which triggers the outer reconnect backoff.
        let last_recv_ms = AtomicI64::new(now_ms());
        let mut heartbeat = tokio::time::interval(HEARTBEAT_EVERY);
        // `Burst` is the default mode; the first tick fires ~immediately.
        // Skip it so we don't blast a Ping before the DO finishes its
        // accept handshake on its side.
        heartbeat.tick().await;

        let outcome: Result<(), RunError> = loop {
            tokio::select! {
                biased;
                maybe_msg = src.next() => {
                    let Some(msg) = maybe_msg else { break Ok(()); };
                    let msg = match msg {
                        Ok(m) => m,
                        Err(e) => break Err(RunError::Other(e.into())),
                    };
                    last_recv_ms.store(now_ms(), Ordering::Relaxed);
                    let text = match msg {
                        WsMsg::Text(t) => t.to_string(),
                        WsMsg::Ping(p) => {
                            let _ = out_tx.send(TunnelFrame::Pong(PongFrame { ts: now_ms() }));
                            drop(p);
                            continue;
                        }
                        WsMsg::Close(_) => break Ok(()),
                        _ => continue,
                    };
                    let frame: TunnelFrame = match serde_json::from_str(&text) {
                        Ok(f) => f,
                        Err(_) => continue,
                    };
                    self.dispatch(frame, &out_tx, &legs, &http, &endpoint).await;
                }
                _ = heartbeat.tick() => {
                    let silence_ms = now_ms() - last_recv_ms.load(Ordering::Relaxed);
                    if silence_ms > WATCHDOG_SILENCE.as_millis() as i64 {
                        tracing::warn!(
                            target: "houston_tunnel",
                            silence_ms,
                            "tunnel watchdog fired — no frame received in window, forcing reconnect"
                        );
                        break Err(RunError::Other(anyhow::anyhow!(
                            "watchdog: no frame in {}ms",
                            silence_ms
                        )));
                    }
                    // Non-fatal if the channel is gone (writer task died);
                    // the next src.next() will return None and we bail.
                    let _ = out_tx.send(TunnelFrame::Ping(PingFrame { ts: now_ms() }));
                }
            }
        };

        drop(out_tx);
        let _ = writer.await;
        outcome
    }

    async fn dispatch(
        &self,
        frame: TunnelFrame,
        out_tx: &tokio::sync::mpsc::UnboundedSender<TunnelFrame>,
        legs: &LegsMap,
        http: &reqwest::Client,
        endpoint: &EngineEndpoint,
    ) {
        match frame {
            TunnelFrame::HttpRequest(req) => {
                let endpoint = endpoint.clone();
                let http = http.clone();
                let tx = out_tx.clone();
                tokio::spawn(async move {
                    let resp = proxy_http(&http, &endpoint, req).await;
                    let _ = tx.send(TunnelFrame::HttpResponse(resp));
                });
            }
            TunnelFrame::WsOpen(open) => {
                let endpoint = endpoint.clone();
                let tx = out_tx.clone();
                let legs = legs.clone();
                tokio::spawn(async move {
                    let ack = proxy_ws_open(&endpoint, open, tx.clone(), legs).await;
                    let _ = tx.send(TunnelFrame::WsOpenAck(ack));
                });
            }
            TunnelFrame::WsMessage(msg) if msg.dir == "c2s" => {
                forward_c2s(legs, msg).await;
            }
            TunnelFrame::WsClose(close) => {
                close_leg(legs, &close.ws_id).await;
            }
            TunnelFrame::PairRequest(pr) => {
                tracing::info!(
                    target: "houston_tunnel",
                    req_id = %pr.req_id,
                    code_len = pr.code.len(),
                    device_label = %pr.device_label,
                    "pair_request received"
                );
                let svc = self.pairing.clone();
                let tx = out_tx.clone();
                tokio::spawn(async move {
                    let resp = match svc.redeem(&pr.code, &pr.device_label).await {
                        Ok(out) => {
                            tracing::info!(
                                target: "houston_tunnel",
                                req_id = %pr.req_id,
                                "pair_request ok — minted engine token"
                            );
                            PairResponseFrame {
                                req_id: pr.req_id,
                                ok: true,
                                engine_token: Some(out.engine_token),
                                error: None,
                                code: None,
                            }
                        }
                        Err(e) => {
                            let code = e.code().to_string();
                            let err_str = e.to_string();
                            tracing::warn!(
                                target: "houston_tunnel",
                                req_id = %pr.req_id,
                                code = %code,
                                error = %err_str,
                                "pair_request rejected"
                            );
                            PairResponseFrame {
                                req_id: pr.req_id,
                                ok: false,
                                engine_token: None,
                                error: Some(err_str),
                                code: Some(code),
                            }
                        }
                    };
                    let _ = tx.send(TunnelFrame::PairResponse(resp));
                });
            }
            TunnelFrame::Ping(ping) => {
                let _ = out_tx.send(TunnelFrame::Pong(PongFrame { ts: ping.ts }));
            }
            _ => { /* unexpected, ignore */ }
        }
    }
}

fn now_ms() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}
