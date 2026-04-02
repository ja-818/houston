use crate::workspace;
use keel_tauri::chat_session::ChatSessionState;
use keel_tauri::paths::expand_tilde;
use keel_tauri::session_runner::{spawn_and_monitor, PersistOptions};
use keel_tauri::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn start_session(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    chat_state: State<'_, ChatSessionState>,
    project_id: String,
    prompt: String,
) -> Result<String, String> {
    let project = state
        .db
        .get_project(&project_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Project not found".to_string())?;

    let working_dir = expand_tilde(&project.folder_path);

    // Seed workspace files on first use.
    workspace::seed_workspace(&project.folder_path);

    // Build system prompt from CLAUDE.md if it exists.
    let system_prompt = {
        let claude_md = working_dir.join("CLAUDE.md");
        if claude_md.exists() {
            std::fs::read_to_string(&claude_md).ok()
        } else {
            None
        }
    };

    // Resume previous session if we have one.
    let resume_id = chat_state.get();

    let session_key = "main".to_string();

    let _handle = spawn_and_monitor(
        &app_handle,
        &session_key,
        &prompt,
        resume_id.as_deref(),
        Some(working_dir),
        system_prompt.as_deref(),
        Some(chat_state.inner().clone()),
        Some(PersistOptions {
            db: state.db.clone(),
            project_id: project_id.clone(),
            feed_key: session_key.clone(),
            source: "desktop".to_string(),
        }),
    );

    Ok(session_key)
}

#[tauri::command]
pub async fn load_chat_feed(
    state: State<'_, AppState>,
    project_id: String,
    feed_key: String,
) -> Result<Vec<serde_json::Value>, String> {
    let rows = state
        .db
        .list_chat_feed(&project_id, &feed_key)
        .await
        .map_err(|e| e.to_string())?;

    let items: Vec<serde_json::Value> = rows
        .into_iter()
        .filter_map(|row| serde_json::from_str(&row.data_json).ok())
        .collect();

    Ok(items)
}
