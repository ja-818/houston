//! Detect and install the Composio CLI.
//!
//! Houston's composio integration is a thin wrapper around the `composio`
//! CLI (https://composio.dev/install). We don't bundle the binary with
//! Houston because (a) it's ~80 MB per architecture, (b) the CLI has its
//! own self-update path (`composio upgrade`), and (c) Composio's install
//! script already handles platform detection and SHA-256 verification.
//!
//! This module runs Composio's official install script the first time
//! the user needs the CLI. It's a one-time step per machine.

use std::path::PathBuf;

/// Absolute path to the composio binary the installer drops.
///
/// Composio's installer drops `composio` on Unix and `composio.exe` on
/// Windows; we resolve to whichever is appropriate for the current
/// target so `is_installed()` and PATH lookups match.
pub fn cli_path() -> PathBuf {
    #[cfg(windows)]
    {
        home_dir().join(".composio").join("composio.exe")
    }
    #[cfg(not(windows))]
    {
        home_dir().join(".composio").join("composio")
    }
}

/// Directory that contains the composio binary + its support files.
pub fn install_dir() -> PathBuf {
    home_dir().join(".composio")
}

/// True if the CLI is present AND executable at the expected location.
pub fn is_installed() -> bool {
    let path = cli_path();
    if !path.is_file() {
        return false;
    }
    // On Unix, make sure the execute bit is actually set — a partial
    // download or aborted install would leave the file but no +x.
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

/// Run Composio's official install script. Blocks until the CLI is in
/// place and returns the install path on success.
///
/// The script downloads the latest release tarball from
/// `github.com/ComposioHQ/composio/releases`, SHA-256-verifies it against
/// the published `checksums.txt`, and extracts to `~/.composio/`.
/// Intentionally reuses Composio's installer instead of reimplementing
/// the download/verify/extract logic — the upstream script handles
/// platform detection (darwin-x64, darwin-aarch64, linux-*) and
/// Rosetta 2 edge cases we'd otherwise have to maintain ourselves.
///
/// Uses `std::process::Command` (synchronous) via `spawn_blocking` with
/// stdout/stderr redirected to temp files. This bypasses the
/// `tokio::process::Command::output()` hang observed on macOS inside
/// Tauri `.app` bundles — the same fix applied to `start_login()` in
/// `composio_cli.rs`.
#[cfg(windows)]
pub async fn install() -> Result<PathBuf, String> {
    // The upstream installer is a POSIX `curl | bash` one-liner. Composio
    // publishes Windows binaries but the install path is different; until
    // we wire it up, surface a clear error so the UI can direct the user.
    // Tracked in `knowledge-base/platform-matrix.md`.
    Err(
        "Composio CLI auto-install is not supported on Windows yet. \
         Install `composio` manually (https://composio.dev/install) and \
         ensure it's on PATH, then retry."
            .to_string(),
    )
}

#[cfg(not(windows))]
pub async fn install() -> Result<PathBuf, String> {
    tracing::info!("[composio:install] running install script…");

    // Capture HOME and PATH before entering spawn_blocking — macOS
    // `.app` bundles launched from Finder can have a stripped env where
    // `curl` and `bash` aren't on PATH.
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

            // `curl | bash` is the documented install command on composio.dev.
            // We shell out to `bash -c` so `set -euo pipefail` in the script
            // still takes effect. stdin is closed so the script can't prompt.
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

    tracing::info!("[composio:install] installed at {}", cli_path().display());
    Ok(cli_path())
}

fn home_dir() -> PathBuf {
    // Cross-platform: macOS/Linux set HOME, Windows sets USERPROFILE. The
    // `dirs` crate papers over both.
    dirs::home_dir().unwrap_or_default()
}
