use crate::agent;
use houston_tauri::agent_sessions::AgentSessionMap;
use houston_tauri::houston_sessions;
use houston_tauri::paths::expand_tilde;
use houston_tauri::session_runner::PersistOptions;
use houston_tauri::slack_sync::SlackSyncManager;
use houston_tauri::state::AppState;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, Manager, State};
use tokio::sync::RwLock;

#[tauri::command(rename_all = "snake_case")]
pub async fn send_message(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    agent_sessions: State<'_, AgentSessionMap>,
    agent_path: String,
    prompt: String,
    session_key: Option<String>,
    source: Option<String>,
) -> Result<String, String> {
    let working_dir = expand_tilde(&PathBuf::from(&agent_path));
    if !working_dir.exists() {
        std::fs::create_dir_all(&working_dir)
            .map_err(|e| format!("Failed to create agent directory: {e}"))?;
    }
    agent::seed_agent(&working_dir)?;
    let system_prompt = agent::build_system_prompt(&working_dir);

    let source = source.unwrap_or_else(|| "desktop".to_string());
    let session_key = session_key.unwrap_or_else(|| "main".to_string());
    let agent_key = format!("{}:{}", working_dir.to_string_lossy(), session_key);
    let chat_state = agent_sessions
        .get_for_agent(&agent_key, &agent_path)
        .await;
    let resume_id = chat_state.get().await;
    eprintln!(
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

    // If message came from Houston desktop, mirror it to Slack
    if source == "desktop" {
        let sync_mgr: State<'_, Arc<RwLock<SlackSyncManager>>> = app_handle.state();
        let agent_path_clone = agent_path.clone();
        let session_key_clone = session_key.clone();
        let prompt_clone = prompt.clone();
        let mgr = sync_mgr.inner().clone();
        tokio::spawn(async move {
            let mgr: tokio::sync::RwLockReadGuard<'_, SlackSyncManager> = mgr.read().await;
            if let Some(session) = mgr.session_for_agent(&agent_path_clone) {
                if let Some(thread) = houston_tauri::slack_sync::thread_map::find_thread(
                    &session.config,
                    &session_key_clone,
                ) {
                    // Post as the user (their name + avatar) so Slack shows a real conversation
                    let _ = houston_channels::slack::api::post_message_as(
                        &session.config.bot_token,
                        &session.config.slack_channel_id,
                        &prompt_clone,
                        Some(&thread.thread_ts),
                        Some(&session.config.user_name),
                        session.config.user_avatar.as_deref(),
                    )
                    .await;
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
