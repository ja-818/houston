//! Git worktree management, terminal launching, and directory picker commands.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::process::Command;

// -- Directory Picker --

#[tauri::command(rename_all = "snake_case")]
pub async fn pick_directory() -> Result<Option<String>, String> {
    let output = Command::new("osascript")
        .arg("-e")
        .arg(r#"POSIX path of (choose folder with prompt "Select your project directory")"#)
        .output()
        .await
        .map_err(|e| format!("Failed to open folder picker: {e}"))?;

    if !output.status.success() {
        // User cancelled — not an error
        return Ok(None);
    }

    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if path.is_empty() {
        return Ok(None);
    }
    Ok(Some(path))
}

// -- Worktree --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeInfo {
    pub path: String,
    pub branch: String,
    pub is_main: bool,
}

/// Derive the worktrees directory adjacent to the repo.
/// e.g. `/Users/me/my-app` → `/Users/me/my-app-worktrees`
fn worktrees_dir(repo_path: &Path) -> PathBuf {
    let name = repo_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "project".to_string());
    repo_path.with_file_name(format!("{name}-worktrees"))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_worktree(
    repo_path: String,
    name: String,
    branch: Option<String>,
) -> Result<WorktreeInfo, String> {
    let repo = houston_tauri::paths::expand_tilde(&PathBuf::from(&repo_path));
    let wt_dir = worktrees_dir(&repo);
    let wt_path = wt_dir.join(&name);

    if wt_path.exists() {
        return Err(format!("Worktree already exists: {}", wt_path.display()));
    }

    // Ensure parent directory exists
    std::fs::create_dir_all(&wt_dir)
        .map_err(|e| format!("Failed to create worktrees directory: {e}"))?;

    let branch_name = branch.unwrap_or_else(|| format!("houston/{name}"));

    let output = Command::new("git")
        .args(["worktree", "add", "-b", &branch_name])
        .arg(&wt_path)
        .current_dir(&repo)
        .output()
        .await
        .map_err(|e| format!("Failed to run git worktree add: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git worktree add failed: {stderr}"));
    }

    Ok(WorktreeInfo {
        path: wt_path.to_string_lossy().to_string(),
        branch: branch_name,
        is_main: false,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn remove_worktree(
    repo_path: String,
    worktree_path: String,
) -> Result<(), String> {
    let repo = houston_tauri::paths::expand_tilde(&PathBuf::from(&repo_path));
    let output = Command::new("git")
        .args(["worktree", "remove", "--force", &worktree_path])
        .current_dir(&repo)
        .output()
        .await
        .map_err(|e| format!("Failed to run git worktree remove: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git worktree remove failed: {stderr}"));
    }

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_worktrees(
    repo_path: String,
) -> Result<Vec<WorktreeInfo>, String> {
    let repo = houston_tauri::paths::expand_tilde(&PathBuf::from(&repo_path));
    let output = Command::new("git")
        .args(["worktree", "list", "--porcelain"])
        .current_dir(&repo)
        .output()
        .await
        .map_err(|e| format!("Failed to run git worktree list: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git worktree list failed: {stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut worktrees = Vec::new();
    let mut current_path = String::new();
    let mut current_branch = String::new();
    let mut is_bare = false;

    for line in stdout.lines() {
        if let Some(path) = line.strip_prefix("worktree ") {
            current_path = path.to_string();
            current_branch.clear();
            is_bare = false;
        } else if let Some(branch) = line.strip_prefix("branch refs/heads/") {
            current_branch = branch.to_string();
        } else if line == "bare" {
            is_bare = true;
        } else if line.is_empty() && !current_path.is_empty() {
            if !is_bare {
                let is_main = current_path == repo.to_string_lossy();
                worktrees.push(WorktreeInfo {
                    path: current_path.clone(),
                    branch: current_branch.clone(),
                    is_main,
                });
            }
            current_path.clear();
        }
    }
    // Handle last entry (no trailing newline)
    if !current_path.is_empty() && !is_bare {
        let is_main = current_path == repo.to_string_lossy();
        worktrees.push(WorktreeInfo {
            path: current_path,
            branch: current_branch,
            is_main,
        });
    }

    Ok(worktrees)
}

// -- Shell --

#[tauri::command(rename_all = "snake_case")]
pub async fn run_shell(
    path: String,
    command: String,
) -> Result<String, String> {
    let dir = houston_tauri::paths::expand_tilde(&PathBuf::from(&path));
    if !dir.exists() {
        return Err(format!("Directory does not exist: {}", dir.display()));
    }

    let output = Command::new("sh")
        .args(["-c", &command])
        .current_dir(&dir)
        .env("PATH", houston_tauri::houston_terminal_manager::claude_path::shell_path())
        .output()
        .await
        .map_err(|e| format!("Failed to run command: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        return Err(format!("{stderr}\n{stdout}"));
    }

    Ok(stdout)
}

// -- Terminal --

#[tauri::command(rename_all = "snake_case")]
pub async fn open_terminal(
    path: String,
    command: Option<String>,
    terminal_app: Option<String>,
) -> Result<(), String> {
    let dir = houston_tauri::paths::expand_tilde(&PathBuf::from(&path));
    if !dir.exists() {
        return Err(format!("Directory does not exist: {}", dir.display()));
    }

    let terminal = terminal_app.as_deref().unwrap_or("terminal");
    let dir_str = dir.to_string_lossy();

    let script = match terminal {
        "iterm" => {
            if let Some(cmd) = &command {
                format!(
                    r#"tell application "iTerm"
    activate
    set newWindow to (create window with default profile)
    tell current session of newWindow
        write text "cd '{}' && {}"
    end tell
end tell"#,
                    dir_str, cmd
                )
            } else {
                format!(
                    r#"tell application "iTerm"
    activate
    set newWindow to (create window with default profile)
    tell current session of newWindow
        write text "cd '{}'"
    end tell
end tell"#,
                    dir_str
                )
            }
        }
        "warp" => {
            if let Some(cmd) = &command {
                format!(
                    r#"tell application "Warp"
    activate
end tell
delay 0.5
do shell script "open -a Warp '{}'"
delay 0.3
tell application "System Events"
    keystroke "{}"
    key code 36
end tell"#,
                    dir_str, cmd
                )
            } else {
                // Warp supports opening a directory directly
                return Command::new("open")
                    .args(["-a", "Warp", &dir_str])
                    .output()
                    .await
                    .map_err(|e| format!("Failed to open Warp: {e}"))
                    .and_then(|o| {
                        if o.status.success() {
                            Ok(())
                        } else {
                            Err(format!(
                                "Warp failed: {}",
                                String::from_utf8_lossy(&o.stderr)
                            ))
                        }
                    });
            }
        }
        _ => {
            // Default: Terminal.app
            if let Some(cmd) = &command {
                format!(
                    r#"tell application "Terminal"
    activate
    do script "cd '{}' && {}"
end tell"#,
                    dir_str, cmd
                )
            } else {
                format!(
                    r#"tell application "Terminal"
    activate
    do script "cd '{}'"
end tell"#,
                    dir_str
                )
            }
        }
    };

    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .await
        .map_err(|e| format!("Failed to run osascript: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("osascript failed: {stderr}"));
    }

    Ok(())
}
