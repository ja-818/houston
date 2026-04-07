//! Task, routine, goal, and channel Tauri commands.
//! All mutation commands emit events for AI-native reactivity.

use super::resolve_agent_dir;
use crate::events::HoustonEvent;
use crate::agent_store::types::*;
use crate::agent_store::AgentStore;
use tauri::Emitter;

// -- Conversations --

#[tauri::command(rename_all = "snake_case")]
pub async fn list_conversations(
    agent_path: String,
) -> Result<Vec<ConversationEntry>, String> {
    let root = resolve_agent_dir(&agent_path)?;
    AgentStore::new(&root).list_conversations()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_all_conversations(
    agent_paths: Vec<String>,
) -> Result<Vec<ConversationEntry>, String> {
    let roots: Vec<_> = agent_paths
        .iter()
        .map(|p| resolve_agent_dir(p))
        .collect::<Result<Vec<_>, _>>()?;
    let refs: Vec<&std::path::Path> = roots.iter().map(|p| p.as_path()).collect();
    crate::agent_store::conversations::list_all(&refs)
}

// -- Activity --

#[tauri::command(rename_all = "snake_case")]
pub async fn list_activity(
    agent_path: String,
) -> Result<Vec<Activity>, String> {
    let root = resolve_agent_dir(&agent_path)?;
    AgentStore::new(&root).list_activity()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_activity(
    app_handle: tauri::AppHandle,
    agent_path: String,
    title: String,
    description: String,
) -> Result<Activity, String> {
    let root = resolve_agent_dir(&agent_path)?;
    let item = AgentStore::new(&root).create_activity(&title, &description)?;
    let _ = app_handle.emit("houston-event", HoustonEvent::ActivityChanged {
        agent_path: agent_path.clone(),
    });
    Ok(item)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_activity(
    app_handle: tauri::AppHandle,
    agent_path: String,
    activity_id: String,
    updates: ActivityUpdate,
) -> Result<Activity, String> {
    let root = resolve_agent_dir(&agent_path)?;
    let item = AgentStore::new(&root).update_activity(&activity_id, updates)?;
    let _ = app_handle.emit("houston-event", HoustonEvent::ActivityChanged {
        agent_path: agent_path.clone(),
    });
    Ok(item)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_activity(
    app_handle: tauri::AppHandle,
    agent_path: String,
    activity_id: String,
) -> Result<(), String> {
    let root = resolve_agent_dir(&agent_path)?;
    AgentStore::new(&root).delete_activity(&activity_id)?;
    let _ = app_handle.emit("houston-event", HoustonEvent::ActivityChanged {
        agent_path: agent_path.clone(),
    });
    Ok(())
}

// -- Routines --

#[tauri::command(rename_all = "snake_case")]
pub async fn list_routines(
    agent_path: String,
) -> Result<Vec<Routine>, String> {
    let root = resolve_agent_dir(&agent_path)?;
    AgentStore::new(&root).list_routines()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_routine(
    app_handle: tauri::AppHandle,
    agent_path: String,
    input: NewRoutine,
) -> Result<Routine, String> {
    let root = resolve_agent_dir(&agent_path)?;
    let routine = AgentStore::new(&root).create_routine(input)?;
    let _ = app_handle.emit("houston-event", HoustonEvent::RoutinesChanged {
        project_id: agent_path.clone(),
        agent_path: agent_path.clone(),
    });
    Ok(routine)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_routine(
    app_handle: tauri::AppHandle,
    agent_path: String,
    routine_id: String,
    updates: RoutineUpdate,
) -> Result<Routine, String> {
    let root = resolve_agent_dir(&agent_path)?;
    let routine = AgentStore::new(&root).update_routine(&routine_id, updates)?;
    let _ = app_handle.emit("houston-event", HoustonEvent::RoutinesChanged {
        project_id: agent_path.clone(),
        agent_path: agent_path.clone(),
    });
    Ok(routine)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_routine(
    app_handle: tauri::AppHandle,
    agent_path: String,
    routine_id: String,
) -> Result<(), String> {
    let root = resolve_agent_dir(&agent_path)?;
    AgentStore::new(&root).delete_routine(&routine_id)?;
    let _ = app_handle.emit("houston-event", HoustonEvent::RoutinesChanged {
        project_id: agent_path.clone(),
        agent_path: agent_path.clone(),
    });
    Ok(())
}

// -- Goals --

#[tauri::command(rename_all = "snake_case")]
pub async fn list_goals(
    agent_path: String,
) -> Result<Vec<Goal>, String> {
    let root = resolve_agent_dir(&agent_path)?;
    AgentStore::new(&root).list_goals()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_goal(
    agent_path: String,
    title: String,
) -> Result<Goal, String> {
    let root = resolve_agent_dir(&agent_path)?;
    AgentStore::new(&root).create_goal(&title)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_goal(
    agent_path: String,
    goal_id: String,
    updates: GoalUpdate,
) -> Result<Goal, String> {
    let root = resolve_agent_dir(&agent_path)?;
    AgentStore::new(&root).update_goal(&goal_id, updates)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_goal(
    agent_path: String,
    goal_id: String,
) -> Result<(), String> {
    let root = resolve_agent_dir(&agent_path)?;
    AgentStore::new(&root).delete_goal(&goal_id)
}

// -- Channels --

#[tauri::command(rename_all = "snake_case")]
pub async fn list_channels_config(
    agent_path: String,
) -> Result<Vec<ChannelEntry>, String> {
    let root = resolve_agent_dir(&agent_path)?;
    AgentStore::new(&root).list_channels()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn add_channel_config(
    app_handle: tauri::AppHandle,
    agent_path: String,
    input: NewChannel,
) -> Result<ChannelEntry, String> {
    let root = resolve_agent_dir(&agent_path)?;
    let entry = AgentStore::new(&root).add_channel(input)?;
    let _ = app_handle.emit("houston-event", HoustonEvent::ChannelsConfigChanged {
        agent_path: agent_path.clone(),
    });
    Ok(entry)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn remove_channel_config(
    app_handle: tauri::AppHandle,
    agent_path: String,
    channel_id: String,
) -> Result<(), String> {
    let root = resolve_agent_dir(&agent_path)?;
    AgentStore::new(&root).remove_channel(&channel_id)?;
    let _ = app_handle.emit("houston-event", HoustonEvent::ChannelsConfigChanged {
        agent_path: agent_path.clone(),
    });
    Ok(())
}
