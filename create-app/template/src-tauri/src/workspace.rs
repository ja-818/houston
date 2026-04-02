use keel_tauri::paths::expand_tilde;
use keel_tauri::workspace::seed_file;

const CLAUDE_MD_TEMPLATE: &str = r#"# {{APP_NAME_TITLE}} Agent

## Role
You are a helpful AI assistant.

## Rules
- Be concise and direct
- Ask before making destructive changes
- Explain your reasoning when making decisions
"#;

/// Seed workspace files for a new agent. Creates the folder and writes
/// CLAUDE.md if it doesn't already exist.
pub fn seed_workspace(folder_path: &str) {
    let dir = expand_tilde(folder_path);
    std::fs::create_dir_all(&dir).ok();
    seed_file(&dir, "CLAUDE.md", CLAUDE_MD_TEMPLATE);
}
