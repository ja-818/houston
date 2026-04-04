use crate::workspace;
use crate::AgentSessionMap;
use keel_tauri::paths::expand_tilde;
use keel_tauri::session_runner::PersistOptions;
use keel_tauri::state::AppState;
use std::path::PathBuf;
use tauri::State;

/// Ensure the workspace folder exists and is seeded with CLAUDE.md.
/// Called on project load so files are ready before the user sends a message.
#[tauri::command]
pub async fn ensure_workspace(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<(), String> {
    let project = state
        .db
        .get_project(&project_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Project not found".to_string())?;

    let working_dir = expand_tilde(&PathBuf::from(&project.folder_path));
    if !working_dir.exists() {
        std::fs::create_dir_all(&working_dir)
            .map_err(|e| format!("Failed to create workspace: {e}"))?;
    }
    workspace::seed_workspace(&working_dir)?;
    Ok(())
}

#[tauri::command]
pub async fn start_session(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    agent_sessions: State<'_, AgentSessionMap>,
    project_id: String,
    prompt: String,
) -> Result<String, String> {
    let project = state
        .db
        .get_project(&project_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Project not found".to_string())?;

    let session_key = "main".to_string();
    let working_dir = expand_tilde(&PathBuf::from(&project.folder_path));

    if !working_dir.exists() {
        std::fs::create_dir_all(&working_dir)
            .map_err(|e| format!("Failed to create working directory: {e}"))?;
    }
    workspace::seed_workspace(&working_dir)?;
    let system_prompt = workspace::build_system_prompt(&working_dir);

    // Get per-agent session state for resume support.
    let chat_state = agent_sessions.get_for_agent(&project_id).await;
    let resume_id = chat_state.get().await;
    eprintln!("[{{APP_NAME}}:session] resume_id={:?} for project={}", resume_id, project_id);

    // Persist desktop user message to DB (optimistic push happens on frontend).
    let _ = state.db.add_chat_feed_item(
        &project.id, "main", "user_message",
        &serde_json::Value::String(prompt.clone()).to_string(),
        "desktop",
    ).await;

    keel_tauri::session_runner::spawn_and_monitor(
        &app_handle,
        session_key.clone(),
        prompt,
        resume_id,
        Some(working_dir),
        Some(system_prompt),
        Some(chat_state),
        Some(PersistOptions {
            db: state.db.clone(),
            project_id: project.id.clone(),
            feed_key: "main".into(),
            source: "desktop".into(),
            claude_session_id: None,
        }),
    );

    Ok(session_key)
}

/// Load persisted chat feed for hydrating the UI on app restart.
#[tauri::command]
pub async fn load_chat_feed(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<serde_json::Value>, String> {
    let rows = state
        .db
        .list_chat_feed(&project_id, "main")
        .await
        .map_err(|e| e.to_string())?;

    let items: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|row| {
            serde_json::json!({
                "feed_type": row.feed_type,
                "data": serde_json::from_str::<serde_json::Value>(&row.data_json)
                    .unwrap_or(serde_json::Value::String(row.data_json)),
            })
        })
        .collect();

    Ok(items)
}
