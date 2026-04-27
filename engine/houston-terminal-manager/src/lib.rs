//! houston-terminal-manager — Claude/Codex CLI process management.
//!
//! Provides session spawning, NDJSON stream parsing, event pumping,
//! concurrency control, and PATH resolution for AI CLI tools.

pub mod auth_error;
pub mod claude_path;
pub mod codex_parser;
pub mod concurrency;
pub mod manager;
pub mod parser;
pub mod session_io;
pub mod session_pump;
pub mod types;

// Re-export key types for convenience.
pub use codex_parser::{extract_thread_id, parse_codex_event, CodexAccumulator};
pub use manager::{SessionHandle, SessionManager, SessionUpdate};
pub use parser::{extract_session_id, parse_event, StreamAccumulator};
pub use types::{
    ClaudeEvent, ContentBlock, FeedItem, FileChanges, Provider, SessionFeedBuffer, SessionStatus,
};
