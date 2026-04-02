//! keel-sessions — Claude/Codex CLI process management.
//!
//! Provides session spawning, NDJSON stream parsing, event pumping,
//! concurrency control, and PATH resolution for AI CLI tools.

pub mod claude_path;
pub mod concurrency;
pub mod manager;
pub mod parser;
pub mod session_io;
pub mod session_pump;
pub mod types;

// Re-export key types for convenience.
pub use manager::{SessionHandle, SessionManager, SessionUpdate};
pub use parser::{parse_event, extract_session_id, StreamAccumulator};
pub use types::{ClaudeEvent, ContentBlock, FeedItem, SessionFeedBuffer, SessionStatus};
