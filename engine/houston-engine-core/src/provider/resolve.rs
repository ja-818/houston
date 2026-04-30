use super::InstallSource;
use houston_terminal_manager::claude_path;
use std::path::PathBuf;

pub(super) fn resolve_claude() -> (InstallSource, Option<PathBuf>) {
    if houston_claude_installer::is_installed() {
        return (
            InstallSource::Managed,
            Some(houston_claude_installer::cli_path()),
        );
    }
    if let Some(path) = which_on_path("claude") {
        return (InstallSource::Path, Some(path));
    }
    (InstallSource::Missing, None)
}

pub(super) fn resolve_codex() -> (InstallSource, Option<PathBuf>) {
    if let Some(path) = houston_cli_bundle::bundled_codex_path() {
        return (InstallSource::Bundled, Some(path));
    }
    if let Some(path) = which_on_path("codex") {
        return (InstallSource::Path, Some(path));
    }
    (InstallSource::Missing, None)
}

fn which_on_path(command: &str) -> Option<PathBuf> {
    let shell_path = claude_path::shell_path();
    for dir in std::env::split_paths(&shell_path) {
        let candidate = dir.join(command);
        if candidate.is_file() {
            return Some(candidate);
        }
        #[cfg(windows)]
        {
            for ext in ["exe", "cmd", "bat", "ps1"] {
                let candidate = dir.join(format!("{command}.{ext}"));
                if candidate.is_file() {
                    return Some(candidate);
                }
            }
        }
    }
    None
}
