//! Tauri proxy — delegates to `houston_engine_core::conversations`.
//!
//! The engine crate owns the canonical logic. This layer exists only to
//! expose it as a `#[tauri::command]` until the frontend talks to the
//! engine server directly (Phase 3).

use crate::paths::expand_tilde;
use houston_engine_core::conversations::{self, ConversationEntry};
use std::path::PathBuf;

fn resolve(agent_path: &str) -> PathBuf {
    expand_tilde(&PathBuf::from(agent_path))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_conversations(agent_path: String) -> Result<Vec<ConversationEntry>, String> {
    let root = resolve(&agent_path);
    conversations::list(&root).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_all_conversations(
    agent_paths: Vec<String>,
) -> Result<Vec<ConversationEntry>, String> {
    let roots: Vec<PathBuf> = agent_paths.iter().map(|p| resolve(p)).collect();
    let refs: Vec<&std::path::Path> = roots.iter().map(|p| p.as_path()).collect();
    conversations::list_all(&refs).map_err(|e| e.to_string())
}
