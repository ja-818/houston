//! Tauri commands for Composio integration.

use crate::composio::ComposioResult;

#[tauri::command(rename_all = "snake_case")]
pub async fn list_composio_connections() -> ComposioResult {
    crate::composio::list_active_connections().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn start_composio_oauth() -> Result<(), String> {
    crate::composio_auth::run_oauth_flow().await
}
