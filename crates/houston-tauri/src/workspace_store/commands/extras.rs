//! Skill, log, and config Tauri commands.

use super::resolve_workspace_dir;
use crate::workspace_store::types::*;
use crate::workspace_store::WorkspaceStore;

// -- Skills --

#[tauri::command(rename_all = "snake_case")]
pub async fn list_skills(
    workspace_path: String,
) -> Result<Vec<Skill>, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).list_skills()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_skill(
    workspace_path: String,
    name: String,
) -> Result<Skill, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).read_skill(&name)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn write_skill(
    workspace_path: String,
    name: String,
    instructions: String,
    learnings: String,
) -> Result<(), String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).write_skill(&name, &instructions, &learnings)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_skill(
    workspace_path: String,
    name: String,
) -> Result<(), String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).delete_skill(&name)
}

// -- Log --

#[tauri::command(rename_all = "snake_case")]
pub async fn append_log(
    workspace_path: String,
    entry: LogEntry,
) -> Result<(), String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).append_log(&entry)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_log(
    workspace_path: String,
) -> Result<Vec<LogEntry>, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).read_log()
}

// -- Config --

#[tauri::command(rename_all = "snake_case")]
pub async fn read_config(
    workspace_path: String,
) -> Result<ProjectConfig, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).read_config()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn write_config(
    workspace_path: String,
    config: ProjectConfig,
) -> Result<(), String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).write_config(&config)
}
