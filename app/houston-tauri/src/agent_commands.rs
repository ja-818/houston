//! Pre-built Tauri commands for agent file operations.
//!
//! Apps can register these directly in their `invoke_handler`:
//!
//! ```rust,ignore
//! .invoke_handler(tauri::generate_handler![
//!     houston_tauri::agent_commands::list_project_files,
//!     houston_tauri::agent_commands::open_file,
//!     houston_tauri::agent_commands::reveal_file,
//!     houston_tauri::agent_commands::delete_file,
//!     houston_tauri::agent_commands::import_files,
//!     houston_tauri::agent_commands::create_agent_folder,
//!     houston_tauri::agent_commands::reveal_agent,
//!     houston_tauri::agent_commands::search_sessions,
//!     houston_tauri::agent_commands::list_recent_sessions,
//! ])
//! ```
//!
//! Pure FS ops are thin proxies over `houston_engine_core::agents::files`.
//! OS-native ops (`open_file`, `reveal_file`, `reveal_agent`, `open_url`) and
//! DB-bound session queries stay in this adapter — they have no meaning when
//! the engine runs remotely.

use houston_engine_core::agents::files;
use houston_ui_events::HoustonEvent;

use crate::paths::expand_tilde;
use crate::state::AppState;
use std::path::PathBuf;
use tauri::{Emitter, State};

pub use files::ProjectFile;

/// List all user-facing files in an agent folder.
#[tauri::command(rename_all = "snake_case")]
pub async fn list_project_files(agent_path: String) -> Result<Vec<ProjectFile>, String> {
    let root = expand_tilde(&PathBuf::from(&agent_path));
    files::list_project_files(&root).map_err(|e| e.to_string())
}

/// Open a file with the system default application.
#[tauri::command(rename_all = "snake_case")]
pub async fn open_file(agent_path: String, relative_path: String) -> Result<(), String> {
    let full_path = resolve_existing(&agent_path, &relative_path)?;
    std::process::Command::new("open")
        .arg(&full_path)
        .spawn()
        .map_err(|e| format!("Failed to open file: {e}"))?;
    Ok(())
}

/// Show a file in the OS file manager (Finder on macOS).
#[tauri::command(rename_all = "snake_case")]
pub async fn reveal_file(agent_path: String, relative_path: String) -> Result<(), String> {
    let full_path = resolve_existing(&agent_path, &relative_path)?;
    std::process::Command::new("open")
        .arg("-R")
        .arg(&full_path)
        .spawn()
        .map_err(|e| format!("Failed to reveal file: {e}"))?;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn rename_file(
    app_handle: tauri::AppHandle,
    agent_path: String,
    relative_path: String,
    new_name: String,
) -> Result<(), String> {
    let root = expand_tilde(&PathBuf::from(&agent_path));
    files::rename_file(&root, &relative_path, &new_name).map_err(|e| e.to_string())?;
    let _ = app_handle.emit(
        "houston-event",
        HoustonEvent::FilesChanged {
            agent_path: agent_path.clone(),
        },
    );
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_file(
    app_handle: tauri::AppHandle,
    agent_path: String,
    relative_path: String,
) -> Result<(), String> {
    let root = expand_tilde(&PathBuf::from(&agent_path));
    files::delete_file(&root, &relative_path).map_err(|e| e.to_string())?;
    let _ = app_handle.emit(
        "houston-event",
        HoustonEvent::FilesChanged {
            agent_path: agent_path.clone(),
        },
    );
    Ok(())
}

/// Import files from absolute paths into the agent. Returns the imported
/// metadata for immediate UI refresh.
#[tauri::command(rename_all = "snake_case")]
pub async fn import_files(
    app_handle: tauri::AppHandle,
    agent_path: String,
    file_paths: Vec<String>,
    target_folder: Option<String>,
) -> Result<Vec<ProjectFile>, String> {
    let root = expand_tilde(&PathBuf::from(&agent_path));
    let imported = files::import_files(&root, &file_paths, target_folder.as_deref())
        .map_err(|e| e.to_string())?;
    if !imported.is_empty() {
        let _ = app_handle.emit(
            "houston-event",
            HoustonEvent::FilesChanged {
                agent_path: agent_path.clone(),
            },
        );
    }
    Ok(imported)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_agent_folder(
    app_handle: tauri::AppHandle,
    agent_path: String,
    folder_name: String,
) -> Result<String, String> {
    let root = expand_tilde(&PathBuf::from(&agent_path));
    let result = files::create_folder(&root, &folder_name).map_err(|e| e.to_string())?;
    let _ = app_handle.emit(
        "houston-event",
        HoustonEvent::FilesChanged {
            agent_path: agent_path.clone(),
        },
    );
    Ok(result)
}

/// Open the agent folder in the OS file manager.
#[tauri::command(rename_all = "snake_case")]
pub async fn reveal_agent(agent_path: String) -> Result<(), String> {
    let root = expand_tilde(&PathBuf::from(&agent_path));
    std::process::Command::new("open")
        .arg(&root)
        .spawn()
        .map_err(|e| format!("Failed to open folder: {e}"))?;
    Ok(())
}

/// Open a URL in the system default browser.
#[tauri::command(rename_all = "snake_case")]
pub async fn open_url(url: String) -> Result<(), String> {
    std::process::Command::new("open")
        .arg(&url)
        .spawn()
        .map_err(|e| format!("Failed to open URL: {e}"))?;
    Ok(())
}

/// Write a file from raw bytes (base64-encoded) into the workspace.
/// Used when files come from a web file picker (no filesystem path available).
#[tauri::command(rename_all = "snake_case")]
pub async fn write_file_bytes(
    app_handle: tauri::AppHandle,
    agent_path: String,
    file_name: String,
    data_base64: String,
) -> Result<ProjectFile, String> {
    use base64::Engine;
    let root = expand_tilde(&PathBuf::from(&agent_path));
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&data_base64)
        .map_err(|e| format!("Invalid base64: {e}"))?;
    let pf = files::write_file_bytes(&root, &file_name, &bytes).map_err(|e| e.to_string())?;
    let _ = app_handle.emit(
        "houston-event",
        HoustonEvent::FilesChanged {
            agent_path: agent_path.clone(),
        },
    );
    Ok(pf)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_project_file(
    agent_path: String,
    relative_path: String,
) -> Result<String, String> {
    let root = expand_tilde(&PathBuf::from(&agent_path));
    files::read_project_file(&root, &relative_path).map_err(|e| e.to_string())
}

/// Full-text search across chat sessions.
/// Stays in the Tauri adapter until the engine exposes a sessions REST surface.
#[tauri::command(rename_all = "snake_case")]
pub async fn search_sessions(
    state: State<'_, AppState>,
    query: String,
    exclude_session_id: Option<String>,
) -> Result<Vec<houston_db::SessionSearchResult>, String> {
    state
        .db
        .search_sessions(&query, exclude_session_id.as_deref(), 10, 3)
        .await
        .map_err(|e| e.to_string())
}

/// List recent chat sessions (no search). Returns metadata only.
#[tauri::command(rename_all = "snake_case")]
pub async fn list_recent_sessions(
    state: State<'_, AppState>,
    limit: Option<usize>,
) -> Result<Vec<houston_db::SessionMetadata>, String> {
    state
        .db
        .list_recent_sessions(limit.unwrap_or(20))
        .await
        .map_err(|e| e.to_string())
}

/// v2: Load persisted chat feed by claude_session_id.
/// This is the primary way to load conversation history.
#[tauri::command(rename_all = "snake_case")]
pub async fn load_session_feed(
    state: State<'_, AppState>,
    claude_session_id: String,
) -> Result<Vec<serde_json::Value>, String> {
    let rows = state
        .db
        .list_chat_feed_by_session(&claude_session_id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(feed_rows_to_json(rows))
}

fn feed_rows_to_json(rows: Vec<houston_db::ChatFeedRow>) -> Vec<serde_json::Value> {
    rows.into_iter()
        .map(|row| {
            serde_json::json!({
                "feed_type": row.feed_type,
                "data": serde_json::from_str::<serde_json::Value>(&row.data_json)
                    .unwrap_or(serde_json::Value::String(row.data_json)),
            })
        })
        .collect()
}

fn resolve_existing(agent_path: &str, relative_path: &str) -> Result<PathBuf, String> {
    let root = expand_tilde(&PathBuf::from(agent_path));
    let full = root.join(relative_path);
    if !full.exists() {
        return Err(format!("File not found: {relative_path}"));
    }
    Ok(full)
}
