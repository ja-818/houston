//! Task, routine, goal, and channel Tauri commands.

use super::resolve_project_dir;
use crate::state::AppState;
use crate::workspace_store::types::*;
use crate::workspace_store::WorkspaceStore;
use tauri::State;

// -- Tasks --

#[tauri::command]
pub async fn list_tasks(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<Task>, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).list_tasks()
}

#[tauri::command]
pub async fn create_task(
    state: State<'_, AppState>,
    project_id: String,
    title: String,
    description: String,
) -> Result<Task, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).create_task(&title, &description)
}

#[tauri::command]
pub async fn update_task(
    state: State<'_, AppState>,
    project_id: String,
    task_id: String,
    updates: TaskUpdate,
) -> Result<Task, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).update_task(&task_id, updates)
}

#[tauri::command]
pub async fn delete_task(
    state: State<'_, AppState>,
    project_id: String,
    task_id: String,
) -> Result<(), String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).delete_task(&task_id)
}

// -- Routines --

#[tauri::command]
pub async fn list_routines(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<Routine>, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).list_routines()
}

#[tauri::command]
pub async fn create_routine(
    state: State<'_, AppState>,
    project_id: String,
    input: NewRoutine,
) -> Result<Routine, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).create_routine(input)
}

#[tauri::command]
pub async fn update_routine(
    state: State<'_, AppState>,
    project_id: String,
    routine_id: String,
    updates: RoutineUpdate,
) -> Result<Routine, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).update_routine(&routine_id, updates)
}

#[tauri::command]
pub async fn delete_routine(
    state: State<'_, AppState>,
    project_id: String,
    routine_id: String,
) -> Result<(), String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).delete_routine(&routine_id)
}

// -- Goals --

#[tauri::command]
pub async fn list_goals(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<Goal>, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).list_goals()
}

#[tauri::command]
pub async fn create_goal(
    state: State<'_, AppState>,
    project_id: String,
    title: String,
) -> Result<Goal, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).create_goal(&title)
}

#[tauri::command]
pub async fn update_goal(
    state: State<'_, AppState>,
    project_id: String,
    goal_id: String,
    updates: GoalUpdate,
) -> Result<Goal, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).update_goal(&goal_id, updates)
}

#[tauri::command]
pub async fn delete_goal(
    state: State<'_, AppState>,
    project_id: String,
    goal_id: String,
) -> Result<(), String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).delete_goal(&goal_id)
}

// -- Channels --

#[tauri::command]
pub async fn list_channels_config(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<ChannelEntry>, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).list_channels()
}

#[tauri::command]
pub async fn add_channel_config(
    state: State<'_, AppState>,
    project_id: String,
    input: NewChannel,
) -> Result<ChannelEntry, String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).add_channel(input)
}

#[tauri::command]
pub async fn remove_channel_config(
    state: State<'_, AppState>,
    project_id: String,
    channel_id: String,
) -> Result<(), String> {
    let root = resolve_project_dir(&state, &project_id).await?;
    WorkspaceStore::new(&root).remove_channel(&channel_id)
}
