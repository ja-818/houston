use crate::workspace;
use houston_tauri::agent_sessions::AgentSessionMap;
use houston_tauri::session_runner::PersistOptions;
use houston_tauri::state::AppState;
use std::path::PathBuf;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn start_session(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    agent_sessions: State<'_, AgentSessionMap>,
    workspace_path: String,
    prompt: String,
) -> Result<String, String> {
    let working_dir = PathBuf::from(&workspace_path);
    if !working_dir.exists() {
        std::fs::create_dir_all(&working_dir)
            .map_err(|e| format!("Failed to create workspace: {e}"))?;
    }
    workspace::seed_workspace(&working_dir)?;
    let system_prompt = workspace::build_system_prompt(&working_dir);

    let agent_key = working_dir.to_string_lossy().to_string();
    let chat_state = agent_sessions
        .get_for_agent(&agent_key, &workspace_path)
        .await;
    let resume_id = chat_state.get().await;
    eprintln!(
        "[houston:session] resume_id={:?} for agent={}",
        resume_id, agent_key
    );

    let session_key = "main".to_string();

    // Persist user message via v1 path (before session ID is known).
    let _ = state
        .db
        .add_chat_feed_item(
            &agent_key,
            "main",
            "user_message",
            &serde_json::Value::String(prompt.clone()).to_string(),
            "desktop",
        )
        .await;

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
            feed_key: "main".into(),
            source: "desktop".into(),
            claude_session_id: None,
        }),
    );

    Ok(session_key)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn stop_session() -> Result<(), String> {
    // Currently a no-op — the session runner manages its own lifecycle.
    // Placeholder for future cancellation support.
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_chat_history(
    state: State<'_, AppState>,
    workspace_path: String,
) -> Result<Vec<serde_json::Value>, String> {
    let working_dir = PathBuf::from(&workspace_path);
    let session_file = working_dir.join(".claude_session_id");

    // Load from both v1 (agent_key + feed_key) and v2 (claude_session_id) sources.
    let agent_key = working_dir.to_string_lossy().to_string();
    let mut rows = state
        .db
        .list_chat_feed(&agent_key, "main")
        .await
        .map_err(|e| e.to_string())?;

    if let Ok(id) = std::fs::read_to_string(&session_file) {
        let id = id.trim().to_string();
        if !id.is_empty() {
            let v2_rows = state
                .db
                .list_chat_feed_by_session(&id)
                .await
                .map_err(|e| e.to_string())?;
            rows.extend(v2_rows);
        }
    }

    // Sort by timestamp and return.
    rows.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));

    Ok(rows
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
