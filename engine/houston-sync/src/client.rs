use crate::protocol::{SyncMessage, SyncPeer};
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{broadcast, mpsc, Notify};
use tokio_tungstenite::connect_async;
use tracing::{error, info, warn};

/// Channels and metadata returned by [`SyncClient::new`].
///
/// The caller keeps `SyncClient` to send/subscribe, and spawns
/// [`SyncHandle::run`] in a background task.
pub struct SyncClient {
    /// Send outgoing messages to the relay.
    outgoing_tx: mpsc::Sender<SyncMessage>,
    /// Subscribe to incoming messages from the relay.
    incoming_tx: broadcast::Sender<SyncMessage>,
    /// The pairing token (hex-encoded, 32 bytes).
    token: String,
    /// Base relay URL (without path).
    relay_url: String,
    /// Shutdown notifier — triggers graceful exit of [`SyncHandle::run`].
    shutdown: Arc<Notify>,
}

impl SyncClient {
    /// Create a new sync client with a random pairing token.
    ///
    /// Returns `(client, handle)`.  The caller should:
    /// 1. Use `client` to get the token/URL and to send/receive messages.
    /// 2. Spawn `handle.run()` in a background task.
    pub fn new(relay_url: &str) -> (Self, SyncHandle) {
        let token = generate_token();
        let (outgoing_tx, outgoing_rx) = mpsc::channel(256);
        let (incoming_tx, _) = broadcast::channel(256);
        let shutdown = Arc::new(Notify::new());

        let client = Self {
            outgoing_tx: outgoing_tx.clone(),
            incoming_tx: incoming_tx.clone(),
            token: token.clone(),
            relay_url: relay_url.to_string(),
            shutdown: shutdown.clone(),
        };

        let handle = SyncHandle {
            incoming_tx,
            outgoing_rx,
            token: token.clone(),
            relay_url: relay_url.to_string(),
            shutdown,
        };

        (client, handle)
    }

    /// The full WebSocket URL for pairing (desktop role).
    pub fn pairing_url(&self) -> String {
        format!("{}/sync/{}", self.relay_url, self.token)
    }

    /// The pairing token.
    pub fn token(&self) -> &str {
        &self.token
    }

    /// Send a message to the relay (and thus to the paired mobile).
    pub async fn send(&self, msg: SyncMessage) -> Result<(), mpsc::error::SendError<SyncMessage>> {
        self.outgoing_tx.send(msg).await
    }

    /// Subscribe to incoming messages from the relay.
    pub fn subscribe(&self) -> broadcast::Receiver<SyncMessage> {
        self.incoming_tx.subscribe()
    }

    /// Clone the outgoing sender so other tasks can send messages.
    pub fn sender(&self) -> mpsc::Sender<SyncMessage> {
        self.outgoing_tx.clone()
    }

    /// Signal the background [`SyncHandle::run`] loop to shut down cleanly.
    ///
    /// Prefer this over dropping/aborting — it gives the loop a chance to
    /// emit a final `connection { state: "disconnected" }` message.
    pub fn shutdown(&self) {
        self.shutdown.notify_waiters();
    }
}

/// Background runner that manages the WebSocket connection.
///
/// Spawn via `tokio::spawn(handle.run())`.
pub struct SyncHandle {
    incoming_tx: broadcast::Sender<SyncMessage>,
    outgoing_rx: mpsc::Receiver<SyncMessage>,
    token: String,
    relay_url: String,
    shutdown: Arc<Notify>,
}

/// Starting backoff duration (1 second).
const INITIAL_BACKOFF: Duration = Duration::from_secs(1);
/// Maximum backoff duration (30 seconds).
const MAX_BACKOFF: Duration = Duration::from_secs(30);

/// Double the current backoff, capped at [`MAX_BACKOFF`].
fn next_backoff(current: Duration) -> Duration {
    let doubled = current.saturating_mul(2);
    if doubled > MAX_BACKOFF {
        MAX_BACKOFF
    } else {
        doubled
    }
}

/// Build a synthetic `connection` state transition message.
fn connection_msg(state: &str) -> SyncMessage {
    SyncMessage {
        msg_type: "connection".into(),
        from: SyncPeer::Desktop,
        ts: now_iso(),
        payload: serde_json::json!({ "state": state }),
    }
}

impl SyncHandle {
    /// Run the WebSocket connection loop with automatic reconnect.
    ///
    /// Emits synthetic `connection` messages onto the incoming broadcast
    /// channel so subscribers can observe state transitions:
    ///   - `{ state: "connected" }` after each successful connect
    ///   - `{ state: "reconnecting" }` before every reconnect attempt
    ///   - `{ state: "disconnected" }` on graceful shutdown
    ///
    /// The loop exits when either:
    ///   - `SyncClient::shutdown()` is called (via the `Notify`), or
    ///   - all senders for `outgoing_rx` are dropped (caller gone).
    pub async fn run(mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let url = format!("{}/sync/{}?role=desktop", self.relay_url, self.token);
        let mut backoff = INITIAL_BACKOFF;
        let mut first_iteration = true;

        'outer: loop {
            // Announce reconnect attempt (but not on the very first iteration —
            // the initial connect should present as a normal startup).
            if !first_iteration {
                let _ = self.incoming_tx.send(connection_msg("reconnecting"));
            }
            first_iteration = false;

            info!("[sync] Connecting to relay: {}", url);
            let connect_result = tokio::select! {
                res = connect_async(&url) => res,
                _ = self.shutdown.notified() => {
                    info!("[sync] Shutdown requested during connect");
                    break 'outer;
                }
            };

            let (mut write, mut read) = match connect_result {
                Ok((ws_stream, _)) => {
                    info!("[sync] Connected to relay");
                    ws_stream.split()
                }
                Err(e) => {
                    warn!(
                        "[sync] Connect failed: {e}; retrying in {}s",
                        backoff.as_secs()
                    );
                    // Sleep but allow interruption via shutdown.
                    tokio::select! {
                        _ = tokio::time::sleep(backoff) => {}
                        _ = self.shutdown.notified() => {
                            info!("[sync] Shutdown requested during backoff");
                            break 'outer;
                        }
                    }
                    backoff = next_backoff(backoff);
                    continue 'outer;
                }
            };

            // Notify subscribers that the connection is up, reset backoff.
            let _ = self.incoming_tx.send(connection_msg("connected"));
            backoff = INITIAL_BACKOFF;

            // Inner loop — forward messages until the connection drops or
            // the caller signals shutdown.
            let caller_gone = loop {
                tokio::select! {
                    maybe_msg = self.outgoing_rx.recv() => {
                        match maybe_msg {
                            Some(msg) => {
                                let json = match serde_json::to_string(&msg) {
                                    Ok(s) => s,
                                    Err(e) => {
                                        warn!("[sync] Serialize error: {e}");
                                        continue;
                                    }
                                };
                                if let Err(e) = write.send(
                                    tokio_tungstenite::tungstenite::Message::Text(json.into()),
                                ).await {
                                    warn!("[sync] WebSocket send failed: {e}");
                                    break false;
                                }
                            }
                            None => {
                                // All senders dropped — caller is done.
                                info!("[sync] Outgoing channel closed; shutting down");
                                break true;
                            }
                        }
                    }
                    ws_result = read.next() => {
                        match ws_result {
                            Some(Ok(tokio_tungstenite::tungstenite::Message::Text(text))) => {
                                match serde_json::from_str::<SyncMessage>(&text) {
                                    Ok(msg) => {
                                        let _ = self.incoming_tx.send(msg);
                                    }
                                    Err(e) => {
                                        warn!("[sync] Invalid message from relay: {e}");
                                    }
                                }
                            }
                            Some(Ok(tokio_tungstenite::tungstenite::Message::Close(_))) => {
                                info!("[sync] Relay closed the connection");
                                break false;
                            }
                            Some(Err(e)) => {
                                error!("[sync] WebSocket error: {e}");
                                break false;
                            }
                            None => {
                                info!("[sync] WebSocket stream ended");
                                break false;
                            }
                            _ => {} // Binary, Ping, Pong — ignore
                        }
                    }
                    _ = self.shutdown.notified() => {
                        info!("[sync] Shutdown requested during run");
                        break true;
                    }
                }
            };

            if caller_gone {
                break 'outer;
            }

            // Connection dropped — loop and reconnect.
            info!("[sync] Connection lost; will reconnect");
        }

        // Final disconnect notification.
        let _ = self.incoming_tx.send(connection_msg("disconnected"));
        Ok(())
    }

}

/// Generate a cryptographically random 32-byte hex token.
fn generate_token() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let bytes: Vec<u8> = (0..32).map(|_| rng.gen()).collect();
    hex::encode(bytes)
}

/// ISO 8601 timestamp for "now".
fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn token_is_64_hex_chars() {
        let token = generate_token();
        assert_eq!(token.len(), 64);
        assert!(token.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn pairing_url_includes_token() {
        let (client, _handle) = SyncClient::new("ws://localhost:8787");
        let url = client.pairing_url();
        assert!(url.starts_with("ws://localhost:8787/sync/"));
        assert!(url.contains(client.token()));
    }

    #[test]
    fn backoff_doubles_and_caps_at_30s() {
        let mut b = INITIAL_BACKOFF;
        let mut seq = vec![b];
        for _ in 0..7 {
            b = next_backoff(b);
            seq.push(b);
        }
        assert_eq!(
            seq,
            vec![
                Duration::from_secs(1),
                Duration::from_secs(2),
                Duration::from_secs(4),
                Duration::from_secs(8),
                Duration::from_secs(16),
                Duration::from_secs(30),
                Duration::from_secs(30),
                Duration::from_secs(30),
            ]
        );
    }

    #[test]
    fn connection_msg_has_expected_shape() {
        let msg = connection_msg("connected");
        assert_eq!(msg.msg_type, "connection");
        assert_eq!(
            msg.payload.get("state").and_then(|v| v.as_str()),
            Some("connected")
        );
    }
}
