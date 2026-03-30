use keel_tauri::events::KeelEvent;
use keel_tauri::keel_sessions::{SessionManager, SessionUpdate};
use keel_tauri::state::AppState;
use tauri::{Emitter, State};

#[tauri::command]
pub async fn start_session(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    project_id: String,
    prompt: String,
) -> Result<String, String> {
    let project = state
        .db
        .get_project(&project_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Project not found".to_string())?;

    let session_key = uuid::Uuid::new_v4().to_string();
    let working_dir = std::path::PathBuf::from(&project.folder_path);

    let (mut rx, _handle) = SessionManager::spawn_session(
        prompt,
        None, // resume_session_id
        Some(working_dir),
        None, // model
        None, // effort
        None, // system_prompt
        None, // mcp_config
        false, // disable_builtin_tools
        false, // disable_all_tools
    );

    let key = session_key.clone();
    let handle = app_handle.clone();
    tokio::spawn(async move {
        while let Some(update) = rx.recv().await {
            match update {
                SessionUpdate::Feed(item) => {
                    let _ = handle.emit(
                        "keel-event",
                        KeelEvent::FeedItem {
                            session_key: key.clone(),
                            item,
                        },
                    );
                }
                SessionUpdate::Status(status) => {
                    let (status_str, error) = match &status {
                        keel_tauri::keel_sessions::SessionStatus::Starting => {
                            ("starting".to_string(), None)
                        }
                        keel_tauri::keel_sessions::SessionStatus::Running => {
                            ("running".to_string(), None)
                        }
                        keel_tauri::keel_sessions::SessionStatus::Completed => {
                            ("completed".to_string(), None)
                        }
                        keel_tauri::keel_sessions::SessionStatus::Error(e) => {
                            ("error".to_string(), Some(e.clone()))
                        }
                    };
                    let _ = handle.emit(
                        "keel-event",
                        KeelEvent::SessionStatus {
                            session_key: key.clone(),
                            status: status_str,
                            error,
                        },
                    );
                }
                _ => {}
            }
        }
    });

    Ok(session_key)
}
