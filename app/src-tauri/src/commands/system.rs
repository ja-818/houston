use std::process::Command;

#[tauri::command]
pub fn check_claude_cli() -> bool {
    Command::new("which")
        .arg("claude")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}
