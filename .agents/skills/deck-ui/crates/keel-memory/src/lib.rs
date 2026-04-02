//! keel-memory — Persistent memory system for AI agent desktop apps.
//!
//! Agents remember across sessions. Memories are stored in SQLite (via libsql)
//! with full-text search, and optionally mirrored as human-readable markdown
//! files that non-technical users can browse and manage.

pub mod compaction;
pub mod markdown;
mod migrations;
mod query;
pub mod store;
pub mod types;

// Re-export key types for convenience.
pub use compaction::{build_compaction_prompt, compaction_to_memory, CompactionConfig};
pub use markdown::{delete_memory_file, read_memory_file, write_memory_file};
pub use store::MemoryStore;
pub use types::{Memory, MemoryCategory, MemoryQuery};
