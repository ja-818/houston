//! Tauri command wrappers around `houston-composio`.
//!
//! The engine crate exposes plain async fns. These wrappers apply
//! `#[tauri::command]` so the frontend can invoke them.

use houston_composio::apps::ComposioAppEntry;
use houston_composio::cli::{ComposioStatus, StartLinkResponse, StartLoginResponse};
use houston_composio::commands as inner;

#[tauri::command(rename_all = "snake_case")]
pub async fn list_composio_connections() -> ComposioStatus {
    inner::list_composio_connections().await
}

#[tauri::command(rename_all = "snake_case")]
pub fn is_composio_cli_installed() -> bool {
    inner::is_composio_cli_installed()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn install_composio_cli() -> Result<(), String> {
    inner::install_composio_cli().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn start_composio_oauth() -> Result<StartLoginResponse, String> {
    inner::start_composio_oauth().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn complete_composio_login(cli_key: String) -> Result<(), String> {
    inner::complete_composio_login(cli_key).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn connect_composio_app(toolkit: String) -> Result<StartLinkResponse, String> {
    inner::connect_composio_app(toolkit).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_composio_apps() -> Vec<ComposioAppEntry> {
    inner::list_composio_apps().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_composio_connected_toolkits() -> Vec<String> {
    inner::list_composio_connected_toolkits().await
}
