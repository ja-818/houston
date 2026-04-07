//! CRUD operations for `.houston/goals.json`.

use super::helpers::{read_json, write_json};
use super::types::{Goal, GoalUpdate};
use std::path::Path;
use uuid::Uuid;

const FILE: &str = "goals.json";

pub fn list(root: &Path) -> Result<Vec<Goal>, String> {
    read_json::<Vec<Goal>>(root, FILE)
}

pub fn create(root: &Path, title: &str) -> Result<Goal, String> {
    let mut goals = list(root)?;
    let goal = Goal {
        id: Uuid::new_v4().to_string(),
        title: title.to_string(),
        status: "active".to_string(),
    };
    goals.push(goal.clone());
    write_json(root, FILE, &goals)?;
    Ok(goal)
}

pub fn update(root: &Path, id: &str, updates: GoalUpdate) -> Result<Goal, String> {
    let mut goals = list(root)?;
    let goal = goals
        .iter_mut()
        .find(|g| g.id == id)
        .ok_or_else(|| format!("Goal not found: {id}"))?;

    if let Some(title) = updates.title {
        goal.title = title;
    }
    if let Some(status) = updates.status {
        goal.status = status;
    }

    let result = goal.clone();
    write_json(root, FILE, &goals)?;
    Ok(result)
}

pub fn delete(root: &Path, id: &str) -> Result<(), String> {
    let mut goals = list(root)?;
    let before = goals.len();
    goals.retain(|g| g.id != id);
    if goals.len() == before {
        return Err(format!("Goal not found: {id}"));
    }
    write_json(root, FILE, &goals)
}
