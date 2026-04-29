//! OS-native commands — kept in the Tauri adapter because they only make
//! sense on the user's local machine.
//!
//! The engine may run on a remote VPS for Houston Always On / Teams /
//! Cloud; these commands (folder picker, Finder reveal, URL open, terminal
//! launch, local CLI probes) would be meaningless there and stay
//! desktop-only.

use std::path::PathBuf;
use tokio::process::Command;

fn shell_command_exists(bin: &str) -> bool {
    std::process::Command::new("which")
        .arg(bin)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// Does the user's shell have the `claude` CLI on `PATH`?
#[tauri::command]
pub fn check_claude_cli() -> bool {
    shell_command_exists("claude")
}

fn expand(p: &str) -> PathBuf {
    houston_tauri::paths::expand_tilde(&PathBuf::from(p))
}

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

// -- Open a URL in the default browser --

#[tauri::command(rename_all = "snake_case")]
pub async fn open_url(url: String) -> Result<(), String> {
    std::process::Command::new("open")
        .arg(&url)
        .spawn()
        .map_err(|e| format!("Failed to open URL: {e}"))?;
    Ok(())
}

// -- File reveal / open --

#[tauri::command(rename_all = "snake_case")]
pub async fn open_file(agent_path: String, relative_path: String) -> Result<(), String> {
    let root = expand(&agent_path);
    let full = root.join(&relative_path);
    if !full.exists() {
        return Err(format!("File does not exist: {}", full.display()));
    }
    std::process::Command::new("open")
        .arg(&full)
        .spawn()
        .map_err(|e| format!("Failed to open file: {e}"))?;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn reveal_file(agent_path: String, relative_path: String) -> Result<(), String> {
    let root = expand(&agent_path);
    let full = root.join(&relative_path);
    if !full.exists() {
        return Err(format!("File does not exist: {}", full.display()));
    }
    std::process::Command::new("open")
        .arg("-R")
        .arg(&full)
        .spawn()
        .map_err(|e| format!("Failed to reveal file: {e}"))?;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn reveal_agent(agent_path: String) -> Result<(), String> {
    let root = expand(&agent_path);
    std::process::Command::new("open")
        .arg(&root)
        .spawn()
        .map_err(|e| format!("Failed to open folder: {e}"))?;
    Ok(())
}
