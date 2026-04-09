//! Tauri commands for Composio integration.
//!
//! Houston's composio support is powered by the `composio` CLI. Each
//! command here is a thin wrapper around `composio_cli::*` functions
//! that shell out to the binary at `~/.composio/composio`. The old
//! MCP-based `composio.rs` and OAuth flow in `composio_auth.rs` are
//! kept in the tree as a safety fallback (CLAUDE-approved) but are
//! no longer called from any command.

use crate::composio_cli::{self, ComposioStatus, StartLinkResponse, StartLoginResponse};
use crate::composio_install;

/// Current state of Houston's composio integration. Returned to the
/// frontend to drive which UI is shown on the integrations tab.
#[tauri::command(rename_all = "snake_case")]
pub async fn list_composio_connections() -> ComposioStatus {
    composio_cli::status().await
}

/// True if the composio CLI is installed at the expected location.
#[tauri::command(rename_all = "snake_case")]
pub fn is_composio_cli_installed() -> bool {
    composio_install::is_installed()
}

/// Run Composio's official install script to put the CLI at
/// `~/.composio/composio`. Blocks until the binary is in place.
#[tauri::command(rename_all = "snake_case")]
pub async fn install_composio_cli() -> Result<(), String> {
    composio_install::install().await.map(|_| ())
}

/// Start the composio login flow. Returns `{login_url, cli_key}`.
/// The frontend should open `login_url` in the browser and, once the
/// user approves, call `complete_composio_login(cli_key)` to finalize.
#[tauri::command(rename_all = "snake_case")]
pub async fn start_composio_oauth() -> Result<StartLoginResponse, String> {
    composio_cli::start_login().await
}

/// Finish the login flow started by `start_composio_oauth` using the
/// `cli_key` that was returned from that call.
#[tauri::command(rename_all = "snake_case")]
pub async fn complete_composio_login(cli_key: String) -> Result<(), String> {
    composio_cli::complete_login(&cli_key).await
}

/// Start the flow to link an external app (Gmail, Slack, etc.) to the
/// currently-signed-in composio account. Returns the URL the user
/// should open in their browser to authorize. The frontend opens it
/// with `tauriSystem.openUrl(...)`.
#[tauri::command(rename_all = "snake_case")]
pub async fn connect_composio_app(toolkit: String) -> Result<StartLinkResponse, String> {
    composio_cli::start_link(&toolkit).await
}

/// List all available Composio apps (browse catalog). Unchanged —
/// still served from the existing static/REST catalog, not via MCP.
#[tauri::command(rename_all = "snake_case")]
pub async fn list_composio_apps() -> Vec<crate::composio_apps::ComposioAppEntry> {
    crate::composio_apps::list_all_apps().await
}

/// Probe each toolkit in `toolkits` against the consumer ("Composio
/// for You") namespace and return the subset that is currently
/// connected. Uses `composio proxy` with a bogus URL to trigger the
/// tool router's auth check without touching any third-party API.
/// Safe to call with 40+ toolkits — parallelism is bounded internally.
#[tauri::command(rename_all = "snake_case")]
pub async fn list_composio_connected_toolkits(toolkits: Vec<String>) -> Vec<String> {
    composio_cli::probe_connected_many(toolkits).await
}
