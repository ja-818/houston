use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use super::agents::WorkspaceRoot;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub is_default: bool,
    pub created_at: String,
    /// AI provider for this workspace ("anthropic" or "openai").
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provider: Option<String>,
    /// Default model for this workspace (e.g. "sonnet", "gpt-5.4").
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
}

// --- Helpers ---

fn workspaces_json_path(root: &Path) -> PathBuf {
    root.join("workspaces.json")
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

pub fn read_workspaces(root: &Path) -> Result<Vec<Workspace>, String> {
    let path = workspaces_json_path(root);
    if !path.exists() {
        return Ok(Vec::new());
    }
    let contents =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read workspaces.json: {e}"))?;
    serde_json::from_str(&contents).map_err(|e| format!("Failed to parse workspaces.json: {e}"))
}

/// Atomic write: write to .tmp then rename.
pub fn write_workspaces(root: &Path, workspaces: &[Workspace]) -> Result<(), String> {
    let target = workspaces_json_path(root);
    let tmp = root.join("workspaces.json.tmp");
    let json = serde_json::to_string_pretty(workspaces)
        .map_err(|e| format!("Failed to serialize workspaces: {e}"))?;
    fs::write(&tmp, &json).map_err(|e| format!("Failed to write workspaces.json.tmp: {e}"))?;
    fs::rename(&tmp, &target).map_err(|e| format!("Failed to rename workspaces.json: {e}"))?;
    Ok(())
}

/// Resolve a workspace's folder path from its ID.
pub fn workspace_folder(root: &Path, workspace_id: &str) -> Result<PathBuf, String> {
    let workspaces = read_workspaces(root)?;
    let ws = workspaces
        .iter()
        .find(|w| w.id == workspace_id)
        .ok_or_else(|| format!("Workspace not found: {workspace_id}"))?;
    Ok(root.join(&ws.name))
}

// --- Commands ---

#[tauri::command(rename_all = "snake_case")]
pub fn list_workspaces(
    root: tauri::State<'_, WorkspaceRoot>,
) -> Result<Vec<Workspace>, String> {
    fs::create_dir_all(&root.0)
        .map_err(|e| format!("Failed to create houston root: {e}"))?;
    read_workspaces(&root.0)
}

#[tauri::command(rename_all = "snake_case")]
pub fn create_workspace(
    root: tauri::State<'_, WorkspaceRoot>,
    name: String,
    provider: Option<String>,
    model: Option<String>,
) -> Result<Workspace, String> {
    let mut workspaces = read_workspaces(&root.0)?;

    // Check for duplicate name
    if workspaces.iter().any(|w| w.name == name) {
        return Err(format!("A workspace named \"{name}\" already exists"));
    }

    let ws = Workspace {
        id: Uuid::new_v4().to_string(),
        name: name.clone(),
        is_default: false,
        created_at: now_iso(),
        provider,
        model,
    };

    // Create the workspace directory with .houston/connections.json
    let ws_dir = root.0.join(&name);
    fs::create_dir_all(ws_dir.join(".houston"))
        .map_err(|e| format!("Failed to create workspace directory: {e}"))?;
    let connections_path = ws_dir.join(".houston").join("connections.json");
    if !connections_path.exists() {
        fs::write(&connections_path, "[]")
            .map_err(|e| format!("Failed to write connections.json: {e}"))?;
    }

    workspaces.push(ws.clone());
    write_workspaces(&root.0, &workspaces)?;
    Ok(ws)
}

#[tauri::command(rename_all = "snake_case")]
pub fn rename_workspace(
    root: tauri::State<'_, WorkspaceRoot>,
    id: String,
    new_name: String,
) -> Result<Workspace, String> {
    let mut workspaces = read_workspaces(&root.0)?;

    // Check for duplicate name
    if workspaces.iter().any(|w| w.name == new_name && w.id != id) {
        return Err(format!(
            "A workspace named \"{new_name}\" already exists"
        ));
    }

    let ws = workspaces
        .iter_mut()
        .find(|w| w.id == id)
        .ok_or_else(|| format!("Workspace not found: {id}"))?;

    let old_name = ws.name.clone();
    let old_dir = root.0.join(&old_name);
    let new_dir = root.0.join(&new_name);

    if new_dir.exists() && old_dir != new_dir {
        return Err(format!(
            "A directory named \"{new_name}\" already exists"
        ));
    }

    // Rename the directory
    if old_dir.exists() {
        fs::rename(&old_dir, &new_dir)
            .map_err(|e| format!("Failed to rename workspace directory: {e}"))?;
    }

    ws.name = new_name;
    let updated = ws.clone();
    write_workspaces(&root.0, &workspaces)?;
    Ok(updated)
}

#[tauri::command(rename_all = "snake_case")]
pub fn delete_workspace(
    root: tauri::State<'_, WorkspaceRoot>,
    id: String,
) -> Result<(), String> {
    let workspaces = read_workspaces(&root.0)?;

    let ws = workspaces
        .iter()
        .find(|w| w.id == id)
        .ok_or_else(|| format!("Workspace not found: {id}"))?;

    if ws.is_default {
        return Err("Cannot delete the default workspace".to_string());
    }

    let ws_dir = root.0.join(&ws.name);

    // Remove from list
    let remaining: Vec<Workspace> = workspaces.into_iter().filter(|w| w.id != id).collect();
    write_workspaces(&root.0, &remaining)?;

    // Delete directory
    if ws_dir.exists() {
        fs::remove_dir_all(&ws_dir)
            .map_err(|e| format!("Failed to delete workspace directory: {e}"))?;
    }

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn update_workspace_provider(
    root: tauri::State<'_, WorkspaceRoot>,
    id: String,
    provider: String,
    model: Option<String>,
) -> Result<Workspace, String> {
    let mut workspaces = read_workspaces(&root.0)?;
    let ws = workspaces
        .iter_mut()
        .find(|w| w.id == id)
        .ok_or_else(|| format!("Workspace not found: {id}"))?;
    ws.provider = Some(provider);
    if let Some(m) = model {
        ws.model = Some(m);
    }
    let updated = ws.clone();
    write_workspaces(&root.0, &workspaces)?;
    Ok(updated)
}
