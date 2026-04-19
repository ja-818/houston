//! Tauri command wrappers around `houston-file-watcher`.
//!
//! The engine crate is transport-neutral — it takes an `EventSink` and
//! returns a raw `AgentWatcher` handle. These thin `#[tauri::command]`
//! wrappers translate between that and Tauri-managed state + event bus.

use crate::event_sink::tauri_sink;
use houston_file_watcher::{start_watching, WatcherState};

/// Start watching the current agent for file changes.
#[tauri::command(rename_all = "snake_case")]
pub async fn start_agent_watcher(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, WatcherState>,
    agent_path: String,
) -> Result<(), String> {
    let mut guard = state.0.lock().await;
    // Stop any existing watcher first.
    *guard = None;
    let watcher = start_watching(tauri_sink(&app_handle), agent_path)?;
    *guard = Some(watcher);
    Ok(())
}

/// Stop watching the current agent.
#[tauri::command(rename_all = "snake_case")]
pub async fn stop_agent_watcher(
    state: tauri::State<'_, WatcherState>,
) -> Result<(), String> {
    let mut guard = state.0.lock().await;
    *guard = None;
    tracing::info!("[watcher] Stopped");
    Ok(())
}
