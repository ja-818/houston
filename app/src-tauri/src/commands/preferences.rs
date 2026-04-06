use houston_tauri::state::AppState;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn get_preference(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<String>, String> {
    state
        .db
        .get_preference(&key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_preference(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    state
        .db
        .set_preference(&key, &value)
        .await
        .map_err(|e| e.to_string())
}
