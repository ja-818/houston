//! CRUD operations for `.houston/routines.json`.

use super::helpers::{read_json, write_json};
use super::types::{NewRoutine, Routine, RoutineUpdate};
use chrono::Utc;
use std::path::Path;
use uuid::Uuid;

const FILE: &str = "routines";

pub fn list(root: &Path) -> Result<Vec<Routine>, String> {
    read_json::<Vec<Routine>>(root, FILE)
}

pub fn create(root: &Path, input: NewRoutine) -> Result<Routine, String> {
    let mut routines = list(root)?;
    let now = Utc::now().to_rfc3339();
    let routine = Routine {
        id: Uuid::new_v4().to_string(),
        name: input.name,
        description: input.description,
        prompt: input.prompt,
        schedule: input.schedule,
        enabled: input.enabled,
        suppress_when_silent: input.suppress_when_silent,
        created_at: now.clone(),
        updated_at: now,
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
    if let Some(prompt) = updates.prompt {
        routine.prompt = prompt;
    }
    if let Some(schedule) = updates.schedule {
        routine.schedule = schedule;
    }
    if let Some(enabled) = updates.enabled {
        routine.enabled = enabled;
    }
    if let Some(suppress) = updates.suppress_when_silent {
        routine.suppress_when_silent = suppress;
    }
    routine.updated_at = Utc::now().to_rfc3339();

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
