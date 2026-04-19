//! Tauri implementation of the transport-neutral `EventSink` contract.
//!
//! Bridges `houston-ui-events::EventSink` (used by every engine crate) to
//! Tauri's `app_handle.emit(...)`. Lives in `houston-tauri` (the adapter)
//! so the engine crates remain free of `tauri` dependencies.

use houston_ui_events::{DynEventSink, EventSink, HoustonEvent};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

/// `EventSink` impl backed by Tauri's event bus. Emits every event under
/// the `"houston-event"` channel for the webview to listen on.
#[derive(Clone)]
pub struct TauriEventSink {
    handle: AppHandle,
}

impl TauriEventSink {
    pub fn new(handle: AppHandle) -> Self {
        Self { handle }
    }
}

impl EventSink for TauriEventSink {
    fn emit(&self, event: HoustonEvent) {
        if let Err(err) = self.handle.emit("houston-event", event) {
            tracing::warn!("[tauri-event-sink] emit failed: {err}");
        }
    }
}

/// Convenience constructor — returns an `Arc<dyn EventSink>` ready to pass
/// into engine crates.
pub fn tauri_sink(handle: &AppHandle) -> DynEventSink {
    Arc::new(TauriEventSink::new(handle.clone()))
}
