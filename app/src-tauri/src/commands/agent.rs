use crate::workspace;
use super::workspaces::WorkspaceRoot;
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
    prompt: String,
    session_key: Option<String>,
) -> Result<String, String> {
    let working_dir = expand_tilde(&PathBuf::from(&workspace_path));
    if !working_dir.exists() {
        std::fs::create_dir_all(&working_dir)
            .map_err(|e| format!("Failed to create workspace: {e}"))?;
    }
    workspace::seed_workspace(&working_dir)?;
    let system_prompt = workspace::build_system_prompt(&working_dir);

    let session_key = session_key.unwrap_or_else(|| "main".to_string());
    let agent_key = format!("{}:{}", working_dir.to_string_lossy(), session_key);
    let chat_state = agent_sessions
        .get_for_agent(&agent_key, &workspace_path)
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
    workspace_path: String,
) -> Result<Vec<serde_json::Value>, String> {
    let working_dir = expand_tilde(&PathBuf::from(&workspace_path));
    let session_file = working_dir.join(".claude_session_id");

    // Load from both v1 (agent_key + feed_key) and v2 (claude_session_id) sources.
    // The agent_key format must match what send_message uses: "path:session_key"
    let base_key = working_dir.to_string_lossy().to_string();
    let agent_key = format!("{base_key}:main");
    let mut v1_rows = state
        .db
        .list_chat_feed(&agent_key, "main")
        .await
        .map_err(|e| e.to_string())?;

    // Also try the old format (just path, no :main) for backward compat
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

    // Sort by timestamp and deduplicate
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
pub async fn read_workspace_file(
    workspace_path: String,
    name: String,
) -> Result<String, String> {
    let dir = expand_tilde(&PathBuf::from(&workspace_path));
    let path = dir.join(&name);
    match std::fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
        Err(e) => Err(format!("Failed to read {name}: {e}")),
    }
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
