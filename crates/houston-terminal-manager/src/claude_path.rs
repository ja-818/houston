use std::ffi::OsString;
use std::path::PathBuf;
use std::sync::OnceLock;

/// The user's full login-shell PATH, resolved once at startup.
/// macOS .app bundles get a minimal PATH (/usr/bin:/bin:/usr/sbin:/sbin),
/// so we ask the user's login shell for the real one AND check common
/// install locations as fallback.
static SHELL_PATH: OnceLock<Option<OsString>> = OnceLock::new();

/// Common locations where `claude` and related CLIs might be installed.
/// Checked as fallback when shell PATH resolution doesn't find them.
/// `~/.composio` is the install location for Composio's CLI — needed so
/// Houston's spawned agents can use `composio search`/`composio execute`
/// via Bash even when the user's login shell hasn't sourced the PATH
/// modification the Composio installer appends to rc files.
const COMMON_CLAUDE_DIRS: &[&str] = &[
    "~/.local/bin",
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "~/.cargo/bin",
    "~/.composio",
];

/// Resolve the user's login shell PATH and cache it.
/// Call this once at startup before spawning any CLI processes.
pub fn init() {
    SHELL_PATH.get_or_init(|| {
        let mut path = resolve_login_shell_path();

        // Also try interactive shell (reads .zshrc, not just .zprofile)
        if path.is_none() {
            path = resolve_interactive_shell_path();
        }

        // Append common dirs that might not be in the shell PATH
        let mut final_path = path.unwrap_or_else(|| {
            std::env::var_os("PATH").unwrap_or_default()
        });

        let home = std::env::var("HOME").unwrap_or_default();
        for dir in COMMON_CLAUDE_DIRS {
            let expanded = dir.replace('~', &home);
            let expanded_path = PathBuf::from(&expanded);
            if expanded_path.is_dir() {
                // Append if not already in PATH
                let current = final_path.to_string_lossy();
                if !current.contains(&expanded) {
                    let mut new_path = final_path.into_string().unwrap_or_default();
                    new_path.push(':');
                    new_path.push_str(&expanded);
                    final_path = OsString::from(new_path);
                }
            }
        }

        // Also check for nvm-installed node (claude/codex are often installed via npm)
        let nvm_dir = PathBuf::from(&home).join(".nvm/versions/node");
        if nvm_dir.is_dir() {
            if let Ok(entries) = std::fs::read_dir(&nvm_dir) {
                for entry in entries.flatten() {
                    let bin = entry.path().join("bin");
                    let has_cli = bin.join("claude").is_file()
                        || bin.join("codex").is_file();
                    if has_cli {
                        let bin_str = bin.to_string_lossy();
                        let current = final_path.to_string_lossy();
                        if !current.contains(bin_str.as_ref()) {
                            let mut new_path = final_path.into_string().unwrap_or_default();
                            new_path.push(':');
                            new_path.push_str(&bin_str);
                            final_path = OsString::from(new_path);
                        }
                        break;
                    }
                }
            }
        }

        Some(final_path)
    });
}

/// Get the resolved PATH (includes all dirs from the user's shell + common dirs).
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

/// Ask the user's login shell for its PATH (reads .zprofile).
fn resolve_login_shell_path() -> Option<OsString> {
    for shell in &["/bin/zsh", "/bin/bash"] {
        if let Some(path) = path_from_shell(shell, &["-l", "-c", "echo $PATH"]) {
            return Some(OsString::from(path));
        }
    }
    None
}

/// Ask the user's interactive shell for its PATH (reads .zshrc).
/// This catches cases where PATH is set in .zshrc but not .zprofile.
fn resolve_interactive_shell_path() -> Option<OsString> {
    for shell in &["/bin/zsh", "/bin/bash"] {
        if let Some(path) = path_from_shell(shell, &["-i", "-c", "echo $PATH"]) {
            return Some(OsString::from(path));
        }
    }
    None
}

fn path_from_shell(shell: &str, args: &[&str]) -> Option<String> {
    let output = std::process::Command::new(shell)
        .args(args)
        .stdin(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
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
