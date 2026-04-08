use crate::agent;
use houston_tauri::agent_sessions::AgentSessionMap;
use houston_tauri::events::HoustonEvent;
use houston_tauri::houston_sessions;
use houston_tauri::paths::expand_tilde;
use houston_tauri::session_pids::SessionPidMap;
use houston_tauri::session_runner::PersistOptions;
use houston_tauri::slack_sync::SlackSyncManager;
use houston_tauri::state::AppState;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, Manager, State};
use tokio::io::AsyncWriteExt;
use tokio::sync::RwLock;

#[tauri::command(rename_all = "snake_case")]
pub async fn send_message(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    agent_sessions: State<'_, AgentSessionMap>,
    pid_map: State<'_, SessionPidMap>,
    agent_path: String,
    prompt: String,
    session_key: Option<String>,
    source: Option<String>,
) -> Result<String, String> {
    let working_dir = expand_tilde(&PathBuf::from(&agent_path));
    tracing::info!("[houston:session] send_message agent_path={agent_path} working_dir={}", working_dir.display());
    if !working_dir.exists() {
        std::fs::create_dir_all(&working_dir)
            .map_err(|e| format!("Failed to create agent directory: {e}"))?;
    }
    agent::seed_agent(&working_dir)?;
    let mut system_prompt = agent::build_system_prompt(&working_dir);

    // Append Composio integration guidance to the system prompt.
    // We do NOT list specific connected services — the agent discovers those
    // via the Composio MCP tools at runtime. Listing a subset caused the agent
    // to treat it as exhaustive and refuse to use unlisted services.
    system_prompt.push_str(
        "\n\n---\n\n# Integrations — Composio\n\n\
         The user has Composio set up with connected integrations. \
         Use the Composio MCP tools (e.g. COMPOSIO_MANAGE_CONNECTIONS) to \
         discover which services are available and to initiate new connections.\n\n\
         When you use a Composio integration, record it by writing to \
         `.houston/integrations.json`. Read the current file first, then \
         append your toolkit name with `first_used_at`, `last_used_at` \
         (ISO-8601), and `use_count` fields. If the toolkit already \
         exists, increment `use_count` and update `last_used_at`.",
    );

    let source = source.unwrap_or_else(|| "desktop".to_string());
    let session_key = session_key.unwrap_or_else(|| "main".to_string());
    let agent_key = format!("{}:{}", working_dir.to_string_lossy(), session_key);
    let chat_state = agent_sessions
        .get_for_agent(&agent_key, &agent_path)
        .await;
    let resume_id = chat_state.get().await;
    tracing::debug!(
        "[houston:session] resume_id={:?} for key={}",
        resume_id, agent_key
    );

    let _ = state
        .db
        .add_chat_feed_item(
            &agent_key,
            &session_key,
            "user_message",
            &serde_json::Value::String(prompt.clone()).to_string(),
            &source,
        )
        .await;

    // If message came from Slack, emit a FeedItem so the Houston UI shows it
    if source == "slack" {
        let _ = app_handle.emit(
            "houston-event",
            houston_tauri::events::HoustonEvent::FeedItem {
                session_key: session_key.clone(),
                item: houston_sessions::FeedItem::UserMessage(prompt.clone()),
            },
        );
    }

    // If message came from Houston desktop, mirror it to Slack.
    // First message creates the thread (user's text as top-level post).
    // Subsequent messages post as thread replies under the user's identity.
    if source == "desktop" {
        let sync_mgr: State<'_, Arc<RwLock<SlackSyncManager>>> = app_handle.state();
        let agent_path_clone = agent_path.clone();
        let session_key_clone = session_key.clone();
        let prompt_clone = prompt.clone();
        let mgr = sync_mgr.inner().clone();
        tokio::spawn(async move {
            let mut mgr = mgr.write().await;

            // Check if thread already exists
            let existing_ts = mgr.session_for_agent(&agent_path_clone)
                .and_then(|s| houston_tauri::slack_sync::thread_map::find_thread(
                    &s.config, &session_key_clone,
                ))
                .map(|t| t.thread_ts.clone());

            if let Some(thread_ts) = existing_ts {
                // Thread exists — post user message as a reply
                if let Some(session) = mgr.session_for_agent(&agent_path_clone) {
                    let _ = houston_channels::slack::api::post_message_as(
                        &session.config.bot_token,
                        &session.config.slack_channel_id,
                        &prompt_clone,
                        Some(&thread_ts),
                        Some(&session.config.user_name),
                        session.config.user_avatar.as_deref(),
                    ).await;
                }
            } else {
                // No thread yet — create one with user's message as top-level post
                if let Err(e) = mgr.create_thread_for_user_message(
                    &agent_path_clone, &session_key_clone, &prompt_clone,
                ).await {
                    tracing::error!("[slack] failed to create thread: {e}");
                }
            }
        });
    }

    houston_tauri::session_runner::spawn_and_monitor(
        &app_handle,
        session_key.clone(),
        prompt,
        resume_id,
        Some(working_dir),
        Some(system_prompt),
        Some(chat_state),
        Some(PersistOptions {
            db: state.db.clone(),
            project_id: agent_key,
            feed_key: session_key.clone(),
            source: "desktop".into(),
            claude_session_id: None,
        }),
        Some(pid_map.inner().clone()),
    );

    Ok(session_key)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_chat_history(
    state: State<'_, AppState>,
    agent_path: String,
    session_key: Option<String>,
) -> Result<Vec<serde_json::Value>, String> {
    let working_dir = expand_tilde(&PathBuf::from(&agent_path));
    let session_file = working_dir.join(".claude_session_id");

    let base_key = working_dir.to_string_lossy().to_string();
    let sk = session_key.as_deref().unwrap_or("main");

    let agent_key = format!("{base_key}:{sk}");
    let mut v1_rows = state
        .db
        .list_chat_feed(&agent_key, sk)
        .await
        .map_err(|e| e.to_string())?;

    if sk != "main" {
        let legacy_key = format!("{base_key}:main");
        let legacy_rows = state
            .db
            .list_chat_feed(&legacy_key, "main")
            .await
            .unwrap_or_default();
        v1_rows.extend(legacy_rows);
    }

    let old_rows = state
        .db
        .list_chat_feed(&base_key, "main")
        .await
        .unwrap_or_default();
    v1_rows.extend(old_rows);

    if let Ok(id) = std::fs::read_to_string(&session_file) {
        let id = id.trim().to_string();
        if !id.is_empty() {
            let v2_rows = state
                .db
                .list_chat_feed_by_session(&id)
                .await
                .map_err(|e| e.to_string())?;
            v1_rows.extend(v2_rows);
        }
    }

    v1_rows.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));

    Ok(v1_rows
        .into_iter()
        .map(|row| {
            serde_json::json!({
                "feed_type": row.feed_type,
                "data": serde_json::from_str::<serde_json::Value>(&row.data_json)
                    .unwrap_or(serde_json::Value::String(row.data_json)),
            })
        })
        .collect())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_agent_file(
    agent_path: String,
    name: String,
) -> Result<String, String> {
    let dir = expand_tilde(&PathBuf::from(&agent_path));
    let path = dir.join(&name);
    std::fs::read_to_string(&path).map_err(|e| format!("Failed to read {name}: {e}"))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn write_agent_file(
    app_handle: tauri::AppHandle,
    agent_path: String,
    name: String,
    content: String,
) -> Result<(), String> {
    let dir = expand_tilde(&PathBuf::from(&agent_path));
    let path = dir.join(&name);
    std::fs::write(&path, &content).map_err(|e| format!("Failed to write {name}: {e}"))?;
    if name == "CLAUDE.md" || name.starts_with(".houston/prompts/") {
        let _ = app_handle.emit("houston-event", houston_tauri::events::HoustonEvent::ContextChanged {
            agent_path: agent_path.clone(),
        });
    }
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn stop_session(
    app_handle: tauri::AppHandle,
    pid_map: State<'_, SessionPidMap>,
    session_key: String,
) -> Result<(), String> {
    if let Some(pid) = pid_map.remove(&session_key).await {
        tracing::info!("[houston:session] stopping session {session_key} (pid {pid})");
        // Kill the Claude CLI process
        std::process::Command::new("kill")
            .arg("-TERM")
            .arg(pid.to_string())
            .output()
            .ok();

        // Emit "Stopped by user" so the UI shows a message
        let _ = app_handle.emit(
            "houston-event",
            HoustonEvent::FeedItem {
                session_key: session_key.clone(),
                item: houston_sessions::FeedItem::SystemMessage(
                    "Stopped by user".into(),
                ),
            },
        );
        let _ = app_handle.emit(
            "houston-event",
            HoustonEvent::SessionStatus {
                session_key,
                status: "completed".into(),
                error: None,
            },
        );
    }
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SummarizeResult {
    pub title: String,
    pub description: String,
}

/// Quick Haiku call to generate a concise title + description for an activity.
#[tauri::command(rename_all = "snake_case")]
pub async fn summarize_activity(message: String) -> Result<SummarizeResult, String> {
    let prompt = format!(
        "Generate a title and description for this task.\n\
         Title: max 6 words, concise. Description: 1 short sentence.\n\
         Return ONLY valid JSON, no markdown fences:\n\
         {{\"title\": \"...\", \"description\": \"...\"}}\n\n\
         Task: {message}"
    );

    let mut cmd = tokio::process::Command::new("claude");
    cmd.env("PATH", houston_sessions::claude_path::shell_path());
    cmd.env_remove("CLAUDE_CODE_ENTRYPOINT");
    cmd.env_remove("CLAUDECODE");
    cmd.arg("-p")
        .arg("--model")
        .arg("haiku")
        .arg("--output-format")
        .arg("text")
        .arg("--allowedTools")
        .arg("");
    cmd.stdin(std::process::Stdio::piped());
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::null());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn claude: {e}"))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(prompt.as_bytes())
            .await
            .map_err(|e| format!("Failed to write prompt: {e}"))?;
        drop(stdin);
    }

    let output = child
        .wait_with_output()
        .await
        .map_err(|e| format!("Claude process failed: {e}"))?;

    let raw = String::from_utf8_lossy(&output.stdout).trim().to_string();

    // Strip markdown code fences if haiku wraps the JSON
    let json_str = raw
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    serde_json::from_str(json_str)
        .map_err(|e| format!("Failed to parse response: {e}\nRaw: {raw}"))
}
