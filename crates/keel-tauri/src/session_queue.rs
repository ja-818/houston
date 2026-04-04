//! Message queue for sequential Claude sessions with automatic resume.
//!
//! `SessionQueue` ensures messages are processed one at a time per agent.
//! If a session is running, new messages queue up and run in order when
//! the current session finishes, using `--resume` for conversation continuity.
//!
//! Apps call `send()` and never worry about whether Claude is busy.

use crate::chat_session::ChatSessionState;
use crate::events::KeelEvent;
use crate::session_runner::PersistOptions;
use keel_sessions::{FeedItem, SessionManager, SessionStatus, SessionUpdate};
use std::path::PathBuf;
use tauri::Emitter;
use tokio::sync::mpsc;

/// A queued message waiting to be sent.
struct QueuedMessage {
    prompt: String,
}

/// Configuration for the session queue — set once, used for every message.
#[derive(Clone)]
pub struct SessionQueueConfig {
    pub session_key: String,
    pub working_dir: Option<PathBuf>,
    pub system_prompt: Option<String>,
    pub model: Option<String>,
    pub effort: Option<String>,
    pub chat_state: Option<ChatSessionState>,
    pub persist: Option<PersistOptions>,
}

/// A message queue that processes Claude sessions sequentially.
///
/// Clone-safe — all clones share the same underlying queue.
#[derive(Clone)]
pub struct SessionQueue {
    tx: mpsc::UnboundedSender<QueuedMessage>,
}

impl SessionQueue {
    /// Create a new session queue and spawn its processing loop.
    ///
    /// The queue processes messages one at a time. Each message starts a
    /// Claude session with `--resume` using the session ID from the previous
    /// message (tracked via `ChatSessionState`).
    pub fn new(app_handle: tauri::AppHandle, config: SessionQueueConfig) -> Self {
        let (tx, rx) = mpsc::unbounded_channel();

        tokio::spawn(queue_loop(app_handle, config, rx));

        Self { tx }
    }

    /// Queue a message. If Claude is idle, it starts immediately.
    /// If Claude is busy, it runs when the current session finishes.
    pub fn send(&self, prompt: String) -> Result<(), String> {
        self.tx
            .send(QueuedMessage { prompt })
            .map_err(|_| "Session queue closed".to_string())
    }
}

async fn queue_loop(
    app_handle: tauri::AppHandle,
    config: SessionQueueConfig,
    mut rx: mpsc::UnboundedReceiver<QueuedMessage>,
) {
    while let Some(msg) = rx.recv().await {
        // Get resume ID from previous session (if any).
        let resume_id = match &config.chat_state {
            Some(state) => state.get().await,
            None => None,
        };

        eprintln!(
            "[keel:queue] processing message, resume={:?}, prompt={}...",
            resume_id,
            &msg.prompt[..msg.prompt.len().min(60)]
        );

        // v2: get current session ID for session-keyed persistence.
        // On the first message this may be None (will be set by SessionUpdate::SessionId).
        // On subsequent messages (--resume), it's already available from the previous session.
        let mut current_session_id: Option<String> = match &config.chat_state {
            Some(state) => state.get().await,
            None => config.persist.as_ref().and_then(|p| p.claude_session_id.clone()),
        };

        // Persist user message to DB.
        if let Some(ref opts) = config.persist {
            let db = opts.db.clone();
            let data = serde_json::Value::String(msg.prompt.clone()).to_string();
            // v2: prefer session-keyed persistence when available.
            if let Some(ref sid) = current_session_id {
                let _ = db.add_chat_feed_item_by_session(sid, "user_message", &data, "desktop").await;
            } else {
                let pid = opts.project_id.clone();
                let fk = opts.feed_key.clone();
                let _ = db.add_chat_feed_item(&pid, &fk, "user_message", &data, "desktop").await;
            }
        }

        // Emit user message as feed item so the frontend sees it.
        let _ = app_handle.emit(
            "keel-event",
            KeelEvent::FeedItem {
                session_key: config.session_key.clone(),
                item: FeedItem::UserMessage(msg.prompt.clone()),
            },
        );

        // Spawn the Claude session.
        let (mut session_rx, _handle) = SessionManager::spawn_session(
            msg.prompt,
            resume_id,
            config.working_dir.clone(),
            config.model.clone(),
            config.effort.clone(),
            config.system_prompt.clone(),
            None,  // mcp_config
            false, // disable_builtin_tools
            false, // disable_all_tools
        );

        // Process events from this session.
        while let Some(update) = session_rx.recv().await {
            match update {
                SessionUpdate::Feed(ref item) => {
                    let _ = app_handle.emit(
                        "keel-event",
                        KeelEvent::FeedItem {
                            session_key: config.session_key.clone(),
                            item: item.clone(),
                        },
                    );
                    // Persist non-streaming items.
                    if let Some(ref opts) = config.persist {
                        if let Some((ft, dj)) = serialize_for_persist(item) {
                            let db = opts.db.clone();
                            let src = opts.source.clone();
                            // v2: prefer session-keyed persistence when available.
                            if let Some(ref sid) = current_session_id {
                                let sid = sid.clone();
                                tokio::spawn(async move {
                                    let _ = db
                                        .add_chat_feed_item_by_session(&sid, &ft, &dj, &src)
                                        .await;
                                });
                            } else {
                                let pid = opts.project_id.clone();
                                let fk = opts.feed_key.clone();
                                tokio::spawn(async move {
                                    let _ =
                                        db.add_chat_feed_item(&pid, &fk, &ft, &dj, &src).await;
                                });
                            }
                        }
                    }
                }
                SessionUpdate::SessionId(sid) => {
                    // Track session ID for subsequent persist calls in this message.
                    current_session_id = Some(sid.clone());
                    if let Some(ref state) = config.chat_state {
                        state.set(sid.clone()).await;
                    }
                    // Persist to disk so --resume survives app restarts.
                    if let Some(ref dir) = config.working_dir {
                        let session_file = dir.join(".claude_session_id");
                        std::fs::write(&session_file, &sid).ok();
                    }
                }
                SessionUpdate::Status(ref status) => {
                    let (status_str, err) = match status {
                        SessionStatus::Starting => ("starting".into(), None),
                        SessionStatus::Running => ("running".into(), None),
                        SessionStatus::Completed => ("completed".into(), None),
                        SessionStatus::Error(e) => ("error".into(), Some(e.clone())),
                    };
                    let _ = app_handle.emit(
                        "keel-event",
                        KeelEvent::SessionStatus {
                            session_key: config.session_key.clone(),
                            status: status_str,
                            error: err,
                        },
                    );
                }
                _ => {}
            }
        }

        eprintln!("[keel:queue] message done, checking for next...");
    }
    eprintln!("[keel:queue] queue closed");
}

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
        FeedItem::AssistantTextStreaming(_) | FeedItem::ThinkingStreaming(_) => None,
    }
}

fn json_str(s: &str) -> String {
    serde_json::Value::String(s.to_string()).to_string()
}
