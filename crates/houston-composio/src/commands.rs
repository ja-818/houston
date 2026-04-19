//! Tauri commands for Composio integration.
//!
//! Houston's composio support is powered by the `composio` CLI. Each
//! command here is a thin wrapper around `cli::*` functions
//! that shell out to the binary at `~/.composio/composio`.

use crate::cli::{self, ComposioStatus, StartLinkResponse, StartLoginResponse};
use crate::install;

/// Current state of Houston's composio integration. Returned to the
/// frontend to drive which UI is shown on the integrations tab.
#[tauri::command(rename_all = "snake_case")]
pub async fn list_composio_connections() -> ComposioStatus {
    cli::status().await
}

/// True if the composio CLI is installed at the expected location.
#[tauri::command(rename_all = "snake_case")]
pub fn is_composio_cli_installed() -> bool {
    install::is_installed()
}

/// Run Composio's official install script to put the CLI at
/// `~/.composio/composio`. Blocks until the binary is in place.
#[tauri::command(rename_all = "snake_case")]
pub async fn install_composio_cli() -> Result<(), String> {
    install::install().await.map(|_| ())
}

/// Start the composio login flow. Returns `{login_url, cli_key}`.
/// The frontend should open `login_url` in the browser and, once the
/// user approves, call `complete_composio_login(cli_key)` to finalize.
#[tauri::command(rename_all = "snake_case")]
pub async fn start_composio_oauth() -> Result<StartLoginResponse, String> {
    cli::start_login().await
}

/// Finish the login flow started by `start_composio_oauth` using the
/// `cli_key` that was returned from that call.
#[tauri::command(rename_all = "snake_case")]
pub async fn complete_composio_login(cli_key: String) -> Result<(), String> {
    cli::complete_login(&cli_key).await
}

/// Start the flow to link an external app (Gmail, Slack, etc.) to the
/// currently-signed-in composio account. Returns the URL the user
/// should open in their browser to authorize.
#[tauri::command(rename_all = "snake_case")]
pub async fn connect_composio_app(toolkit: String) -> Result<StartLinkResponse, String> {
    cli::start_link(&toolkit).await
}

/// List all available Composio apps from the REST API.
#[tauri::command(rename_all = "snake_case")]
pub async fn list_composio_apps() -> Vec<crate::apps::ComposioAppEntry> {
    crate::apps::list_all_apps().await
}

/// List all connected toolkit slugs in the consumer namespace.
/// Uses `composio connections list` (CLI v0.2.23+).
#[tauri::command(rename_all = "snake_case")]
pub async fn list_composio_connected_toolkits() -> Vec<String> {
    cli::list_connected_toolkits().await
}
