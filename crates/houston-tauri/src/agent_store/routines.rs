//! CRUD operations for `.houston/routines.json`.

use super::helpers::{read_json, write_json};
use super::types::{NewRoutine, Routine, RoutineUpdate};
use std::path::Path;
use uuid::Uuid;

const FILE: &str = "routines.json";

pub fn list(root: &Path) -> Result<Vec<Routine>, String> {
    read_json::<Vec<Routine>>(root, FILE)
}

pub fn create(root: &Path, input: NewRoutine) -> Result<Routine, String> {
    let mut routines = list(root)?;
    let routine = Routine {
        id: Uuid::new_v4().to_string(),
        name: input.name,
        description: input.description,
        trigger_type: input.trigger_type,
        trigger_config: input.trigger_config,
        status: "active".to_string(),
        approval_mode: input.approval_mode,
        claude_session_id: None,
    };
    routines.push(routine.clone());
    write_json(root, FILE, &routines)?;
    Ok(routine)
}

pub fn update(root: &Path, id: &str, updates: RoutineUpdate) -> Result<Routine, String> {
    let mut routines = list(root)?;
    let routine = routines
        .iter_mut()
        .find(|r| r.id == id)
        .ok_or_else(|| format!("Routine not found: {id}"))?;

    if let Some(name) = updates.name {
        routine.name = name;
    }
    if let Some(description) = updates.description {
        routine.description = description;
    }
    if let Some(trigger_type) = updates.trigger_type {
        routine.trigger_type = trigger_type;
    }
    if let Some(trigger_config) = updates.trigger_config {
        routine.trigger_config = trigger_config;
    }
    if let Some(status) = updates.status {
        routine.status = status;
    }
    if let Some(approval_mode) = updates.approval_mode {
        routine.approval_mode = approval_mode;
    }
    if let Some(session_id) = updates.claude_session_id {
        routine.claude_session_id = session_id;
    }

    let result = routine.clone();
    write_json(root, FILE, &routines)?;
    Ok(result)
}

pub fn delete(root: &Path, id: &str) -> Result<(), String> {
    let mut routines = list(root)?;
    let before = routines.len();
    routines.retain(|r| r.id != id);
    if routines.len() == before {
        return Err(format!("Routine not found: {id}"));
    }
    write_json(root, FILE, &routines)
}
