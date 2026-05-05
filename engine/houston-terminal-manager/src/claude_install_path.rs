//! Where Houston's runtime-installed `claude` binary lives on disk.
//!
//! Lives in `houston-terminal-manager` (not `houston-claude-installer`)
//! so that both the installer and the spawn machinery (`claude_path`,
//! `claude_runner`) can resolve the same absolute path without forming a
//! dependency cycle through `houston-ui-events` (which depends on
//! `houston-terminal-manager` for `FeedItem`).
//!
//! Why spawn the absolute path instead of `Command::new("claude")`? We
//! pin a specific claude-code version in `cli-deps.json` and pass flags
//! (`--include-partial-messages`, …) that only newer versions support.
//! PATH lookup can hit an older `claude` from npm-global / homebrew /
//! prior install, which then rejects the flag with
//! `error: unknown option '--include-partial-messages'` and the session
//! dies before producing any output.

use std::path::PathBuf;

/// Final install target. `claude --version` uses this exact path; the
/// upstream installer drops there too, so users who already had Claude
/// Code installed via `claude.ai/install.sh` get an automatic upgrade.
pub fn cli_path() -> PathBuf {
    install_dir().join(binary_name())
}

/// Directory `cli_path()` lives in. Created on demand by the installer.
pub fn install_dir() -> PathBuf {
    #[cfg(unix)]
    {
        // `~/.local/bin` is on PATH for most users via the shells'
        // default profile; the engine also force-adds it via
        // `claude_path` so it's always discoverable.
        dirs::home_dir()
            .unwrap_or_default()
            .join(".local")
            .join("bin")
    }
    #[cfg(windows)]
    {
        // `%LOCALAPPDATA%\Programs\claude\` is the conventional
        // Windows install location for per-user CLIs and matches the
        // upstream PowerShell installer.
        dirs::data_local_dir()
            .unwrap_or_default()
            .join("Programs")
            .join("claude")
    }
}

pub fn binary_name() -> &'static str {
    if cfg!(windows) {
        "claude.exe"
    } else {
        "claude"
    }
}

/// True if the binary exists and is executable. Does not validate the
/// version — that's the installer lifecycle's job.
pub fn is_installed() -> bool {
    let p = cli_path();
    if !p.is_file() {
        return false;
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(meta) = std::fs::metadata(&p) {
            return meta.permissions().mode() & 0o111 != 0;
        }
        false
    }
    #[cfg(not(unix))]
    {
        true
    }
}
