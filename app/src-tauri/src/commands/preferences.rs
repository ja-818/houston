//! Tauri proxy — delegates to `houston_engine_core::preferences`.
//!
//! The engine crate owns the canonical logic. This layer exists only to
//! expose it as a `#[tauri::command]` until the frontend talks to the
//! engine server directly (Phase 3).

use houston_engine_core::preferences;
use houston_tauri::state::AppState;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn get_preference(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<String>, String> {
    preferences::get(&state.db, &key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_preference(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    preferences::set(&state.db, &key, &value)
        .await
        .map_err(|e| e.to_string())
}
