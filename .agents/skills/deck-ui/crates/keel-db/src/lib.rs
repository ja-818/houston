//! keel-db — SQLite database layer for AI agent desktop apps.
//!
//! Provides local SQLite database setup (via libsql), base table migrations,
//! and repository functions for projects, issues, sessions, and feed items.

pub mod db;
mod migrations;
pub mod issue_types;
pub mod models;
pub mod repo_chat_feed;
pub mod repo_issue_deps;
pub mod repo_issue_feed;
pub mod repo_issues;
pub mod repo_issues_update;
pub mod repo_projects;
pub mod repo_routine_runs;
pub mod repo_routines;
pub mod repo_session_events;
pub mod repo_sessions;

// Re-export key types for convenience.
pub use db::Database;
pub use issue_types::IssueStatus;
pub use models::{Issue, Project, Routine, RoutineRun, Session, SessionEvent};
pub use repo_chat_feed::ChatFeedRow;
pub use repo_issue_feed::IssueFeedRow;
