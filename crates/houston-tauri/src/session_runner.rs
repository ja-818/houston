//! Generic session lifecycle: spawn → monitor → emit events → persist → collect response.
//!
//! Replaces the duplicated "spawn + tokio::spawn + match update" pattern
//! that apps previously implemented manually.

use crate::chat_session::ChatSessionState;
use crate::events::HoustonEvent;
use crate::session_pids::SessionPidMap;
use houston_db::Database;
use houston_sessions::{FeedItem, Provider, SessionManager, SessionStatus, SessionUpdate};
use std::path::PathBuf;
use tauri::Emitter;

/// Result of a completed session.
pub struct SessionResult {
    pub response_text: Option<String>,
    pub claude_session_id: Option<String>,
    pub error: Option<String>,
}

/// Options for feed persistence.
#[derive(Clone)]
pub struct PersistOptions {
    pub db: Database,
    pub source: String,
    /// The user message that started this turn. Persisted once the Claude
    /// session ID is known. Runner consumes this on SessionUpdate::SessionId.
    pub user_message: Option<String>,
    /// Set automatically once the session reports its ID via
    /// SessionUpdate::SessionId. Do not set manually.
    pub claude_session_id: Option<String>,
}

/// Spawn a Claude session, emit events, optionally persist feed items, and return
/// a JoinHandle that resolves to the final response.
///
/// Automatically calls `claude_path::init()` (idempotent via `OnceLock`)
/// so apps don't need to remember to initialize PATH resolution.
pub fn spawn_and_monitor(
    app_handle: &tauri::AppHandle,
    agent_path: String,
    session_key: String,
    prompt: String,
    resume_id: Option<String>,
    working_dir: PathBuf,
    system_prompt: Option<String>,
    chat_state: Option<ChatSessionState>,
    persist: Option<PersistOptions>,
    pid_map: Option<SessionPidMap>,
    provider: Provider,
    model: Option<String>,
) -> tokio::task::JoinHandle<SessionResult> {
    // Ensure the user's shell PATH is resolved before spawning.
    // OnceLock inside init() makes this a no-op after the first call.
    houston_sessions::claude_path::init();

    // Clone working_dir — needed for per-session .sid persistence after spawn_session consumes one copy.
    let persist_dir = working_dir.clone();

    let (mut rx, _handle) = SessionManager::spawn_session(
        provider,
        prompt,
        resume_id,
        Some(working_dir),
        model,
        None,  // effort
        system_prompt,
        None,  // mcp_config
        false, // disable_builtin_tools
        false, // disable_all_tools
    );

    let handle = app_handle.clone();
    let key = session_key;
    let agent_path_for_events = agent_path;
    let working_dir = persist_dir;
    let mut persist = persist;
    tokio::spawn(async move {
        let mut response_text: Option<String> = None;
        let mut claude_session_id: Option<String> = None;
        let mut error: Option<String> = None;

        while let Some(update) = rx.recv().await {
            match update {
                SessionUpdate::ProcessPid(pid) => {
                    if let Some(ref pm) = pid_map {
                        pm.insert(key.clone(), pid).await;
                    }
                    continue;
                }
                SessionUpdate::Feed(ref item) => {
                    if let FeedItem::AssistantText(text) = item {
                        response_text = Some(text.clone());
                    }
                    let _ = handle.emit(
                        "houston-event",
                        HoustonEvent::FeedItem {
                            agent_path: agent_path_for_events.clone(),
                            session_key: key.clone(),
                            item: item.clone(),
                        },
                    );
                    // Persist non-streaming items once the Claude session id is known.
                    if let Some(ref opts) = persist {
                        if let (Some(sid), Some((ft, dj))) =
                            (opts.claude_session_id.as_ref(), serialize_for_persist(item))
                        {
                            let db = opts.db.clone();
                            let src = opts.source.clone();
                            let sid = sid.clone();
                            tokio::spawn(async move {
                                let _ = db
                                    .add_chat_feed_item_by_session(&sid, &ft, &dj, &src)
                                    .await;
                            });
                        }
                    }
                }
                SessionUpdate::SessionId(sid) => {
                    claude_session_id = Some(sid.clone());
                    if let Some(ref state) = chat_state {
                        state.set(sid.clone()).await;
                    }
                    // Track the session ID and persist the pending user message.
                    if let Some(ref mut opts) = persist {
                        opts.claude_session_id = Some(sid.clone());
                        if let Some(user_msg) = opts.user_message.take() {
                            let db = opts.db.clone();
                            let src = opts.source.clone();
                            let sid_clone = sid.clone();
                            let data = serde_json::Value::String(user_msg).to_string();
                            tokio::spawn(async move {
                                let _ = db
                                    .add_chat_feed_item_by_session(
                                        &sid_clone,
                                        "user_message",
                                        &data,
                                        &src,
                                    )
                                    .await;
                            });
                        }
                    }
                    // Persist session id to disk so --resume survives app restarts.
                    // Every session is scoped by session_key — no shared file.
                    let sessions_dir = working_dir.join(".houston").join("sessions");
                    std::fs::create_dir_all(&sessions_dir).ok();
                    let sid_file = sessions_dir.join(format!("{key}.sid"));
                    std::fs::write(&sid_file, &sid).ok();
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
                        "houston-event",
                        HoustonEvent::SessionStatus {
                            agent_path: agent_path_for_events.clone(),
                            session_key: key.clone(),
                            status: status_str,
                            error: err,
                        },
                    );
                }
            }
        }

        // Clean up PID tracking on completion
        if let Some(ref pm) = pid_map {
            pm.remove(&key).await;
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
