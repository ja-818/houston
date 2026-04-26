//! Detect, install, and resolve the Composio CLI.
//!
//! Houston's composio integration is a thin wrapper around the upstream
//! `composio` CLI (https://composio.dev). There are two distribution paths
//! the engine handles transparently:
//!
//! 1. **Bundled** (production `.app`/`.msi`): the CLI ships inside
//!    `Contents/Resources/bin/composio-<arch>/` (per-arch because composio
//!    is a Bun runtime that can't be lipo'd). Resolved via
//!    `houston_cli_bundle`. No install step — `install()` is a no-op
//!    that returns the bundled path.
//!
//! 2. **Standalone** (dev / non-bundled engine builds): the CLI is
//!    fetched on first use via Composio's official install script and
//!    lands in `~/.composio/`. This preserves backwards compatibility
//!    with developers running `cargo run -p houston-engine-server`
//!    against a checkout that has not staged bundled binaries.
//!
//! The state-ownership contract is the same in both paths: the CLI
//! owns everything under `~/.composio/` (auth tokens, user_data.json,
//! cache). Houston only invokes the binary and reads structured
//! stdout — never touches that state directly.

use std::path::PathBuf;

/// Where Composio's official installer drops the CLI when run with the
/// default install prefix. Used as the fallback / dev-build location;
/// production builds resolve via `houston_cli_bundle` instead.
pub fn standalone_cli_path() -> PathBuf {
    let bin = if cfg!(windows) {
        "composio.exe"
    } else {
        "composio"
    };
    home_dir().join(".composio").join(bin)
}

/// Standalone install directory (sibling files, services/, …).
pub fn standalone_install_dir() -> PathBuf {
    home_dir().join(".composio")
}

/// Resolve the active composio binary, preferring the bundle when
/// available. Public callers (`cli.rs`, `lifecycle.rs`) should use this
/// rather than picking a path themselves so the resolution stays in one
/// place and the bundle/standalone fallback order is consistent.
pub fn cli_path() -> PathBuf {
    houston_cli_bundle::bundled_composio_binary().unwrap_or_else(standalone_cli_path)
}

/// Resolve the active install directory (the parent of `cli_path`,
/// containing the binary plus its sibling files).
pub fn install_dir() -> PathBuf {
    houston_cli_bundle::bundled_composio_dir().unwrap_or_else(standalone_install_dir)
}

/// True if the bundled CLI is shipped with this build of Houston.
/// Lifecycle code uses this to decide whether to skip the install /
/// upgrade dance entirely.
pub fn is_bundled() -> bool {
    houston_cli_bundle::bundled_composio_binary().is_some()
}

/// True if the active CLI (bundled or standalone) is present and
/// executable. Bundled wins over standalone — if both exist on a dev
/// machine, the engine uses the bundled one and ignores `~/.composio`.
pub fn is_installed() -> bool {
    let path = cli_path();
    if !path.is_file() {
        return false;
    }
    // On Unix, make sure the execute bit is actually set — partial
    // downloads or a recovered backup can leave the file but no +x.
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(meta) = std::fs::metadata(&path) {
            return meta.permissions().mode() & 0o111 != 0;
        }
        false
    }
    #[cfg(not(unix))]
    {
        true
    }
}

/// Run Composio's official install script (standalone path only). When
/// the bundled CLI is shipped with Houston this is a no-op that returns
/// the bundled path immediately.
///
/// Implementation notes:
///   - Uses `std::process::Command` (synchronous) inside `spawn_blocking`
///     with stdout/stderr redirected to temp files. The
///     `tokio::process::Command::output()` async pipe path hangs on
///     macOS inside Tauri `.app` bundles — see the matching workaround
///     in `cli.rs::start_login()`.
///   - Captures HOME and PATH up front because `.app` bundles launched
///     from Finder strip the env, leaving `bash`/`curl` unfindable.
#[cfg(windows)]
pub async fn install() -> Result<PathBuf, String> {
    if let Some(p) = houston_cli_bundle::bundled_composio_binary() {
        tracing::info!(
            "[composio:install] bundled CLI present at {} — skipping standalone install",
            p.display()
        );
        return Ok(p);
    }
    // Composio's POSIX `curl | bash` installer doesn't apply on Windows;
    // until the Windows ship target lands we surface a clear error so the
    // UI can direct the user. Tracked in
    // `knowledge-base/platform-matrix.md`.
    Err(
        "Composio CLI auto-install is not supported on Windows yet. \
         Install `composio` manually (https://composio.dev/install) and \
         ensure it's on PATH, then retry."
            .to_string(),
    )
}

#[cfg(not(windows))]
pub async fn install() -> Result<PathBuf, String> {
    if let Some(p) = houston_cli_bundle::bundled_composio_binary() {
        tracing::info!(
            "[composio:install] bundled CLI present at {} — skipping standalone install",
            p.display()
        );
        return Ok(p);
    }

    tracing::info!("[composio:install] running standalone install script…");

    let home = std::env::var("HOME").unwrap_or_default();
    let path = std::env::var("PATH").unwrap_or_default();

    let result = tokio::time::timeout(
        std::time::Duration::from_secs(180),
        tokio::task::spawn_blocking(move || {
            let tmp_out = std::env::temp_dir().join("houston-composio-install-stdout.log");
            let tmp_err = std::env::temp_dir().join("houston-composio-install-stderr.log");

            let stdout_file = std::fs::File::create(&tmp_out)
                .map_err(|e| format!("Failed to create temp file: {e}"))?;
            let stderr_file = std::fs::File::create(&tmp_err)
                .map_err(|e| format!("Failed to create temp file: {e}"))?;

            // `curl | bash` is the documented install command on
            // composio.dev. We shell out to `bash -c` so `set -euo
            // pipefail` in the upstream script still takes effect.
            // stdin is closed so the script can't prompt.
            let status = std::process::Command::new("bash")
                .arg("-c")
                .arg("curl -fsSL https://composio.dev/install | bash")
                .env("HOME", &home)
                .env("PATH", &path)
                .stdin(std::process::Stdio::null())
                .stdout(stdout_file)
                .stderr(stderr_file)
                .status()
                .map_err(|e| format!("Failed to spawn install script: {e}"))?;

            let stdout = std::fs::read_to_string(&tmp_out).unwrap_or_default();
            let stderr = std::fs::read_to_string(&tmp_err).unwrap_or_default();
            let _ = std::fs::remove_file(&tmp_out);
            let _ = std::fs::remove_file(&tmp_err);

            tracing::debug!("[composio:install] stdout: {}", stdout.trim());
            tracing::debug!("[composio:install] stderr: {}", stderr.trim());

            if !status.success() {
                let msg = stderr.trim();
                let hint = if msg.contains("curl") || msg.contains("not found") {
                    " — curl may not be installed or not on PATH"
                } else if msg.contains("network") || msg.contains("Could not resolve") {
                    " — check your internet connection"
                } else {
                    ""
                };
                return Err(format!(
                    "Composio install failed (exit {status}): {msg}{hint}"
                ));
            }

            Ok(())
        }),
    )
    .await
    .map_err(|_| {
        "Composio install timed out after 3 minutes — check your internet connection \
         and try again"
            .to_string()
    })?
    .map_err(|e| format!("Install thread failed: {e}"))?;

    result?;

    if !is_installed() {
        return Err(format!(
            "Install script completed but no binary at {} — the download may have \
             been interrupted",
            cli_path().display()
        ));
    }

    let resolved = cli_path();
    tracing::info!("[composio:install] installed at {}", resolved.display());
    Ok(resolved)
}

fn home_dir() -> PathBuf {
    // Cross-platform: macOS/Linux set HOME, Windows sets USERPROFILE.
    // The `dirs` crate papers over both.
    dirs::home_dir().unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// `cli_path()` falls back to the standalone path when no bundle is
    /// present. The bundle path branch is exercised by integration tests
    /// that fake an `.app` layout in `houston-cli-bundle::tests`.
    #[test]
    fn cli_path_falls_back_to_standalone_in_dev() {
        // Tests run inside cargo's target dir, never inside an `.app`
        // bundle — so the fallback should always be standalone here.
        let p = cli_path();
        assert!(p.ends_with(".composio/composio") || p.ends_with(".composio/composio.exe"));
    }
}
