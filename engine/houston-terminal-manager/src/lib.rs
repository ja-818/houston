//! houston-terminal-manager — Claude/Codex CLI process management.
//!
//! Provides session spawning, NDJSON stream parsing, event pumping,
//! concurrency control, and PATH resolution for AI CLI tools.

pub mod claude_path;
pub mod codex_parser;
pub mod concurrency;
pub mod manager;
pub mod parser;
pub mod session_io;
pub mod session_pump;
pub mod types;

// Re-export key types for convenience.
pub use manager::{SessionHandle, SessionManager, SessionUpdate};
pub use parser::{parse_event, extract_session_id, StreamAccumulator};
pub use codex_parser::{parse_codex_event, extract_thread_id, CodexAccumulator};
pub use types::{ClaudeEvent, ContentBlock, FeedItem, Provider, SessionFeedBuffer, SessionStatus};
