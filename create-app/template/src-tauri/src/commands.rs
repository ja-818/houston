use crate::workspace;
use crate::WorkspaceRoot;
use houston_tauri::agent_sessions::AgentSessionMap;
use houston_tauri::paths::expand_tilde;
use houston_tauri::session_runner::PersistOptions;
use houston_tauri::state::AppState;
use serde::Serialize;
use std::path::PathBuf;
use tauri::State;

#[derive(Serialize)]
pub struct Agent {
    pub name: String,
    pub path: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_agents(root: State<'_, WorkspaceRoot>) -> Result<Vec<Agent>, String> {
    let dir = expand_tilde(&PathBuf::from(&root.0));
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create workspace root: {e}"))?;
    let mut agents = Vec::new();
    let entries = std::fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        if entry.path().is_dir() {
            let name = entry.file_name().to_string_lossy().to_string();
            if !name.starts_with('.') {
                agents.push(Agent {
                    name,
                    path: entry.path().to_string_lossy().to_string(),
                });
            }
        }
    }
    agents.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(agents)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_agent(
    root: State<'_, WorkspaceRoot>,
    name: String,
) -> Result<Agent, String> {
    let dir = expand_tilde(&PathBuf::from(&root.0));
    let agent_dir = dir.join(&name);
    std::fs::create_dir_all(&agent_dir)
        .map_err(|e| format!("Failed to create agent: {e}"))?;
    workspace::seed_workspace(&agent_dir)?;
    Ok(Agent {
        name,
        path: agent_dir.to_string_lossy().to_string(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn rename_agent(
    agent_path: String,
    new_name: String,
) -> Result<Agent, String> {
    let old_dir = expand_tilde(&PathBuf::from(&agent_path));
    let parent = old_dir.parent().ok_or("Invalid agent path")?;
    let new_dir = parent.join(&new_name);
    std::fs::rename(&old_dir, &new_dir)
        .map_err(|e| format!("Failed to rename agent: {e}"))?;
    Ok(Agent {
        name: new_name,
        path: new_dir.to_string_lossy().to_string(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_agent(agent_path: String) -> Result<(), String> {
    let dir = expand_tilde(&PathBuf::from(&agent_path));
    if dir.exists() {
        std::fs::remove_dir_all(&dir)
            .map_err(|e| format!("Failed to delete agent: {e}"))?;
    }
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn send_message(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    agent_sessions: State<'_, AgentSessionMap>,
    workspace_path: String,
    session_key: String,
    prompt: String,
) -> Result<String, String> {
    let working_dir = expand_tilde(&PathBuf::from(&workspace_path));
    if !working_dir.exists() {
        std::fs::create_dir_all(&working_dir)
            .map_err(|e| format!("Failed to create workspace: {e}"))?;
    }
    workspace::seed_workspace(&working_dir)?;
    let system_prompt = workspace::build_system_prompt(&working_dir);

    let agent_key = format!("{}:{}", working_dir.to_string_lossy(), session_key);
    let chat_state = agent_sessions
        .get_for_session(&agent_key, &workspace_path, &session_key)
        .await;
    let resume_id = chat_state.get().await;
    eprintln!(
        "[{{APP_NAME}}:session] resume_id={:?} for key={}",
        resume_id, agent_key
    );

    houston_tauri::session_runner::spawn_and_monitor(
        &app_handle,
        workspace_path.clone(),
        session_key.clone(),
        prompt.clone(),
        resume_id,
        working_dir,
        Some(system_prompt),
        Some(chat_state),
        Some(PersistOptions {
            db: state.db.clone(),
            source: "desktop".into(),
            user_message: Some(prompt),
            claude_session_id: None,
        }),
        None,
        houston_tauri::houston_sessions::Provider::Anthropic,
        None,
    );

    Ok(session_key)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_chat_history(
    state: State<'_, AppState>,
    workspace_path: String,
    session_key: String,
) -> Result<Vec<serde_json::Value>, String> {
    let working_dir = expand_tilde(&PathBuf::from(&workspace_path));
    let sid_path = houston_tauri::agent_sessions::session_id_path(&working_dir, &session_key);

    let Some(claude_session_id) = std::fs::read_to_string(&sid_path)
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
    else {
        return Ok(Vec::new());
    };

    let mut rows = state
        .db
        .list_chat_feed_by_session(&claude_session_id)
        .await
        .map_err(|e| e.to_string())?;

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

#[tauri::command(rename_all = "snake_case")]
pub async fn read_workspace_file(
    workspace_path: String,
    name: String,
) -> Result<String, String> {
    let dir = expand_tilde(&PathBuf::from(&workspace_path));
    let path = dir.join(&name);
    std::fs::read_to_string(&path).map_err(|e| format!("Failed to read {name}: {e}"))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn write_workspace_file(
    workspace_path: String,
    name: String,
    content: String,
) -> Result<(), String> {
    let dir = expand_tilde(&PathBuf::from(&workspace_path));
    let path = dir.join(&name);
    std::fs::write(&path, &content).map_err(|e| format!("Failed to write {name}: {e}"))
}
