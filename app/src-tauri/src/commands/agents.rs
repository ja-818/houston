use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use super::workspaces::workspace_folder;

/// Persisted agent metadata stored in .houston/agent.json.
#[derive(Serialize, Deserialize, Clone)]
pub struct AgentMeta {
    pub id: String,
    /// User-assigned display name. Falls back to folder name if absent
    /// (backward compat with pre-existing agent.json files).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub config_id: String,
    pub color: Option<String>,
    pub created_at: String,
    pub last_opened_at: Option<String>,
}

/// Agent returned to the frontend (metadata + folder info).
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub folder_path: String,
    pub config_id: String,
    pub color: Option<String>,
    pub created_at: String,
    pub last_opened_at: Option<String>,
}

/// Result of `create_agent` — the new agent plus (optionally) the id of a
/// seeded onboarding activity that the caller should open a conversation with.
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CreateAgentResult {
    pub agent: Agent,
    pub onboarding_activity_id: Option<String>,
}

/// Managed Tauri state: path to ~/Documents/Houston/.
pub struct WorkspaceRoot(pub PathBuf);

// --- Helpers ---

fn houston_dir(folder: &Path) -> PathBuf {
    folder.join(".houston")
}

fn agent_json_path(folder: &Path) -> PathBuf {
    houston_dir(folder).join("agent.json")
}

fn read_agent_meta(folder: &Path) -> Result<AgentMeta, String> {
    let path = agent_json_path(folder);
    let contents =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read agent.json: {e}"))?;
    serde_json::from_str(&contents).map_err(|e| format!("Failed to parse agent.json: {e}"))
}

/// Atomic write: write to .tmp then rename.
fn write_agent_meta(folder: &Path, meta: &AgentMeta) -> Result<(), String> {
    let dir = houston_dir(folder);
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create .houston directory: {e}"))?;
    let target = dir.join("agent.json");
    let tmp = dir.join("agent.json.tmp");
    let json =
        serde_json::to_string_pretty(meta).map_err(|e| format!("Failed to serialize: {e}"))?;
    fs::write(&tmp, &json)
        .map_err(|e| format!("Failed to write agent.json.tmp: {e}"))?;
    fs::rename(&tmp, &target)
        .map_err(|e| format!("Failed to rename agent.json: {e}"))?;
    Ok(())
}

fn meta_to_agent(folder: &Path, meta: &AgentMeta) -> Agent {
    let name = meta.name.clone().unwrap_or_else(|| {
        folder
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default()
    });
    // Resolve symlinks so the frontend gets the real path for file watchers
    // and session management. Falls back to the original path if resolution fails.
    let real_path = fs::canonicalize(folder).unwrap_or_else(|_| folder.to_path_buf());
    Agent {
        id: meta.id.clone(),
        name,
        folder_path: real_path.to_string_lossy().to_string(),
        config_id: meta.config_id.clone(),
        color: meta.color.clone(),
        created_at: meta.created_at.clone(),
        last_opened_at: meta.last_opened_at.clone(),
    }
}

/// Find an agent folder by its ID (scan subdirs within a workspace folder).
fn find_agent_by_id(ws_dir: &Path, id: &str) -> Result<PathBuf, String> {
    let entries = fs::read_dir(ws_dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let meta_path = agent_json_path(&path);
        if !meta_path.exists() {
            continue;
        }
        if let Ok(meta) = read_agent_meta(&path) {
            if meta.id == id {
                return Ok(path);
            }
        }
    }
    Err(format!("Agent not found: {id}"))
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

/// Resolve the workspace folder from root + workspace_id.
fn resolve_ws_folder(root: &Path, workspace_id: &str) -> Result<PathBuf, String> {
    let folder = workspace_folder(root, workspace_id)?;
    fs::create_dir_all(&folder)
        .map_err(|e| format!("Failed to create workspace directory: {e}"))?;
    Ok(folder)
}

// --- Commands ---

#[tauri::command(rename_all = "snake_case")]
pub fn list_agents(
    root: tauri::State<'_, WorkspaceRoot>,
    workspace_id: String,
) -> Result<Vec<Agent>, String> {
    let ws_dir = resolve_ws_folder(&root.0, &workspace_id)?;

    let entries = fs::read_dir(&ws_dir).map_err(|e| e.to_string())?;
    let mut agents = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        // Detect dangling symlinks (target directory was deleted).
        if path.is_symlink() && !path.exists() {
            tracing::warn!("[agents] removing dangling symlink: {name}");
            let _ = fs::remove_file(&path);
            continue;
        }
        if !path.is_dir() {
            continue;
        }
        if !agent_json_path(&path).exists() {
            continue;
        }
        match read_agent_meta(&path) {
            Ok(meta) => agents.push(meta_to_agent(&path, &meta)),
            Err(e) => tracing::warn!("[agents] skipping {name}: {e}"),
        }
    }

    // Sort by last_opened_at descending (most recent first).
    agents.sort_by(|a, b| {
        let a_time = a.last_opened_at.as_deref().unwrap_or("");
        let b_time = b.last_opened_at.as_deref().unwrap_or("");
        b_time.cmp(a_time)
    });

    Ok(agents)
}

#[tauri::command(rename_all = "snake_case")]
pub fn create_agent(
    root: tauri::State<'_, WorkspaceRoot>,
    workspace_id: String,
    name: String,
    config_id: String,
    color: Option<String>,
    claude_md: Option<String>,
    installed_path: Option<String>,
    seeds: Option<HashMap<String, String>>,
    existing_path: Option<String>,
) -> Result<CreateAgentResult, String> {
    let ws_dir = resolve_ws_folder(&root.0, &workspace_id)?;

    // If linking an existing project directory, use that path directly
    // and create a symlink inside the workspace so list_agents discovers it.
    // Otherwise, create a new folder under the workspace.
    let is_linked = existing_path.is_some();
    let folder = if let Some(ref ep) = existing_path {
        let p = houston_tauri::paths::expand_tilde(&PathBuf::from(ep));
        if !p.exists() {
            return Err(format!("Directory does not exist: {}", p.display()));
        }
        let link_path = ws_dir.join(&name);
        if link_path.exists() {
            return Err(format!("An agent named \"{name}\" already exists"));
        }
        // Symlink: workspace/{name} → external path.
        // list_agents scans workspace subdirs and follows symlinks transparently.
        #[cfg(unix)]
        std::os::unix::fs::symlink(&p, &link_path)
            .map_err(|e| format!("Failed to link project directory: {e}"))?;
        p
    } else {
        let f = ws_dir.join(&name);
        if f.exists() {
            return Err(format!("An agent named \"{name}\" already exists"));
        }
        fs::create_dir_all(&f)
            .map_err(|e| format!("Failed to create agent directory: {e}"))?;
        f
    };

    let houston = houston_dir(&folder);
    fs::create_dir_all(folder.join(".agents/skills"))
        .map_err(|e| format!("Failed to create .agents/skills: {e}"))?;

    let now = now_iso();
    let meta = AgentMeta {
        id: Uuid::new_v4().to_string(),
        name: if is_linked { Some(name.clone()) } else { None },
        config_id,
        color,
        created_at: now.clone(),
        last_opened_at: Some(now),
    };
    write_agent_meta(&folder, &meta)?;

    // Seed CLAUDE.md: prefer inline claudeMd > installed definition's CLAUDE.md > generic
    let claude_md_path = folder.join("CLAUDE.md");
    if !claude_md_path.exists() {
        let content = claude_md
            .or_else(|| {
                installed_path.as_ref().and_then(|p| {
                    fs::read_to_string(PathBuf::from(p).join("CLAUDE.md")).ok()
                })
            })
            .unwrap_or_else(|| "## Instructions\n\n## Learnings\n".to_string());
        fs::write(&claude_md_path, &content)
            .map_err(|e| format!("Failed to write CLAUDE.md: {e}"))?;
    }

    // Seed data files from agent definition (e.g., empty JSON arrays for custom tabs)
    if let Some(seed_files) = seeds {
        for (path, content) in &seed_files {
            let target = folder.join(path);
            if !target.exists() {
                if let Some(parent) = target.parent() {
                    fs::create_dir_all(parent)
                        .map_err(|e| format!("Failed to create dir for {path}: {e}"))?;
                }
                fs::write(&target, content)
                    .map_err(|e| format!("Failed to seed {path}: {e}"))?;
            }
        }
    }

    // Seed prompt files
    crate::agent::seed_agent(&folder)?;

    // Seed onboarding activity for blank agents with a unique id per agent,
    // so session keys can never collide between agents.
    let mut onboarding_activity_id: Option<String> = None;
    if meta.config_id == "blank" {
        let activity_id = Uuid::new_v4().to_string();
        let onboarding = serde_json::json!([{
            "id": activity_id,
            "title": "Set up your agent",
            "description": "I'll walk you through configuring your job description, connecting tools, and setting up routines.",
            "status": "running",
            "updated_at": &meta.created_at
        }]);
        seed_json_if_missing(
            &houston,
            "activity.json",
            &serde_json::to_string(&onboarding).unwrap_or_else(|_| "[]".to_string()),
        )?;
        onboarding_activity_id = Some(activity_id);
    } else {
        seed_json_if_missing(&houston, "activity.json", "[]")?;
    }
    seed_json_if_missing(&houston, "config.json", "{}")?;

    Ok(CreateAgentResult {
        agent: meta_to_agent(&folder, &meta),
        onboarding_activity_id,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub fn delete_agent(
    root: tauri::State<'_, WorkspaceRoot>,
    workspace_id: String,
    id: String,
) -> Result<(), String> {
    let ws_dir = resolve_ws_folder(&root.0, &workspace_id)?;
    let folder = find_agent_by_id(&ws_dir, &id)?;
    if folder.is_symlink() {
        // Linked agent: remove only the symlink, not the external project.
        fs::remove_file(&folder)
            .map_err(|e| format!("Failed to unlink agent: {e}"))?;
    } else {
        fs::remove_dir_all(&folder)
            .map_err(|e| format!("Failed to delete agent: {e}"))?;
    }
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn rename_agent(
    root: tauri::State<'_, WorkspaceRoot>,
    workspace_id: String,
    id: String,
    new_name: String,
) -> Result<Agent, String> {
    let ws_dir = resolve_ws_folder(&root.0, &workspace_id)?;
    let old_folder = find_agent_by_id(&ws_dir, &id)?;
    let new_link = ws_dir.join(&new_name);

    if new_link.exists() {
        return Err(format!(
            "An agent named \"{new_name}\" already exists"
        ));
    }

    if old_folder.is_symlink() {
        // Linked agent: recreate symlink with new name, update meta.name.
        let target = fs::read_link(&old_folder)
            .map_err(|e| format!("Failed to read symlink: {e}"))?;
        fs::remove_file(&old_folder)
            .map_err(|e| format!("Failed to remove old symlink: {e}"))?;
        #[cfg(unix)]
        std::os::unix::fs::symlink(&target, &new_link)
            .map_err(|e| format!("Failed to create new symlink: {e}"))?;
        let mut meta = read_agent_meta(&new_link)?;
        meta.name = Some(new_name);
        write_agent_meta(&new_link, &meta)?;
        Ok(meta_to_agent(&new_link, &meta))
    } else {
        // Regular agent: rename the folder.
        fs::rename(&old_folder, &new_link)
            .map_err(|e| format!("Failed to rename agent: {e}"))?;
        let meta = read_agent_meta(&new_link)?;
        Ok(meta_to_agent(&new_link, &meta))
    }
}

#[tauri::command(rename_all = "snake_case")]
pub fn update_agent_opened(
    root: tauri::State<'_, WorkspaceRoot>,
    workspace_id: String,
    id: String,
) -> Result<(), String> {
    let ws_dir = resolve_ws_folder(&root.0, &workspace_id)?;
    let folder = find_agent_by_id(&ws_dir, &id)?;
    let mut meta = read_agent_meta(&folder)?;
    meta.last_opened_at = Some(now_iso());
    write_agent_meta(&folder, &meta)?;
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
