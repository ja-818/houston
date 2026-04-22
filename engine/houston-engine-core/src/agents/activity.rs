//! CRUD operations for `.houston/activity/activity.json`.

use super::store::{read_json, write_json};
use super::types::{Activity, ActivityUpdate, NewActivity};
use crate::error::{CoreError, CoreResult};
use chrono::Utc;
use std::path::Path;
use uuid::Uuid;

const FILE: &str = "activity";

pub fn list(root: &Path) -> CoreResult<Vec<Activity>> {
    read_json::<Vec<Activity>>(root, FILE)
}

pub fn create(root: &Path, input: NewActivity) -> CoreResult<Activity> {
    let mut items = list(root)?;
    let now = Utc::now().to_rfc3339();
    let item = Activity {
        id: Uuid::new_v4().to_string(),
        title: input.title,
        description: input.description,
        status: "running".to_string(),
        claude_session_id: None,
        session_key: None,
        agent: input.agent,
        worktree_path: input.worktree_path,
        routine_id: None,
        routine_run_id: None,
        updated_at: Some(now),
    };
    items.push(item.clone());
    write_json(root, FILE, &items)?;
    Ok(item)
}

pub fn update(root: &Path, id: &str, updates: ActivityUpdate) -> CoreResult<Activity> {
    let mut items = list(root)?;
    let item = items
        .iter_mut()
        .find(|t| t.id == id)
        .ok_or_else(|| CoreError::NotFound(format!("activity {id}")))?;

    if let Some(title) = updates.title {
        item.title = title;
    }
    if let Some(description) = updates.description {
        item.description = description;
    }
    if let Some(status) = updates.status {
        item.status = status;
    }
    if let Some(session_id) = updates.claude_session_id {
        item.claude_session_id = session_id;
    }
    if let Some(session_key) = updates.session_key {
        item.session_key = Some(session_key);
    }
    if let Some(agent) = updates.agent {
        item.agent = Some(agent);
    }
    if let Some(worktree_path) = updates.worktree_path {
        item.worktree_path = worktree_path;
    }
    if let Some(routine_id) = updates.routine_id {
        item.routine_id = Some(routine_id);
    }
    if let Some(routine_run_id) = updates.routine_run_id {
        item.routine_run_id = Some(routine_run_id);
    }

    item.updated_at = Some(Utc::now().to_rfc3339());

    let result = item.clone();
    write_json(root, FILE, &items)?;
    Ok(result)
}

pub fn delete(root: &Path, id: &str) -> CoreResult<()> {
    let mut items = list(root)?;
    let before = items.len();
    items.retain(|t| t.id != id);
    if items.len() == before {
        return Err(CoreError::NotFound(format!("activity {id}")));
    }
    write_json(root, FILE, &items)
}
