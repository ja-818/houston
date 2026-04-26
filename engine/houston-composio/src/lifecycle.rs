//! Composio CLI lifecycle — bundle-aware install + upgrade.
//!
//! Called once during engine startup as a background task:
//!
//! - **Bundled build**: detect the bundled CLI, emit `ComposioCliReady`,
//!   record the Houston version marker, return. No install, no upgrade
//!   — the bundled binary is the version we shipped, and overwriting it
//!   with `composio upgrade` would either fail (read-only `.app`) or
//!   silently write to `~/.composio/` and confuse the resolver next
//!   boot.
//!
//! - **Standalone build**: install the CLI if missing (one-time
//!   `curl | bash`), then run `composio upgrade` whenever Houston's
//!   version changes since the last successful check (so security fixes
//!   in the upstream CLI roll out alongside Houston releases without
//!   requiring user action).
//!
//! Emits `HoustonEvent::ComposioCliReady` on success so the frontend
//! invalidates the connections query and the integrations tab refreshes.

use crate::install;
use houston_db::db::Database;
use houston_ui_events::{DynEventSink, HoustonEvent};

/// Preferences key storing the Houston version that last successfully
/// ensured the standalone CLI. Skipped entirely for bundled builds.
const PREF_CLI_VERSION: &str = "composio_cli_houston_version";

/// Current Houston version (read from Cargo.toml at compile time).
const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

/// Run the full lifecycle check: install if missing, upgrade if Houston
/// version changed. Emits events so the frontend reacts.
pub async fn ensure_and_upgrade(sink: DynEventSink, db: Database) {
    if install::is_bundled() {
        tracing::info!(
            "[composio:lifecycle] bundled CLI detected at {} — skipping install/upgrade",
            install::cli_path().display()
        );
        sink.emit(HoustonEvent::ComposioCliReady);
        return;
    }

    if !install::is_installed() {
        tracing::info!("[composio:lifecycle] CLI not found — auto-installing");
        match install::install().await {
            Ok(path) => {
                tracing::info!(
                    "[composio:lifecycle] auto-install succeeded: {}",
                    path.display()
                );
            }
            Err(e) => {
                tracing::error!("[composio:lifecycle] auto-install failed: {e}");
                sink.emit(HoustonEvent::ComposioCliFailed { message: e });
                return;
            }
        }
    }

    // Upgrade if Houston's version changed since last check. Bundled
    // builds never reach this branch — they returned early above.
    let last_version = db
        .get_preference(PREF_CLI_VERSION)
        .await
        .ok()
        .flatten()
        .unwrap_or_default();

    if last_version != APP_VERSION && install::is_installed() {
        tracing::info!(
            "[composio:lifecycle] Houston version changed ({} → {}) — upgrading CLI",
            if last_version.is_empty() {
                "none"
            } else {
                &last_version
            },
            APP_VERSION
        );
        match run_upgrade().await {
            Ok(()) => {
                tracing::info!("[composio:lifecycle] CLI upgrade succeeded");
            }
            Err(e) => {
                // Upgrade failure is non-fatal — the existing CLI still
                // works. We log + record the version anyway so we don't
                // retry every launch; the next Houston update tries
                // again.
                tracing::warn!("[composio:lifecycle] CLI upgrade failed (non-fatal): {e}");
            }
        }
        if let Err(e) = db.set_preference(PREF_CLI_VERSION, APP_VERSION).await {
            tracing::warn!("[composio:lifecycle] failed to persist version marker: {e}");
        }
    }

    sink.emit(HoustonEvent::ComposioCliReady);
}

/// Run `composio upgrade` via the same sync-Command + spawn_blocking
/// pattern used by the install function. Standalone-only — never called
/// when the bundled CLI is present (would try to overwrite a read-only
/// signed binary inside the `.app`).
async fn run_upgrade() -> Result<(), String> {
    let bin = install::cli_path();
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
