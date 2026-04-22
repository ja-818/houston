//! houston-tauri — Tauri adapter for the Houston desktop app.
//!
//! Post-Phase-4 this crate is intentionally thin: domain logic lives in
//! `houston-engine-core` and is exposed over HTTP+WS by
//! `houston-engine-server`. The adapter only keeps what the desktop
//! specifically needs: OS-native glue (tray, event sink, path helpers,
//! shared state).

pub mod event_sink;
pub mod paths;
pub mod state;
pub mod tray;

pub use event_sink::{tauri_sink, TauriEventSink};

// Re-export sub-crates for convenience.
pub use houston_agent_files;
pub use houston_agents_conversations;
pub use houston_db;
pub use houston_events;
pub use houston_scheduler;
pub use houston_terminal_manager;
pub use houston_ui_events;
