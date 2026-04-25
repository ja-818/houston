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
    // Every activity is bound to a session via the convention
    // `activity-{id}`. Storing this on the row lets
    // `sessions::start` and `set_status_by_session_key` find the row
    // without needing the caller to pass both IDs. Without this, any
    // attempt to flip status from the session lifecycle silently
    // no-ops — which is what left agents stuck on "needs_you" even
    // while a new session was actively streaming.
    let id = Uuid::new_v4().to_string();
    let session_key = format!("activity-{id}");
    let item = Activity {
        id,
        title: input.title,
        description: input.description,
        status: "running".to_string(),
        claude_session_id: None,
        session_key: Some(session_key),
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

/// Set the status of the activity bound to `session_key`. Returns
/// `Ok(Some(activity))` if an activity was found and updated, `Ok(None)`
/// if no activity matches the session key (e.g. ad-hoc chat session
/// with no board item).
///
/// Matching order:
///   1. Exact match on the `session_key` field.
///   2. The "activity-{id}" convention — any older activity created
///      before `session_key` was persisted still has its id reachable
///      this way. Without this fallback, every legacy / onboarding row
///      would be stuck on whatever status it booted with forever.
///
/// Used by `sessions::start` so any client that kicks off a session —
/// desktop, mobile, or a third-party frontend — gets consistent
/// "Running" state on the board without each client having to write
/// the activity file themselves.
pub fn set_status_by_session_key(
    root: &Path,
    session_key: &str,
    status: &str,
) -> CoreResult<Option<Activity>> {
    let mut items = list(root)?;
    let implied_id = session_key.strip_prefix("activity-");
    let Some(item) = items.iter_mut().find(|t| {
        t.session_key.as_deref() == Some(session_key)
            || implied_id.is_some_and(|id| t.id == id)
    }) else {
        return Ok(None);
    };
    // Opportunistically heal legacy rows: if we matched via the id
    // convention but the session_key field was empty, backfill it so
    // future lookups hit the fast path.
    if item.session_key.as_deref() != Some(session_key) {
        item.session_key = Some(session_key.to_string());
    }
    if item.status == status {
        let result = item.clone();
        write_json(root, FILE, &items)?;
        return Ok(Some(result));
    }
    item.status = status.to_string();
    item.updated_at = Some(Utc::now().to_rfc3339());
    let result = item.clone();
    write_json(root, FILE, &items)?;
    Ok(Some(result))
}
