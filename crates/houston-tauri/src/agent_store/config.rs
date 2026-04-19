//! Read/write operations for `.houston/config/config.json`.

use super::helpers::write_json;
use super::types::ProjectConfig;
use houston_agent_files as files;
use std::path::Path;

const FILE: &str = "config";
const REL: &str = ".houston/config/config.json";

/// Read the project config. Returns a default if the file doesn't exist.
pub fn read(root: &Path) -> Result<ProjectConfig, String> {
    let contents = files::read_file(root, REL).map_err(|e| format!("Failed to read config: {e}"))?;
    if contents.is_empty() {
        return Ok(ProjectConfig {
            name: String::new(),
            provider: None,
            model: None,
            effort: None,
            extra: serde_json::Map::new(),
        });
    }
    serde_json::from_str(&contents).map_err(|e| format!("Failed to parse config: {e}"))
}

/// Write the project config (atomic write via temp + rename).
pub fn write(root: &Path, config: &ProjectConfig) -> Result<(), String> {
    write_json(root, FILE, config)
}
