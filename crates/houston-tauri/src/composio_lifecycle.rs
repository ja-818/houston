//! Composio CLI lifecycle — auto-install and auto-upgrade.
//!
//! Called once during app startup as a background task:
//! 1. If the CLI is missing → install it automatically (no user button).
//! 2. If Houston's version changed since the last check → run `composio upgrade`.
//!
//! Emits `HoustonEvent::ComposioCliReady` on success so the frontend can
//! invalidate the connections query and update the integrations tab.

use crate::composio_install;
use crate::events::HoustonEvent;
use houston_db::db::Database;
use tauri::{AppHandle, Emitter};

/// Preferences key storing the Houston version that last ensured the CLI.
const PREF_CLI_VERSION: &str = "composio_cli_houston_version";

/// Current Houston version (read from Cargo.toml at compile time).
const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

/// Run the full lifecycle check: install if missing, upgrade if Houston
/// version changed. Emits events so the frontend reacts.
pub async fn ensure_and_upgrade(app: AppHandle, db: Database) {
    let installed = composio_install::is_installed();

    if !installed {
        tracing::info!("[composio:lifecycle] CLI not found — auto-installing");
        match composio_install::install().await {
            Ok(path) => {
                tracing::info!(
                    "[composio:lifecycle] auto-install succeeded: {}",
                    path.display()
                );
            }
            Err(e) => {
                tracing::error!("[composio:lifecycle] auto-install failed: {e}");
                let _ = app.emit(
                    "houston-event",
                    HoustonEvent::ComposioCliFailed { message: e },
                );
                return;
            }
        }
    }

    // Upgrade if Houston's version changed since last check.
    let last_version = db
        .get_preference(PREF_CLI_VERSION)
        .await
        .ok()
        .flatten()
        .unwrap_or_default();

    if last_version != APP_VERSION && composio_install::is_installed() {
        tracing::info!(
            "[composio:lifecycle] Houston version changed ({} → {}) — upgrading CLI",
            if last_version.is_empty() { "none" } else { &last_version },
            APP_VERSION
        );
        match run_upgrade().await {
            Ok(()) => {
                tracing::info!("[composio:lifecycle] CLI upgrade succeeded");
            }
            Err(e) => {
                // Upgrade failure is non-fatal — the existing CLI still works.
                tracing::warn!("[composio:lifecycle] CLI upgrade failed (non-fatal): {e}");
            }
        }
        // Record the version even if upgrade failed — we don't want to
        // retry every launch. The next Houston update will try again.
        if let Err(e) = db.set_preference(PREF_CLI_VERSION, APP_VERSION).await {
            tracing::warn!("[composio:lifecycle] failed to persist version marker: {e}");
        }
    }

    let _ = app.emit("houston-event", HoustonEvent::ComposioCliReady);
}

/// Run `composio upgrade` via the same sync-Command + spawn_blocking
/// pattern used by the install function.
async fn run_upgrade() -> Result<(), String> {
    let bin = composio_install::cli_path();
    let home = std::env::var("HOME").unwrap_or_default();
    let path = std::env::var("PATH").unwrap_or_default();

    let result = tokio::time::timeout(
        std::time::Duration::from_secs(180),
        tokio::task::spawn_blocking(move || {
            let status = std::process::Command::new(&bin)
                .arg("upgrade")
                .env("CI", "1")
                .env("TERM", "dumb")
                .env("NO_COLOR", "1")
                .env("HOME", &home)
                .env("PATH", &path)
                .stdin(std::process::Stdio::null())
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::piped())
                .status()
                .map_err(|e| format!("Failed to spawn composio upgrade: {e}"))?;

            if !status.success() {
                return Err(format!("composio upgrade exited with {status}"));
            }
            Ok(())
        }),
    )
    .await
    .map_err(|_| "composio upgrade timed out after 3 minutes".to_string())?
    .map_err(|e| format!("upgrade thread failed: {e}"))?;

    result
}
