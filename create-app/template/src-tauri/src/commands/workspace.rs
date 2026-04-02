use keel_tauri::paths::expand_tilde;
use keel_tauri::state::AppState;
use serde::Serialize;
use tauri::State;

const KNOWN_FILES: &[(&str, &str)] = &[
    ("CLAUDE.md", "Agent instructions and behavior rules"),
];

#[derive(Serialize)]
pub struct WorkspaceFileInfo {
    name: String,
    description: String,
    exists: bool,
}

#[tauri::command]
pub async fn list_workspace_files(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<WorkspaceFileInfo>, String> {
    let project = state
        .db
        .get_project(&project_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Project not found".to_string())?;

    let dir = expand_tilde(&project.folder_path);
    let files = KNOWN_FILES
        .iter()
        .map(|(name, desc)| WorkspaceFileInfo {
            name: name.to_string(),
            description: desc.to_string(),
            exists: dir.join(name).exists(),
        })
        .collect();

    Ok(files)
}

#[tauri::command]
pub async fn read_workspace_file(
    state: State<'_, AppState>,
    project_id: String,
    file_name: String,
) -> Result<String, String> {
    let project = state
        .db
        .get_project(&project_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Project not found".to_string())?;

    // Only allow reading known files
    if !KNOWN_FILES.iter().any(|(name, _)| *name == file_name) {
        return Err(format!("Unknown workspace file: {file_name}"));
    }

    let path = expand_tilde(&project.folder_path).join(&file_name);
    std::fs::read_to_string(&path).map_err(|e| format!("Failed to read {file_name}: {e}"))
}
