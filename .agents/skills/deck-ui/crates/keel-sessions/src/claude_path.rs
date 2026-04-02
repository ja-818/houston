use std::ffi::OsString;
use std::sync::OnceLock;

/// The user's full login-shell PATH, resolved once at startup.
/// macOS .app bundles get a minimal PATH (/usr/bin:/bin:/usr/sbin:/sbin),
/// so we ask the user's login shell for the real one.
static SHELL_PATH: OnceLock<Option<OsString>> = OnceLock::new();

/// Resolve the user's login shell PATH and cache it.
/// Call this once at startup before spawning any CLI processes.
pub fn init() {
    SHELL_PATH.get_or_init(resolve_login_shell_path);
}

/// Get the resolved PATH (includes all dirs from the user's shell).
/// Falls back to the current process PATH if shell resolution failed.
pub fn shell_path() -> OsString {
    SHELL_PATH
        .get()
        .cloned()
        .flatten()
        .unwrap_or_else(|| std::env::var_os("PATH").unwrap_or_default())
}

/// Check if `claude` is available using the resolved PATH.
pub fn is_claude_available() -> bool {
    is_command_available("claude")
}

/// Check if a command is available using the resolved PATH.
pub fn is_command_available(command: &str) -> bool {
    let path_val = shell_path();
    let dirs = std::env::split_paths(&path_val);
    for dir in dirs {
        let candidate = dir.join(command);
        if candidate.is_file() {
            return true;
        }
    }
    false
}

/// Ask the user's login shell for its PATH.
/// Tries zsh first (default on macOS), then bash.
fn resolve_login_shell_path() -> Option<OsString> {
    for shell in &["/bin/zsh", "/bin/bash"] {
        if let Some(path) = path_from_shell(shell) {
            return Some(OsString::from(path));
        }
    }
    None
}

fn path_from_shell(shell: &str) -> Option<String> {
    let output = std::process::Command::new(shell)
        .arg("-l")
        .arg("-c")
        .arg("echo $PATH")
        .output()
        .ok()?;

    if output.status.success() {
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !path.is_empty() {
            return Some(path);
        }
    }
    None
}
