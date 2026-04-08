use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use super::workspaces::workspace_folder;

/// Persisted agent metadata stored in .houston/agent.json.
#[derive(Serialize, Deserialize, Clone)]
pub struct AgentMeta {
    pub id: String,
    pub config_id: String,
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
    pub created_at: String,
    pub last_opened_at: Option<String>,
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
    let name = folder
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    Agent {
        id: meta.id.clone(),
        name,
        folder_path: folder.to_string_lossy().to_string(),
        config_id: meta.config_id.clone(),
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
        if !path.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        if !agent_json_path(&path).exists() {
            continue;
        }
        match read_agent_meta(&path) {
            Ok(meta) => agents.push(meta_to_agent(&path, &meta)),
            Err(e) => eprintln!("[agents] skipping {name}: {e}"),
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
    claude_md: Option<String>,
) -> Result<Agent, String> {
    let ws_dir = resolve_ws_folder(&root.0, &workspace_id)?;
    let folder = ws_dir.join(&name);

    if folder.exists() {
        return Err(format!("An agent named \"{name}\" already exists"));
    }

    fs::create_dir_all(&folder)
        .map_err(|e| format!("Failed to create agent directory: {e}"))?;

    let houston = houston_dir(&folder);
    fs::create_dir_all(folder.join(".agents/skills"))
        .map_err(|e| format!("Failed to create .agents/skills: {e}"))?;

    let now = now_iso();
    let meta = AgentMeta {
        id: Uuid::new_v4().to_string(),
        config_id,
        created_at: now.clone(),
        last_opened_at: Some(now),
    };
    write_agent_meta(&folder, &meta)?;

    // Seed CLAUDE.md from agent config or use generic template
    let claude_md_path = folder.join("CLAUDE.md");
    if !claude_md_path.exists() {
        let content = claude_md
            .unwrap_or_else(|| "## Instructions\n\n## Learnings\n".to_string());
        fs::write(&claude_md_path, content)
            .map_err(|e| format!("Failed to write CLAUDE.md: {e}"))?;
    }

    // Seed prompt files
    crate::agent::seed_agent(&folder)?;

    // Seed onboarding activity for blank agents
    if meta.config_id == "blank" {
        let onboarding = serde_json::json!([{
            "id": "onboarding",
            "title": "Set up your agent",
            "description": "I'll walk you through configuring your job description, connecting tools, and setting up routines.",
            "status": "needs_you",
            "updated_at": &meta.created_at
        }]);
        seed_json_if_missing(
            &houston,
            "activity.json",
            &serde_json::to_string(&onboarding).unwrap_or_else(|_| "[]".to_string()),
        )?;
    } else {
        seed_json_if_missing(&houston, "activity.json", "[]")?;
    }
    seed_json_if_missing(&houston, "config.json", "{}")?;

    Ok(meta_to_agent(&folder, &meta))
}

#[tauri::command(rename_all = "snake_case")]
pub fn delete_agent(
    root: tauri::State<'_, WorkspaceRoot>,
    workspace_id: String,
    id: String,
) -> Result<(), String> {
    let ws_dir = resolve_ws_folder(&root.0, &workspace_id)?;
    let folder = find_agent_by_id(&ws_dir, &id)?;
    fs::remove_dir_all(&folder)
        .map_err(|e| format!("Failed to delete agent: {e}"))?;
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
    let new_folder = ws_dir.join(&new_name);

    if new_folder.exists() {
        return Err(format!(
            "An agent named \"{new_name}\" already exists"
        ));
    }

    fs::rename(&old_folder, &new_folder)
        .map_err(|e| format!("Failed to rename agent: {e}"))?;

    let meta = read_agent_meta(&new_folder)?;
    Ok(meta_to_agent(&new_folder, &meta))
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
