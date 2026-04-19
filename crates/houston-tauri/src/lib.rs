//! houston-tauri — Tauri plugin wrapping houston crates for AI agent desktop apps.
//!
//! Provides Tauri command handlers, managed state, and app-level glue.
//! Heavier concerns live in sibling crates: event types in `houston-ui-events`,
//! conversation orchestration in `houston-agents-conversations`, etc.

pub mod paths;
pub mod self_improvement;
pub mod state;
pub mod tray;
pub mod agent;
pub mod agent_commands;
pub mod agent_files;
pub mod agent_store;
pub mod conversations;

// Re-export sub-crates for convenience.
pub use houston_agent_files;
pub use houston_agents_conversations;
pub use houston_db;
pub use houston_events;
pub use houston_scheduler;
pub use houston_terminal_manager;
pub use houston_ui_events;
