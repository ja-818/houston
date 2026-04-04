//! Skill, log, and config Tauri commands.

use super::resolve_project_dir;
use crate::state::AppState;
use crate::workspace_store::types::*;
use crate::workspace_store::WorkspaceStore;
use tauri::State;

// -- Skills --

#[tauri::command]
pub async fn list_skills(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<Skill>, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).list_skills()
}

#[tauri::command]
pub async fn read_skill(
    state: State<'_, AppState>,
    project_id: String,
    name: String,
) -> Result<Skill, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).read_skill(&name)
}

#[tauri::command]
pub async fn write_skill(
    state: State<'_, AppState>,
    project_id: String,
    name: String,
    instructions: String,
    learnings: String,
) -> Result<(), String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).write_skill(&name, &instructions, &learnings)
}

#[tauri::command]
pub async fn delete_skill(
    state: State<'_, AppState>,
    project_id: String,
    name: String,
) -> Result<(), String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).delete_skill(&name)
}

// -- Log --

#[tauri::command]
pub async fn append_log(
    state: State<'_, AppState>,
    project_id: String,
    entry: LogEntry,
) -> Result<(), String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).append_log(&entry)
}

#[tauri::command]
pub async fn read_log(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<LogEntry>, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).read_log()
}

// -- Config --

#[tauri::command]
pub async fn read_config(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<ProjectConfig, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).read_config()
}

#[tauri::command]
pub async fn write_config(
    state: State<'_, AppState>,
    project_id: String,
    config: ProjectConfig,
) -> Result<(), String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).write_config(&config)
}
