use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use super::spaces::space_folder;

/// Persisted workspace metadata stored in .houston/workspace.json.
#[derive(Serialize, Deserialize, Clone)]
pub struct WorkspaceMeta {
    pub id: String,
    pub experience_id: String,
    pub created_at: String,
    pub last_opened_at: Option<String>,
}

/// Workspace returned to the frontend (metadata + folder info).
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub folder_path: String,
    pub experience_id: String,
    pub created_at: String,
    pub last_opened_at: Option<String>,
}

/// Managed Tauri state: path to ~/Documents/Houston/.
pub struct WorkspaceRoot(pub PathBuf);

// --- Helpers ---

fn houston_dir(folder: &Path) -> PathBuf {
    folder.join(".houston")
}

fn workspace_json_path(folder: &Path) -> PathBuf {
    houston_dir(folder).join("workspace.json")
}

fn read_meta(folder: &Path) -> Result<WorkspaceMeta, String> {
    let path = workspace_json_path(folder);
    let contents =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read workspace.json: {e}"))?;
    serde_json::from_str(&contents).map_err(|e| format!("Failed to parse workspace.json: {e}"))
}

/// Atomic write: write to .tmp then rename.
fn write_meta(folder: &Path, meta: &WorkspaceMeta) -> Result<(), String> {
    let dir = houston_dir(folder);
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create .houston directory: {e}"))?;
    let target = dir.join("workspace.json");
    let tmp = dir.join("workspace.json.tmp");
    let json =
        serde_json::to_string_pretty(meta).map_err(|e| format!("Failed to serialize: {e}"))?;
    fs::write(&tmp, &json)
        .map_err(|e| format!("Failed to write workspace.json.tmp: {e}"))?;
    fs::rename(&tmp, &target)
        .map_err(|e| format!("Failed to rename workspace.json: {e}"))?;
    Ok(())
}

fn meta_to_workspace(folder: &Path, meta: &WorkspaceMeta) -> Workspace {
    let name = folder
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    Workspace {
        id: meta.id.clone(),
        name,
        folder_path: folder.to_string_lossy().to_string(),
        experience_id: meta.experience_id.clone(),
        created_at: meta.created_at.clone(),
        last_opened_at: meta.last_opened_at.clone(),
    }
}

/// Find a workspace folder by its ID (scan subdirs within a space folder).
fn find_workspace_by_id(space_dir: &Path, id: &str) -> Result<PathBuf, String> {
    let entries = fs::read_dir(space_dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let meta_path = workspace_json_path(&path);
        if !meta_path.exists() {
            continue;
        }
        if let Ok(meta) = read_meta(&path) {
            if meta.id == id {
                return Ok(path);
            }
        }
    }
    Err(format!("Workspace not found: {id}"))
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

/// Resolve the space folder from root + space_id.
fn resolve_space_folder(root: &Path, space_id: &str) -> Result<PathBuf, String> {
    let folder = space_folder(root, space_id)?;
    fs::create_dir_all(&folder)
        .map_err(|e| format!("Failed to create space directory: {e}"))?;
    Ok(folder)
}

// --- Commands ---

#[tauri::command]
pub fn list_workspaces(
    root: tauri::State<'_, WorkspaceRoot>,
    space_id: String,
) -> Result<Vec<Workspace>, String> {
    let space_dir = resolve_space_folder(&root.0, &space_id)?;

    let entries = fs::read_dir(&space_dir).map_err(|e| e.to_string())?;
    let mut workspaces = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        if !workspace_json_path(&path).exists() {
            continue;
        }
        match read_meta(&path) {
            Ok(meta) => workspaces.push(meta_to_workspace(&path, &meta)),
            Err(e) => eprintln!("[workspaces] skipping {name}: {e}"),
        }
    }

    // Sort by last_opened_at descending (most recent first).
    workspaces.sort_by(|a, b| {
        let a_time = a.last_opened_at.as_deref().unwrap_or("");
        let b_time = b.last_opened_at.as_deref().unwrap_or("");
        b_time.cmp(a_time)
    });

    Ok(workspaces)
}

#[tauri::command]
pub fn create_workspace(
    root: tauri::State<'_, WorkspaceRoot>,
    space_id: String,
    name: String,
    experience_id: String,
) -> Result<Workspace, String> {
    let space_dir = resolve_space_folder(&root.0, &space_id)?;
    let folder = space_dir.join(&name);

    if folder.exists() {
        return Err(format!("A workspace named \"{name}\" already exists"));
    }

    fs::create_dir_all(&folder)
        .map_err(|e| format!("Failed to create workspace directory: {e}"))?;

    let houston = houston_dir(&folder);
    fs::create_dir_all(houston.join("skills"))
        .map_err(|e| format!("Failed to create .houston/skills: {e}"))?;

    let now = now_iso();
    let meta = WorkspaceMeta {
        id: Uuid::new_v4().to_string(),
        experience_id,
        created_at: now.clone(),
        last_opened_at: Some(now),
    };
    write_meta(&folder, &meta)?;

    // Seed CLAUDE.md
    let claude_md = folder.join("CLAUDE.md");
    if !claude_md.exists() {
        fs::write(&claude_md, "## Instructions\n\n## Learnings\n")
            .map_err(|e| format!("Failed to write CLAUDE.md: {e}"))?;
    }

    // Seed empty defaults
    seed_json_if_missing(&houston, "tasks.json", "[]")?;
    seed_json_if_missing(&houston, "config.json", "{}")?;

    Ok(meta_to_workspace(&folder, &meta))
}

#[tauri::command]
pub fn delete_workspace(
    root: tauri::State<'_, WorkspaceRoot>,
    space_id: String,
    id: String,
) -> Result<(), String> {
    let space_dir = resolve_space_folder(&root.0, &space_id)?;
    let folder = find_workspace_by_id(&space_dir, &id)?;
    fs::remove_dir_all(&folder)
        .map_err(|e| format!("Failed to delete workspace: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn rename_workspace(
    root: tauri::State<'_, WorkspaceRoot>,
    space_id: String,
    id: String,
    new_name: String,
) -> Result<Workspace, String> {
    let space_dir = resolve_space_folder(&root.0, &space_id)?;
    let old_folder = find_workspace_by_id(&space_dir, &id)?;
    let new_folder = space_dir.join(&new_name);

    if new_folder.exists() {
        return Err(format!(
            "A workspace named \"{new_name}\" already exists"
        ));
    }

    fs::rename(&old_folder, &new_folder)
        .map_err(|e| format!("Failed to rename workspace: {e}"))?;

    let meta = read_meta(&new_folder)?;
    Ok(meta_to_workspace(&new_folder, &meta))
}

#[tauri::command]
pub fn update_workspace_opened(
    root: tauri::State<'_, WorkspaceRoot>,
    space_id: String,
    id: String,
) -> Result<(), String> {
    let space_dir = resolve_space_folder(&root.0, &space_id)?;
    let folder = find_workspace_by_id(&space_dir, &id)?;
    let mut meta = read_meta(&folder)?;
    meta.last_opened_at = Some(now_iso());
    write_meta(&folder, &meta)?;
    Ok(())
}

/// Write a JSON string to .houston/{filename} only if it doesn't exist.
fn seed_json_if_missing(houston: &Path, filename: &str, content: &str) -> Result<(), String> {
    let path = houston.join(filename);
    if !path.exists() {
        fs::write(&path, content)
            .map_err(|e| format!("Failed to write {filename}: {e}"))?;
    }
    Ok(())
}
