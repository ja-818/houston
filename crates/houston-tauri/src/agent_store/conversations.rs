//! Unified conversation listing: primary chat + activity conversations.

use super::activity;
use super::types::ConversationEntry;
use std::fs;
use std::path::Path;

/// Return every conversation in a single agent.
///
/// The first entry is the primary chat (`session_key = "main"`).
/// Activity conversations follow, ordered by most-recently-updated first.
pub fn list(root: &Path) -> Result<Vec<ConversationEntry>, String> {
    let agent_path_str = root.to_string_lossy().to_string();
    let agent_name_str = root
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let mut entries = Vec::new();

    // Primary chat — use .claude_session_id mtime as updated_at.
    let session_file = root.join(".claude_session_id");
    let primary_updated = fs::metadata(&session_file)
        .ok()
        .and_then(|m| m.modified().ok())
        .map(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339());

    // Only include primary chat if it has been used
    if primary_updated.is_some() {
        entries.push(ConversationEntry {
            id: format!("primary:{agent_path_str}"),
            title: "Primary chat".to_string(),
            status: None,
            entry_type: "primary".to_string(),
            session_key: "main".to_string(),
            updated_at: primary_updated,
            agent_path: agent_path_str.clone(),
            agent_name: agent_name_str.clone(),
        });
    }

    // Activity conversations — sorted by updated_at descending.
    let mut activities = activity::list(root).unwrap_or_default();
    activities.sort_by(|a, b| {
        let a_time = a.updated_at.as_deref().unwrap_or("");
        let b_time = b.updated_at.as_deref().unwrap_or("");
        b_time.cmp(a_time)
    });

    for entry in activities {
        entries.push(ConversationEntry {
            id: entry.id.clone(),
            title: entry.title,
            status: Some(entry.status),
            entry_type: "activity".to_string(),
            session_key: format!("activity-{}", entry.id),
            updated_at: entry.updated_at,
            agent_path: agent_path_str.clone(),
            agent_name: agent_name_str.clone(),
        });
    }

    Ok(entries)
}

/// Aggregate conversations across multiple agents.
///
/// Returns all entries sorted by updated_at descending (most recent first).
pub fn list_all(roots: &[&Path]) -> Result<Vec<ConversationEntry>, String> {
    let mut all = Vec::new();
    for root in roots {
        match list(root) {
            Ok(entries) => all.extend(entries),
            Err(e) => eprintln!("[conversations] skipping {}: {e}", root.display()),
        }
    }
    // Sort: entries with updated_at first (descending), then entries without
    all.sort_by(|a, b| {
        let a_time = a.updated_at.as_deref().unwrap_or("");
        let b_time = b.updated_at.as_deref().unwrap_or("");
        b_time.cmp(a_time)
    });
    Ok(all)
}
