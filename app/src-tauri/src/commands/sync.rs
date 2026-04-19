use houston_sync::{SyncClient, SyncMessage};
use serde::Serialize;
use std::sync::Arc;
use tauri::{Emitter, State};
use tokio::sync::{broadcast, Mutex};

/// Managed state holding the active sync client (if any).
pub struct SyncState {
    inner: Arc<Mutex<Option<ActiveSync>>>,
}

impl Default for SyncState {
    fn default() -> Self {
        Self {
            inner: Arc::new(Mutex::new(None)),
        }
    }
}

/// An active sync session — holds the client and background task handles.
struct ActiveSync {
    client: SyncClient,
    /// Handle to the spawned WebSocket task so we can abort on disconnect.
    ws_task: tokio::task::JoinHandle<()>,
    /// Handle to the event-forwarding task (sync messages → Tauri events).
    event_task: tokio::task::JoinHandle<()>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SyncInfo {
    pub token: String,
    pub pairing_url: String,
}

/// Start sync pairing -- generates a token, connects to the relay, and
/// returns the pairing URL that the mobile app should connect to.
#[tauri::command]
pub async fn start_sync(
    app: tauri::AppHandle,
    sync_state: State<'_, SyncState>,
) -> Result<SyncInfo, String> {
    let relay_url = std::env::var("HOUSTON_RELAY_URL")
        .unwrap_or_else(|_| "wss://houston-relay.julianarango1818.workers.dev".to_string());

    let (client, handle) = SyncClient::new(&relay_url);
    let info = SyncInfo {
        token: client.token().to_string(),
        pairing_url: client.pairing_url(),
    };

    tracing::info!("[sync] Starting sync with token {}", info.token);

    let ws_task = tokio::spawn(async move {
        if let Err(e) = handle.run().await {
            tracing::error!("[sync] Connection error: {e}");
        }
        tracing::info!("[sync] WebSocket task finished");
    });

    // Forward incoming sync messages to the frontend as Tauri events.
    let mut rx = client.subscribe();
    let event_task = tokio::spawn(async move {
        loop {
            match rx.recv().await {
                Ok(msg) => {
                    tracing::info!("[sync] Received from relay: type={}", msg.msg_type);
                    // Emit a dedicated sync-connection event for connection state
                    // transitions so UI layers can subscribe without filtering
                    // the general sync-message stream.
                    if msg.msg_type == "connection" {
                        let _ = app.emit("sync-connection", &msg.payload);
                    }
                    let _ = app.emit("sync-message", &msg);
                }
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!("[sync] Event listener lagged by {n} messages");
                }
                Err(broadcast::error::RecvError::Closed) => {
                    tracing::info!("[sync] Sync channel closed");
                    break;
                }
            }
        }
    });

    let mut state = sync_state.inner.lock().await;
    *state = Some(ActiveSync {
        client,
        ws_task,
        event_task,
    });

    Ok(info)
}

/// Stop sync and disconnect from the relay.
///
/// Requests a clean shutdown first (so the runner can emit a final
/// `connection { state: "disconnected" }`), then falls back to `abort()`
/// after a short grace period.
#[tauri::command]
pub async fn stop_sync(
    sync_state: State<'_, SyncState>,
) -> Result<(), String> {
    let mut state = sync_state.inner.lock().await;
    if let Some(active) = state.take() {
        // Signal graceful shutdown so the runner can emit a final
        // `connection { state: "disconnected" }` message.
        active.client.shutdown();

        // Wait up to 500ms for the ws task to exit cleanly; abort if it
        // overruns. We borrow the JoinHandle via `&mut` so we can still
        // call `abort()` on it after the timeout elapses.
        let grace = std::time::Duration::from_millis(500);
        let mut ws_task = active.ws_task;
        if tokio::time::timeout(grace, &mut ws_task).await.is_err() {
            tracing::warn!("[sync] Runner did not exit within {:?}; aborting", grace);
            ws_task.abort();
        }

        active.event_task.abort();
        tracing::info!("[sync] Disconnected");
    }
    Ok(())
}

/// Get current sync status -- returns pairing info if active, null otherwise.
#[tauri::command]
pub async fn get_sync_status(
    sync_state: State<'_, SyncState>,
) -> Result<Option<SyncInfo>, String> {
    let state = sync_state.inner.lock().await;
    Ok(state.as_ref().map(|active| SyncInfo {
        token: active.client.token().to_string(),
        pairing_url: active.client.pairing_url(),
    }))
}

/// Send a sync message to the paired mobile device.
#[tauri::command]
pub async fn send_sync_message(
    sync_state: State<'_, SyncState>,
    message: SyncMessage,
) -> Result<(), String> {
    let state = sync_state.inner.lock().await;
    match state.as_ref() {
        Some(active) => {
            active
                .client
                .send(message)
                .await
                .map_err(|e| format!("Failed to send sync message: {e}"))?;
            Ok(())
        }
        None => Err("Sync is not active".to_string()),
    }
}
