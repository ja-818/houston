//! Generic `read_agent_file` / `write_agent_file` Tauri commands — thin
//! proxies over `houston_engine_core::agents::files`. Emits the matching
//! `HoustonEvent` through the Tauri event bus so the desktop frontend keeps
//! its TanStack Query caches in sync (AI-native reactivity).

use std::path::PathBuf;

use houston_engine_core::agents::files;
use tauri::Emitter;

use crate::paths::expand_tilde;

fn resolve_agent_dir(agent_path: &str) -> PathBuf {
    expand_tilde(&PathBuf::from(agent_path))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_agent_file(agent_path: String, rel_path: String) -> Result<String, String> {
    let root = resolve_agent_dir(&agent_path);
    files::read_agent_file(&root, &rel_path).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn write_agent_file(
    app_handle: tauri::AppHandle,
    agent_path: String,
    rel_path: String,
    content: String,
) -> Result<(), String> {
    let root = resolve_agent_dir(&agent_path);
    let event = files::write_agent_file(&root, &agent_path, &rel_path, &content)
        .map_err(|e| e.to_string())?;
    if let Some(ev) = event {
        let _ = app_handle.emit("houston-event", ev);
    }
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn seed_agent_schemas(agent_path: String) -> Result<(), String> {
    let root = resolve_agent_dir(&agent_path);
    files::seed_agent_schemas(&root).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn migrate_agent_files(agent_path: String) -> Result<(), String> {
    let root = resolve_agent_dir(&agent_path);
    files::migrate_agent_files(&root).map_err(|e| e.to_string())
}
