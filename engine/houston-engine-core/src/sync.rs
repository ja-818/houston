//! Mobile sync runtime — relocated from `app/src-tauri/src/commands/sync.rs`.
//!
//! `SyncRuntime` owns the active sync session (`SyncClient` + background
//! tasks) and routes incoming relay messages onto the engine's
//! `EventSink` as `HoustonEvent::SyncConnection` and
//! `HoustonEvent::SyncMessage`. WebSocket subscribers receive these on
//! the `sync` topic — the engine is the WS authority for sync events.
//!
//! Transport-neutral: HTTP routes and the desktop adapter both call into
//! these methods.

use crate::error::{CoreError, CoreResult};
use houston_sync::{SyncClient, SyncMessage};
use houston_ui_events::{DynEventSink, HoustonEvent};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{broadcast, Mutex};

/// Default Houston relay URL. Override via `HOUSTON_RELAY_URL` or by
/// passing an explicit URL to [`SyncRuntime::start`].
pub const DEFAULT_RELAY_URL: &str = "wss://houston-relay.julianarango1818.workers.dev";

/// Pairing info returned by [`SyncRuntime::start`] / [`SyncRuntime::status`].
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncInfo {
    pub token: String,
    pub pairing_url: String,
}

/// Per-engine sync runtime. Cheap to clone (`Arc` inside).
#[derive(Default, Clone)]
pub struct SyncRuntime {
    inner: Arc<Mutex<Option<ActiveSync>>>,
}

struct ActiveSync {
    client: SyncClient,
    ws_task: tokio::task::JoinHandle<()>,
    event_task: tokio::task::JoinHandle<()>,
}

impl SyncRuntime {
    pub fn new() -> Self {
        Self::default()
    }

    /// Start a sync session. Idempotent — if a session is already active,
    /// returns its existing pairing info instead of starting a new one.
    pub async fn start(&self, relay_url: &str, events: DynEventSink) -> SyncInfo {
        let mut guard = self.inner.lock().await;
        if let Some(active) = guard.as_ref() {
            return SyncInfo {
                token: active.client.token().to_string(),
                pairing_url: active.client.pairing_url(),
            };
        }

        let (client, handle) = SyncClient::new(relay_url);
        let info = SyncInfo {
            token: client.token().to_string(),
            pairing_url: client.pairing_url(),
        };
        tracing::info!("[sync] starting session token={}", info.token);

        let ws_task = tokio::spawn(async move {
            if let Err(e) = handle.run().await {
                tracing::error!("[sync] connection error: {e}");
            }
            tracing::info!("[sync] websocket task finished");
        });

        let mut rx = client.subscribe();
        let event_task = tokio::spawn(async move {
            loop {
                match rx.recv().await {
                    Ok(msg) => {
                        if msg.msg_type == "connection" {
                            if let Some(state) =
                                msg.payload.get("state").and_then(|v| v.as_str())
                            {
                                events.emit(HoustonEvent::SyncConnection {
                                    state: state.to_string(),
                                });
                            }
                        }
                        let payload =
                            serde_json::to_value(&msg).unwrap_or(serde_json::Value::Null);
                        events.emit(HoustonEvent::SyncMessage { message: payload });
                    }
                    Err(broadcast::error::RecvError::Lagged(n)) => {
                        tracing::warn!("[sync] event listener lagged by {n}");
                    }
                    Err(broadcast::error::RecvError::Closed) => {
                        tracing::info!("[sync] sync channel closed");
                        break;
                    }
                }
            }
        });

        *guard = Some(ActiveSync {
            client,
            ws_task,
            event_task,
        });
        info
    }

    /// Stop the active session. No-op if none is active.
    ///
    /// Asks the runner for a graceful shutdown (so it can emit a final
    /// `connection { state: "disconnected" }`), then aborts after a 500ms
    /// grace window if the runner overruns.
    pub async fn stop(&self) {
        let mut guard = self.inner.lock().await;
        if let Some(active) = guard.take() {
            active.client.shutdown();
            let grace = std::time::Duration::from_millis(500);
            let mut ws_task = active.ws_task;
            if tokio::time::timeout(grace, &mut ws_task).await.is_err() {
                tracing::warn!("[sync] runner did not exit within {grace:?}; aborting");
                ws_task.abort();
            }
            active.event_task.abort();
            tracing::info!("[sync] disconnected");
        }
    }

    /// Return the current pairing info, or `None` if no session is active.
    pub async fn status(&self) -> Option<SyncInfo> {
        let guard = self.inner.lock().await;
        guard.as_ref().map(|active| SyncInfo {
            token: active.client.token().to_string(),
            pairing_url: active.client.pairing_url(),
        })
    }

    /// Send a message to the paired mobile device.
    pub async fn send(&self, message: SyncMessage) -> CoreResult<()> {
        let guard = self.inner.lock().await;
        match guard.as_ref() {
            Some(active) => active
                .client
                .send(message)
                .await
                .map_err(|e| CoreError::Internal(format!("sync send failed: {e}"))),
            None => Err(CoreError::BadRequest("sync is not active".into())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use houston_ui_events::NoopEventSink;

    #[tokio::test]
    async fn status_initially_none() {
        let rt = SyncRuntime::new();
        assert!(rt.status().await.is_none());
    }

    #[tokio::test]
    async fn send_without_start_is_bad_request() {
        let rt = SyncRuntime::new();
        let err = rt
            .send(SyncMessage {
                msg_type: "ping".into(),
                from: houston_sync::SyncPeer::Desktop,
                ts: "now".into(),
                payload: serde_json::Value::Null,
            })
            .await
            .unwrap_err();
        assert!(matches!(err, CoreError::BadRequest(_)));
    }

    #[tokio::test]
    async fn start_is_idempotent_and_stop_clears_state() {
        let rt = SyncRuntime::new();
        let sink: DynEventSink = Arc::new(NoopEventSink);
        // Use a clearly bogus URL — the runner will retry forever, but
        // that's fine: we only assert pairing info + idempotency, then
        // shut down cleanly.
        let url = "ws://127.0.0.1:1";
        let a = rt.start(url, sink.clone()).await;
        let b = rt.start(url, sink.clone()).await;
        assert_eq!(a.token, b.token, "second start returns same session");
        assert!(rt.status().await.is_some());
        rt.stop().await;
        assert!(rt.status().await.is_none());
    }
}
