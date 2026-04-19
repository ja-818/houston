//! Generic `read_agent_file` / `write_agent_file` Tauri commands.
//!
//! Replaces the legacy per-type CRUD commands (list_activity, create_routine, etc.)
//! with two file-level primitives that the frontend layers its JSON Schema validation on.
//!
//! The commands operate on paths relative to an agent's workspace directory; the
//! `houston-agent-files` crate enforces path-traversal safety and atomic writes.

use std::path::PathBuf;

use houston_agent_files as files;
use tauri::Emitter;

use crate::events::HoustonEvent;
use crate::paths::expand_tilde;

fn resolve_agent_dir(agent_path: &str) -> Result<PathBuf, String> {
    Ok(expand_tilde(&PathBuf::from(agent_path)))
}

/// Read a file under an agent's directory. Returns `""` if the file does not exist.
#[tauri::command(rename_all = "snake_case")]
pub async fn read_agent_file(agent_path: String, rel_path: String) -> Result<String, String> {
    let root = resolve_agent_dir(&agent_path)?;
    files::read_file(&root, &rel_path).map_err(|e| e.to_string())
}

/// Write a file atomically under an agent's directory. Emits the matching `HoustonEvent`
/// so the frontend can invalidate TanStack Query caches (AI-native reactivity).
#[tauri::command(rename_all = "snake_case")]
pub async fn write_agent_file(
    app_handle: tauri::AppHandle,
    agent_path: String,
    rel_path: String,
    content: String,
) -> Result<(), String> {
    let root = resolve_agent_dir(&agent_path)?;
    files::write_file_atomic(&root, &rel_path, &content).map_err(|e| e.to_string())?;

    // Emit an event based on the data type (first path segment under `.houston/`).
    if let Some(event) = event_for_write(&agent_path, &rel_path) {
        let _ = app_handle.emit("houston-event", event);
    }
    Ok(())
}

fn event_for_write(agent_path: &str, rel_path: &str) -> Option<HoustonEvent> {
    // Context files — CLAUDE.md or .houston/prompts/** — fire ContextChanged.
    if rel_path == "CLAUDE.md" || rel_path.starts_with(".houston/prompts/") {
        return Some(HoustonEvent::ContextChanged {
            agent_path: agent_path.to_string(),
        });
    }
    let kind = files::classify(rel_path)?;
    let agent_path = agent_path.to_string();
    Some(match kind.as_str() {
        "activity" => HoustonEvent::ActivityChanged { agent_path },
        "routines" => HoustonEvent::RoutinesChanged { agent_path },
        "routine_runs" => HoustonEvent::RoutineRunsChanged { agent_path },
        "config" => HoustonEvent::ConfigChanged { agent_path },
        "learnings" => HoustonEvent::LearningsChanged { agent_path },
        _ => return None,
    })
}

/// Seed embedded JSON Schemas into the agent's `.houston/<type>/<type>.schema.json`.
#[tauri::command(rename_all = "snake_case")]
pub async fn seed_agent_schemas(agent_path: String) -> Result<(), String> {
    let root = resolve_agent_dir(&agent_path)?;
    files::seed_schemas(&root).map_err(|e| e.to_string())
}

/// Migrate an agent from the legacy flat layout. Idempotent.
#[tauri::command(rename_all = "snake_case")]
pub async fn migrate_agent_files(agent_path: String) -> Result<(), String> {
    let root = resolve_agent_dir(&agent_path)?;
    files::migrate_agent_data(&root).map_err(|e| e.to_string())
}
