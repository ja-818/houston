//! Generic session lifecycle: spawn → monitor → emit events → persist → collect response.
//!
//! Replaces the duplicated "spawn + tokio::spawn + match update" pattern
//! that both Houston and DesktopClaw implement manually.

use crate::chat_session::ChatSessionState;
use crate::events::KeelEvent;
use keel_db::Database;
use keel_sessions::{FeedItem, SessionManager, SessionStatus, SessionUpdate};
use std::path::PathBuf;
use tauri::Emitter;

/// Result of a completed session.
pub struct SessionResult {
    pub response_text: Option<String>,
    pub claude_session_id: Option<String>,
    pub error: Option<String>,
}

/// Options for feed persistence.
pub struct PersistOptions {
    pub db: Database,
    pub project_id: String,
    pub feed_key: String,
    pub source: String,
}

/// Spawn a Claude session, emit events, optionally persist feed items, and return
/// a JoinHandle that resolves to the final response.
pub fn spawn_and_monitor(
    app_handle: &tauri::AppHandle,
    session_key: String,
    prompt: String,
    resume_id: Option<String>,
    working_dir: Option<PathBuf>,
    system_prompt: Option<String>,
    chat_state: Option<ChatSessionState>,
    persist: Option<PersistOptions>,
) -> tokio::task::JoinHandle<SessionResult> {
    let (mut rx, _handle) = SessionManager::spawn_session(
        prompt,
        resume_id,
        working_dir,
        None,  // model
        None,  // effort
        system_prompt,
        None,  // mcp_config
        false, // disable_builtin_tools
        false, // disable_all_tools
    );

    let handle = app_handle.clone();
    let key = session_key;
    tokio::spawn(async move {
        let mut response_text: Option<String> = None;
        let mut claude_session_id: Option<String> = None;
        let mut error: Option<String> = None;

        while let Some(update) = rx.recv().await {
            match update {
                SessionUpdate::Feed(ref item) => {
                    if let FeedItem::AssistantText(text) = item {
                        response_text = Some(text.clone());
                    }
                    let _ = handle.emit(
                        "keel-event",
                        KeelEvent::FeedItem {
                            session_key: key.clone(),
                            item: item.clone(),
                        },
                    );
                    // Persist non-streaming items to DB.
                    if let Some(ref opts) = persist {
                        if let Some((ft, dj)) = serialize_for_persist(item) {
                            let db = opts.db.clone();
                            let pid = opts.project_id.clone();
                            let fk = opts.feed_key.clone();
                            let src = opts.source.clone();
                            tokio::spawn(async move {
                                let _ = db.add_chat_feed_item(&pid, &fk, &ft, &dj, &src).await;
                            });
                        }
                    }
                }
                SessionUpdate::SessionId(sid) => {
                    claude_session_id = Some(sid.clone());
                    if let Some(ref state) = chat_state {
                        state.set(sid).await;
                    }
                }
                SessionUpdate::Status(ref status) => {
                    let (status_str, err) = match status {
                        SessionStatus::Starting => ("starting".into(), None),
                        SessionStatus::Running => ("running".into(), None),
                        SessionStatus::Completed => ("completed".into(), None),
                        SessionStatus::Error(e) => {
                            error = Some(e.clone());
                            ("error".into(), Some(e.clone()))
                        }
                    };
                    let _ = handle.emit(
                        "keel-event",
                        KeelEvent::SessionStatus {
                            session_key: key.clone(),
                            status: status_str,
                            error: err,
                        },
                    );
                }
                _ => {}
            }
        }

        SessionResult {
            response_text,
            claude_session_id,
            error,
        }
    })
}

/// Serialize a FeedItem for DB persistence. Returns None for streaming items
/// (they get replaced by their final versions).
fn serialize_for_persist(item: &FeedItem) -> Option<(String, String)> {
    match item {
        FeedItem::AssistantText(t) => Some(("assistant_text".into(), json_str(t))),
        FeedItem::UserMessage(t) => Some(("user_message".into(), json_str(t))),
        FeedItem::ToolCall { name, input } => {
            let data = serde_json::json!({ "name": name, "input": input });
            Some(("tool_call".into(), data.to_string()))
        }
        FeedItem::ToolResult { content, is_error } => {
            let data = serde_json::json!({ "content": content, "is_error": is_error });
            Some(("tool_result".into(), data.to_string()))
        }
        FeedItem::SystemMessage(t) => Some(("system_message".into(), json_str(t))),
        FeedItem::FinalResult { result, cost_usd, duration_ms } => {
            let data = serde_json::json!({
                "result": result, "cost_usd": cost_usd, "duration_ms": duration_ms
            });
            Some(("final_result".into(), data.to_string()))
        }
        FeedItem::Thinking(t) => Some(("thinking".into(), json_str(t))),
        // Skip streaming items — they get replaced by finals.
        FeedItem::AssistantTextStreaming(_) | FeedItem::ThinkingStreaming(_) => None,
    }
}

fn json_str(s: &str) -> String {
    serde_json::Value::String(s.to_string()).to_string()
}
