//! Shared helpers for typed JSON I/O under the new per-type folder layout:
//!   `.houston/<type>/<type>.json`
//!
//! Delegates atomic writes + path-traversal safety to `houston-agent-files`.

use houston_agent_files as files;
use serde::de::DeserializeOwned;
use serde::Serialize;
use std::path::{Path, PathBuf};

/// Returns the `.houston/` directory inside an agent root.
pub fn houston_dir(root: &Path) -> PathBuf {
    root.join(".houston")
}

/// Creates `.houston/` if it doesn't exist.
pub fn ensure_houston_dir(root: &Path) -> Result<(), String> {
    let dir = houston_dir(root);
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create .houston directory: {e}"))?;
    Ok(())
}

/// Build the relative path for a given type: `.houston/<name>/<name>.json`.
fn rel_path(name: &str) -> String {
    format!(".houston/{name}/{name}.json")
}

/// Read and deserialize `.houston/<name>/<name>.json`.
/// Returns `T::default()` if the file does not exist.
pub fn read_json<T: DeserializeOwned + Default>(root: &Path, name: &str) -> Result<T, String> {
    let rel = rel_path(name);
    let contents = files::read_file(root, &rel).map_err(|e| format!("Failed to read {rel}: {e}"))?;
    if contents.is_empty() {
        return Ok(T::default());
    }
    serde_json::from_str(&contents).map_err(|e| format!("Failed to parse {rel}: {e}"))
}

/// Atomically write a typed value as `.houston/<name>/<name>.json`.
pub fn write_json<T: Serialize>(root: &Path, name: &str, data: &T) -> Result<(), String> {
    let rel = rel_path(name);
    let body = serde_json::to_string_pretty(data).map_err(|e| format!("Failed to serialize: {e}"))?;
    files::write_file_atomic(root, &rel, &body).map_err(|e| format!("Failed to write {rel}: {e}"))
}
