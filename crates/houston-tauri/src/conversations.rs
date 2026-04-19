//! Tauri commands for listing conversations across agents.
//!
//! Conversations are a derived view over activity.json — each activity row
//! maps to one conversation, keyed by `activity-<id>`.

use crate::agent_store::conversations as store;
use crate::agent_store::types::ConversationEntry;
use crate::paths::expand_tilde;
use std::path::PathBuf;

fn resolve(agent_path: &str) -> PathBuf {
    expand_tilde(&PathBuf::from(agent_path))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_conversations(agent_path: String) -> Result<Vec<ConversationEntry>, String> {
    let root = resolve(&agent_path);
    store::list(&root)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_all_conversations(
    agent_paths: Vec<String>,
) -> Result<Vec<ConversationEntry>, String> {
    let roots: Vec<PathBuf> = agent_paths.iter().map(|p| resolve(p)).collect();
    let refs: Vec<&std::path::Path> = roots.iter().map(|p| p.as_path()).collect();
    store::list_all(&refs)
}
