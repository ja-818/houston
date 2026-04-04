//! Read/write operations for `.keel/config.json`.

use super::helpers::{keel_dir, write_json};
use super::types::ProjectConfig;
use std::fs;
use std::path::Path;

const FILE: &str = "config.json";

/// Read the project config. Returns a default if the file doesn't exist.
pub fn read(root: &Path) -> Result<ProjectConfig, String> {
    let path = keel_dir(root).join(FILE);
    if !path.exists() {
        return Ok(ProjectConfig {
            name: String::new(),
            claude_model: None,
            claude_effort: None,
        });
    }
    let contents =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read config: {e}"))?;
    serde_json::from_str(&contents).map_err(|e| format!("Failed to parse config: {e}"))
}

/// Write the project config (atomic write via temp + rename).
pub fn write(root: &Path, config: &ProjectConfig) -> Result<(), String> {
    write_json(root, FILE, config)
}
