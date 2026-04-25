//! houston-db — SQLite database layer for AI agent desktop apps.
//!
//! Provides local SQLite database setup (via libsql), base table migrations,
//! and repository functions for chat feed items and preferences.
//!
//! ## Tables
//!
//! - `chat_feed` — persisted chat conversation items (keyed by claude_session_id)
//! - `preferences` — app-level key/value settings
//! - `engine_tokens` — device-scoped bearer tokens minted during pairing

pub mod db;
mod migrations;
pub mod repo_chat_feed;
pub mod repo_engine_tokens;
pub mod repo_search;

// Re-export key types for convenience.
pub use db::Database;
pub use repo_chat_feed::ChatFeedRow;
pub use repo_engine_tokens::EngineTokenRow;
pub use repo_search::{
    sanitize_fts_query, SearchResult, SessionMetadata, SessionSearchResult,
};
