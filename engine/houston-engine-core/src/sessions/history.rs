//! Chat history read — relocated from `app/src-tauri/src/commands/chat.rs`.
//!
//! Given an agent path + session key, resolves the Claude session ID recorded
//! under `.houston/sessions/<key>.sid` and loads the associated chat-feed
//! rows from the engine DB. Transport-neutral: REST handlers and tests call
//! it the same way.

use crate::error::{CoreError, CoreResult};
use houston_agents_conversations::session_id_tracker::session_id_path;
use houston_db::Database;
use serde::Serialize;
use std::path::Path;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct ChatHistoryEntry {
    pub feed_type: String,
    pub data: serde_json::Value,
}

pub async fn load(
    db: &Database,
    working_dir: &Path,
    session_key: &str,
) -> CoreResult<Vec<ChatHistoryEntry>> {
    let sid_path = session_id_path(working_dir, session_key);
    let Some(claude_session_id) = std::fs::read_to_string(&sid_path)
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
    else {
        return Ok(Vec::new());
    };

    let mut rows = db
        .list_chat_feed_by_session(&claude_session_id)
        .await
        .map_err(|e| CoreError::Internal(e.to_string()))?;

    rows.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));

    Ok(rows
        .into_iter()
        .map(|row| {
            let data = serde_json::from_str::<serde_json::Value>(&row.data_json)
                .unwrap_or(serde_json::Value::String(row.data_json));
            ChatHistoryEntry {
                feed_type: row.feed_type,
                data,
            }
        })
        .collect())
}
