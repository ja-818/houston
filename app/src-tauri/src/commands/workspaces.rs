use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use super::workspaces::WorkspaceRoot;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Space {
    pub id: String,
    pub name: String,
    pub is_default: bool,
    pub created_at: String,
}

// --- Helpers ---

fn spaces_json_path(root: &Path) -> PathBuf {
    root.join("spaces.json")
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

pub fn read_spaces(root: &Path) -> Result<Vec<Space>, String> {
    let path = spaces_json_path(root);
    if !path.exists() {
        return Ok(Vec::new());
    }
    let contents =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read spaces.json: {e}"))?;
    serde_json::from_str(&contents).map_err(|e| format!("Failed to parse spaces.json: {e}"))
}

/// Atomic write: write to .tmp then rename.
fn write_spaces(root: &Path, spaces: &[Space]) -> Result<(), String> {
    let target = spaces_json_path(root);
    let tmp = root.join("spaces.json.tmp");
    let json = serde_json::to_string_pretty(spaces)
        .map_err(|e| format!("Failed to serialize spaces: {e}"))?;
    fs::write(&tmp, &json).map_err(|e| format!("Failed to write spaces.json.tmp: {e}"))?;
    fs::rename(&tmp, &target).map_err(|e| format!("Failed to rename spaces.json: {e}"))?;
    Ok(())
}

/// Resolve a space's folder path from its ID.
pub fn space_folder(root: &Path, space_id: &str) -> Result<PathBuf, String> {
    let spaces = read_spaces(root)?;
    let space = spaces
        .iter()
        .find(|s| s.id == space_id)
        .ok_or_else(|| format!("Space not found: {space_id}"))?;
    Ok(root.join(&space.name))
}

// --- Commands ---

#[tauri::command(rename_all = "snake_case")]
pub fn list_spaces(
    root: tauri::State<'_, WorkspaceRoot>,
) -> Result<Vec<Space>, String> {
    fs::create_dir_all(&root.0)
        .map_err(|e| format!("Failed to create workspace root: {e}"))?;
    read_spaces(&root.0)
}

#[tauri::command(rename_all = "snake_case")]
pub fn create_space(
    root: tauri::State<'_, WorkspaceRoot>,
    name: String,
) -> Result<Space, String> {
    let mut spaces = read_spaces(&root.0)?;

    // Check for duplicate name
    if spaces.iter().any(|s| s.name == name) {
        return Err(format!("A space named \"{name}\" already exists"));
    }

    let space = Space {
        id: Uuid::new_v4().to_string(),
        name: name.clone(),
        is_default: false,
        created_at: now_iso(),
    };

    // Create the space directory with .houston/connections.json
    let space_dir = root.0.join(&name);
    fs::create_dir_all(space_dir.join(".houston"))
        .map_err(|e| format!("Failed to create space directory: {e}"))?;
    let connections_path = space_dir.join(".houston").join("connections.json");
    if !connections_path.exists() {
        fs::write(&connections_path, "[]")
            .map_err(|e| format!("Failed to write connections.json: {e}"))?;
    }

    spaces.push(space.clone());
    write_spaces(&root.0, &spaces)?;
    Ok(space)
}

#[tauri::command(rename_all = "snake_case")]
pub fn rename_space(
    root: tauri::State<'_, WorkspaceRoot>,
    id: String,
    new_name: String,
) -> Result<Space, String> {
    let mut spaces = read_spaces(&root.0)?;

    // Check for duplicate name
    if spaces.iter().any(|s| s.name == new_name && s.id != id) {
        return Err(format!(
            "A space named \"{new_name}\" already exists"
        ));
    }

    let space = spaces
        .iter_mut()
        .find(|s| s.id == id)
        .ok_or_else(|| format!("Space not found: {id}"))?;

    let old_name = space.name.clone();
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
            .map_err(|e| format!("Failed to rename space directory: {e}"))?;
    }

    space.name = new_name;
    let updated = space.clone();
    write_spaces(&root.0, &spaces)?;
    Ok(updated)
}

#[tauri::command(rename_all = "snake_case")]
pub fn delete_space(
    root: tauri::State<'_, WorkspaceRoot>,
    id: String,
) -> Result<(), String> {
    let spaces = read_spaces(&root.0)?;

    let space = spaces
        .iter()
        .find(|s| s.id == id)
        .ok_or_else(|| format!("Space not found: {id}"))?;

    if space.is_default {
        return Err("Cannot delete the default space".to_string());
    }

    let space_dir = root.0.join(&space.name);

    // Remove from list
    let remaining: Vec<Space> = spaces.into_iter().filter(|s| s.id != id).collect();
    write_spaces(&root.0, &remaining)?;

    // Delete directory
    if space_dir.exists() {
        fs::remove_dir_all(&space_dir)
            .map_err(|e| format!("Failed to delete space directory: {e}"))?;
    }

    Ok(())
}
