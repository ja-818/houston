//! houston-tauri — Tauri plugin wrapping houston crates for AI agent desktop apps.
//!
//! Provides generic AppState, event types, and a session supervisor
//! for Tauri 2 desktop apps built with the Houston framework.

pub mod session_id_tracker;
pub mod composio;
pub mod composio_apps;
pub mod composio_auth;
pub mod composio_cli;
pub mod composio_commands;
pub mod composio_install;
pub mod composio_lifecycle;
pub mod events;
pub mod paths;
pub mod self_improvement;
pub mod session_pids;
pub mod session_runner;
pub mod state;
pub mod supervisor;
pub mod tray;
pub mod agent;
pub mod agent_commands;
pub mod agent_files;
pub mod agent_store;
pub mod agent_watcher;
pub mod conversations;

// Re-export sub-crates for convenience.
pub use houston_agent_files;
pub use houston_db;
pub use houston_sessions;
pub use houston_events;
pub use houston_scheduler;
