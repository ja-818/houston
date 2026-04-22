//! Conversation listing — derived view over `.houston/activity/activity.json`.
//!
//! Every conversation is an activity with a UUID-scoped session key
//! (`activity-{id}`). This module reads the JSON file directly via
//! `houston_agent_files` so it does not depend on the full agent_store
//! layer. Phase 2 slice 4 will move the activity writer here too and
//! collapse the duplication with `app/houston-tauri/src/agent_store/`.

use crate::error::{CoreError, CoreResult};
use houston_agent_files as files;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Minimal view of an activity entry — only the fields conversations need.
#[derive(Debug, Clone, Deserialize)]
struct ActivityRow {
    id: String,
    #[serde(default)]
    title: String,
    #[serde(default)]
    description: String,
    #[serde(default)]
    status: String,
    #[serde(default)]
    updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationEntry {
    pub id: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    /// Always `"activity"` today. Field kept for forward compatibility.
    #[serde(rename = "type")]
    pub entry_type: String,
    /// Session key used to address this conversation (`activity-{id}`).
    pub session_key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
    /// Absolute path to the agent folder this conversation belongs to.
    pub agent_path: String,
    /// Human-readable agent name.
    pub agent_name: String,
}

fn read_activities(root: &Path) -> CoreResult<Vec<ActivityRow>> {
    let contents = files::read_file(root, ".houston/activity/activity.json")
        .map_err(|e| CoreError::Internal(format!("failed to read activity.json: {e}")))?;
    if contents.is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str::<Vec<ActivityRow>>(&contents).map_err(Into::into)
}

/// List every conversation in a single agent, most-recently-updated first.
pub fn list(root: &Path) -> CoreResult<Vec<ConversationEntry>> {
    let agent_path_str = root.to_string_lossy().into_owned();
    let agent_name_str = root
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();

    let mut rows = read_activities(root)?;
    rows.sort_by(|a, b| {
        let a_t = a.updated_at.as_deref().unwrap_or("");
        let b_t = b.updated_at.as_deref().unwrap_or("");
        b_t.cmp(a_t)
    });

    Ok(rows
        .into_iter()
        .map(|row| ConversationEntry {
            session_key: format!("activity-{}", row.id),
            id: row.id,
            title: row.title,
            description: Some(row.description).filter(|d| !d.is_empty()),
            status: Some(row.status),
            entry_type: "activity".to_string(),
            updated_at: row.updated_at,
            agent_path: agent_path_str.clone(),
            agent_name: agent_name_str.clone(),
        })
        .collect())
}

/// Aggregate conversations across many agents, most-recent first.
///
/// Errors on individual agents are logged and skipped — one bad agent
/// does not poison the aggregate view.
pub fn list_all(roots: &[&Path]) -> CoreResult<Vec<ConversationEntry>> {
    let mut all = Vec::new();
    for root in roots {
        match list(root) {
            Ok(entries) => all.extend(entries),
            Err(e) => tracing::warn!("[conversations] skipping {}: {e}", root.display()),
        }
    }
    all.sort_by(|a, b| {
        let a_t = a.updated_at.as_deref().unwrap_or("");
        let b_t = b.updated_at.as_deref().unwrap_or("");
        b_t.cmp(a_t)
    });
    Ok(all)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn seed(dir: &Path, activities: serde_json::Value) {
        let rel = dir.join(".houston").join("activity");
        fs::create_dir_all(&rel).unwrap();
        fs::write(
            rel.join("activity.json"),
            serde_json::to_string_pretty(&activities).unwrap(),
        )
        .unwrap();
    }

    #[test]
    fn empty_when_missing() {
        let d = TempDir::new().unwrap();
        assert!(list(d.path()).unwrap().is_empty());
    }

    #[test]
    fn list_sorted_desc() {
        let d = TempDir::new().unwrap();
        seed(
            d.path(),
            serde_json::json!([
                { "id": "a", "title": "Old",   "description": "",  "status": "done",    "updated_at": "2025-01-01T00:00:00Z" },
                { "id": "b", "title": "Newer", "description": "d", "status": "running", "updated_at": "2026-02-02T00:00:00Z" },
            ]),
        );
        let entries = list(d.path()).unwrap();
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].id, "b");
        assert_eq!(entries[0].session_key, "activity-b");
        assert_eq!(entries[0].entry_type, "activity");
        assert_eq!(entries[0].description.as_deref(), Some("d"));
        assert_eq!(entries[1].description, None); // empty description → None
    }

    #[test]
    fn list_all_aggregates() {
        let d1 = TempDir::new().unwrap();
        let d2 = TempDir::new().unwrap();
        seed(
            d1.path(),
            serde_json::json!([
                { "id": "x", "title": "X", "description": "", "status": "done",
                  "updated_at": "2026-01-01T00:00:00Z" }
            ]),
        );
        seed(
            d2.path(),
            serde_json::json!([
                { "id": "y", "title": "Y", "description": "", "status": "done",
                  "updated_at": "2026-03-01T00:00:00Z" }
            ]),
        );
        let roots: Vec<&Path> = vec![d1.path(), d2.path()];
        let all = list_all(&roots).unwrap();
        assert_eq!(all.len(), 2);
        assert_eq!(all[0].id, "y");
    }
}
