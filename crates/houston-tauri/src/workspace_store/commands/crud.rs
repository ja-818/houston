//! Task, routine, goal, and channel Tauri commands.

use super::resolve_workspace_dir;
use crate::workspace_store::types::*;
use crate::workspace_store::WorkspaceStore;

// -- Conversations --

#[tauri::command(rename_all = "snake_case")]
pub async fn list_conversations(
    workspace_path: String,
) -> Result<Vec<ConversationEntry>, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).list_conversations()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_all_conversations(
    workspace_paths: Vec<String>,
) -> Result<Vec<ConversationEntry>, String> {
    let roots: Vec<_> = workspace_paths
        .iter()
        .map(|p| resolve_workspace_dir(p))
        .collect::<Result<Vec<_>, _>>()?;
    let refs: Vec<&std::path::Path> = roots.iter().map(|p| p.as_path()).collect();
    crate::workspace_store::conversations::list_all(&refs)
}

// -- Tasks --

#[tauri::command(rename_all = "snake_case")]
pub async fn list_tasks(
    workspace_path: String,
) -> Result<Vec<Task>, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).list_tasks()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_task(
    workspace_path: String,
    title: String,
    description: String,
) -> Result<Task, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).create_task(&title, &description)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_task(
    workspace_path: String,
    task_id: String,
    updates: TaskUpdate,
) -> Result<Task, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).update_task(&task_id, updates)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_task(
    workspace_path: String,
    task_id: String,
) -> Result<(), String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).delete_task(&task_id)
}

// -- Routines --

#[tauri::command(rename_all = "snake_case")]
pub async fn list_routines(
    workspace_path: String,
) -> Result<Vec<Routine>, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).list_routines()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_routine(
    workspace_path: String,
    input: NewRoutine,
) -> Result<Routine, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).create_routine(input)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_routine(
    workspace_path: String,
    routine_id: String,
    updates: RoutineUpdate,
) -> Result<Routine, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).update_routine(&routine_id, updates)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_routine(
    workspace_path: String,
    routine_id: String,
) -> Result<(), String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).delete_routine(&routine_id)
}

// -- Goals --

#[tauri::command(rename_all = "snake_case")]
pub async fn list_goals(
    workspace_path: String,
) -> Result<Vec<Goal>, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).list_goals()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_goal(
    workspace_path: String,
    title: String,
) -> Result<Goal, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).create_goal(&title)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_goal(
    workspace_path: String,
    goal_id: String,
    updates: GoalUpdate,
) -> Result<Goal, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).update_goal(&goal_id, updates)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_goal(
    workspace_path: String,
    goal_id: String,
) -> Result<(), String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).delete_goal(&goal_id)
}

// -- Channels --

#[tauri::command(rename_all = "snake_case")]
pub async fn list_channels_config(
    workspace_path: String,
) -> Result<Vec<ChannelEntry>, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).list_channels()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn add_channel_config(
    workspace_path: String,
    input: NewChannel,
) -> Result<ChannelEntry, String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).add_channel(input)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn remove_channel_config(
    workspace_path: String,
    channel_id: String,
) -> Result<(), String> {
    let root = resolve_workspace_dir(&workspace_path)?;
    WorkspaceStore::new(&root).remove_channel(&channel_id)
}
