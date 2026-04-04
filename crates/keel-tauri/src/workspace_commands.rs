//! Pre-built Tauri commands for workspace file operations.
//!
//! Apps can register these directly in their `invoke_handler`:
//!
//! ```rust,ignore
//! .invoke_handler(tauri::generate_handler![
//!     keel_tauri::workspace_commands::list_project_files,
//!     keel_tauri::workspace_commands::open_file,
//!     keel_tauri::workspace_commands::reveal_file,
//!     keel_tauri::workspace_commands::delete_file,
//!     keel_tauri::workspace_commands::import_files,
//!     keel_tauri::workspace_commands::create_workspace_folder,
//!     keel_tauri::workspace_commands::reveal_workspace,
//! ])
//! ```
//!
//! These pair with `@deck-ui/workspace`'s `FilesBrowser` component on the frontend.

use crate::paths::expand_tilde;
use crate::state::AppState;
use crate::workspace;
use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::State;

/// User-facing file extensions shown in the browser.
/// Technical files (json, py, md) are excluded — they confuse non-technical users.
const USER_EXTENSIONS: &[&str] = &[
    "docx", "doc", "xlsx", "xls", "pptx", "ppt", "pdf", "png", "jpg", "jpeg",
    "svg", "gif", "txt", "rtf", "csv",
];

/// Directories to skip when scanning.
fn should_skip_dir(name: &str) -> bool {
    matches!(
        name,
        ".git" | "node_modules" | "__pycache__" | ".venv" | "venv"
            | ".env" | ".cache" | "target" | "dist" | "build" | "skills" | "scripts"
    ) || name.starts_with('.')
}

/// A file entry matching `@deck-ui/workspace`'s `FileEntry` type.
#[derive(Serialize, Clone)]
pub struct ProjectFile {
    pub path: String,
    pub name: String,
    pub extension: String,
    pub size: u64,
}

/// List all user-facing files in a project's workspace folder.
#[tauri::command]
pub async fn list_project_files(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<ProjectFile>, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    if !root.is_dir() {
        return Ok(Vec::new());
    }
    let mut files = Vec::new();
    collect_files(&root, &root, &mut files);
    files.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(files)
}

/// Open a file with the system default application.
#[tauri::command]
pub async fn open_file(
    state: State<'_, AppState>,
    project_id: String,
    relative_path: String,
) -> Result<(), String> {
    let full_path = resolve_file(&state, &project_id, &relative_path).await?;
    std::process::Command::new("open")
        .arg(&full_path)
        .spawn()
        .map_err(|e| format!("Failed to open file: {e}"))?;
    Ok(())
}

/// Show a file in the OS file manager (Finder on macOS).
#[tauri::command]
pub async fn reveal_file(
    state: State<'_, AppState>,
    project_id: String,
    relative_path: String,
) -> Result<(), String> {
    let full_path = resolve_file(&state, &project_id, &relative_path).await?;
    std::process::Command::new("open")
        .arg("-R")
        .arg(&full_path)
        .spawn()
        .map_err(|e| format!("Failed to reveal file: {e}"))?;
    Ok(())
}

/// Delete a file from the project workspace.
#[tauri::command]
pub async fn delete_file(
    state: State<'_, AppState>,
    project_id: String,
    relative_path: String,
) -> Result<(), String> {
    let full_path = resolve_file(&state, &project_id, &relative_path).await?;
    std::fs::remove_file(&full_path).map_err(|e| format!("Failed to delete: {e}"))?;
    Ok(())
}

/// Import files from absolute paths into the workspace.
/// Uses `workspace::copy_file_to_dir` which auto-deduplicates names.
/// Returns the list of imported files for immediate UI refresh.
#[tauri::command]
pub async fn import_files(
    state: State<'_, AppState>,
    project_id: String,
    file_paths: Vec<String>,
    target_folder: Option<String>,
) -> Result<Vec<ProjectFile>, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    let dest_dir = match &target_folder {
        Some(folder) => {
            let d = root.join(folder);
            std::fs::create_dir_all(&d)
                .map_err(|e| format!("Failed to create directory: {e}"))?;
            d
        }
        None => root.clone(),
    };

    let mut imported = Vec::new();
    for src_str in &file_paths {
        let src = PathBuf::from(src_str);
        match workspace::copy_file_to_dir(&dest_dir, &src) {
            Ok(final_name) => {
                let dest = dest_dir.join(&final_name);
                let ext = dest
                    .extension()
                    .map(|e| e.to_string_lossy().to_lowercase())
                    .unwrap_or_default();
                let size = dest.metadata().map(|m| m.len()).unwrap_or(0);
                let relative = dest
                    .strip_prefix(&root)
                    .unwrap_or(&dest)
                    .to_string_lossy()
                    .to_string();
                imported.push(ProjectFile {
                    path: relative,
                    name: final_name,
                    extension: ext,
                    size,
                });
            }
            Err(e) => eprintln!("[workspace] import failed for {src_str}: {e}"),
        }
    }
    Ok(imported)
}

/// Create a folder inside the workspace.
#[tauri::command]
pub async fn create_workspace_folder(
    state: State<'_, AppState>,
    project_id: String,
    folder_name: String,
) -> Result<String, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    workspace::create_folder(&root, &folder_name)
}

/// Open the project's workspace folder in the OS file manager.
#[tauri::command]
pub async fn reveal_workspace(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<(), String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    std::process::Command::new("open")
        .arg(&root)
        .spawn()
        .map_err(|e| format!("Failed to open folder: {e}"))?;
    Ok(())
}

/// Write a file from raw bytes (base64-encoded) into the workspace.
/// Used when files come from a web file picker (no filesystem path available).
#[tauri::command]
pub async fn write_file_bytes(
    state: State<'_, AppState>,
    project_id: String,
    file_name: String,
    data_base64: String,
) -> Result<ProjectFile, String> {
    use base64::Engine;
    let root = resolve_project_dir(&state, &project_id).await?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&data_base64)
        .map_err(|e| format!("Invalid base64: {e}"))?;
    let final_name = workspace::import_file(&root, &file_name, &bytes)?;
    let dest = root.join(&final_name);
    let ext = dest
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();
    let size = dest.metadata().map(|m| m.len()).unwrap_or(0);
    Ok(ProjectFile {
        path: final_name.clone(),
        name: final_name,
        extension: ext,
        size,
    })
}

/// Read a text file from the workspace by relative path.
#[tauri::command]
pub async fn read_project_file(
    state: State<'_, AppState>,
    project_id: String,
    relative_path: String,
) -> Result<String, String> {
    let full_path = resolve_file(&state, &project_id, &relative_path).await?;
    std::fs::read_to_string(&full_path)
        .map_err(|e| format!("Failed to read {relative_path}: {e}"))
}

/// Load persisted chat feed for hydrating the UI on app restart.
/// Reads from the `chat_feed` table and returns items as JSON.
/// Keyed by (project_id, "main") — backward compat for v1 callers.
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

    Ok(feed_rows_to_json(rows))
}

/// v2: Load persisted chat feed by claude_session_id.
/// This is the new primary way to load conversation history.
#[tauri::command]
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

/// Convert ChatFeedRows to JSON values for the frontend.
fn feed_rows_to_json(rows: Vec<keel_db::ChatFeedRow>) -> Vec<serde_json::Value> {
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

// -- Helpers --

async fn resolve_project_dir(state: &AppState, project_id: &str) -> Result<PathBuf, String> {
    let project = state
        .db
        .get_project(project_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Project not found")?;
    Ok(expand_tilde(&PathBuf::from(&project.folder_path)))
}

async fn resolve_file(
    state: &AppState,
    project_id: &str,
    relative_path: &str,
) -> Result<PathBuf, String> {
    let root = resolve_project_dir(state, project_id).await?;
    let full = root.join(relative_path);
    if !full.exists() {
        return Err(format!("File not found: {relative_path}"));
    }
    Ok(full)
}

fn collect_files(root: &Path, dir: &Path, out: &mut Vec<ProjectFile>) {
    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if path.is_dir() {
            if !should_skip_dir(&name) {
                collect_files(root, &path, out);
            }
            continue;
        }
        let ext = path
            .extension()
            .map(|e| e.to_string_lossy().to_lowercase())
            .unwrap_or_default();
        if !USER_EXTENSIONS.contains(&ext.as_str()) {
            continue;
        }
        let relative = path
            .strip_prefix(root)
            .unwrap_or(&path)
            .to_string_lossy()
            .to_string();
        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
        out.push(ProjectFile {
            path: relative,
            name,
            extension: ext,
            size,
        });
    }
}
