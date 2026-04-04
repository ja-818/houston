//! CRUD operations for `.keel/tasks.json`.

use super::helpers::{read_json, write_json};
use super::types::{Task, TaskUpdate};
use std::path::Path;
use uuid::Uuid;

const FILE: &str = "tasks.json";

pub fn list(root: &Path) -> Result<Vec<Task>, String> {
    read_json::<Vec<Task>>(root, FILE)
}

pub fn create(root: &Path, title: &str, description: &str) -> Result<Task, String> {
    let mut tasks = list(root)?;
    let task = Task {
        id: Uuid::new_v4().to_string(),
        title: title.to_string(),
        description: description.to_string(),
        status: "queue".to_string(),
        claude_session_id: None,
    };
    tasks.push(task.clone());
    write_json(root, FILE, &tasks)?;
    Ok(task)
}

pub fn update(root: &Path, id: &str, updates: TaskUpdate) -> Result<Task, String> {
    let mut tasks = list(root)?;
    let task = tasks
        .iter_mut()
        .find(|t| t.id == id)
        .ok_or_else(|| format!("Task not found: {id}"))?;

    if let Some(title) = updates.title {
        task.title = title;
    }
    if let Some(description) = updates.description {
        task.description = description;
    }
    if let Some(status) = updates.status {
        task.status = status;
    }
    if let Some(session_id) = updates.claude_session_id {
        task.claude_session_id = session_id;
    }

    let result = task.clone();
    write_json(root, FILE, &tasks)?;
    Ok(result)
}

pub fn delete(root: &Path, id: &str) -> Result<(), String> {
    let mut tasks = list(root)?;
    let before = tasks.len();
    tasks.retain(|t| t.id != id);
    if tasks.len() == before {
        return Err(format!("Task not found: {id}"));
    }
    write_json(root, FILE, &tasks)
}
