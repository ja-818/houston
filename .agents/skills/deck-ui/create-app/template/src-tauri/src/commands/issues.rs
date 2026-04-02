use keel_tauri::keel_db::Issue;
use keel_tauri::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn list_issues(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<Issue>, String> {
    state
        .db
        .list_issues(&project_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_issue(
    state: State<'_, AppState>,
    project_id: String,
    title: String,
    description: String,
) -> Result<Issue, String> {
    state
        .db
        .create_issue(&project_id, &title, &description, None)
        .await
        .map_err(|e| e.to_string())
}
