//! Shared helpers for atomic JSON file I/O.

use serde::de::DeserializeOwned;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

/// Returns the `.houston/` directory inside a project root.
pub fn houston_dir(root: &Path) -> PathBuf {
    root.join(".houston")
}

/// Creates `.houston/` and `.houston/skills/` if they don't exist.
pub fn ensure_houston_dir(root: &Path) -> Result<(), String> {
    let dir = houston_dir(root);
    fs::create_dir_all(dir.join("skills"))
        .map_err(|e| format!("Failed to create .houston directory: {e}"))?;
    Ok(())
}

/// Read and deserialize a JSON file from `.houston/{filename}`.
/// Returns a default value (via `Default`) if the file doesn't exist.
pub fn read_json<T: DeserializeOwned + Default>(
    root: &Path,
    filename: &str,
) -> Result<T, String> {
    let path = houston_dir(root).join(filename);
    if !path.exists() {
        return Ok(T::default());
    }
    let contents =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read {filename}: {e}"))?;
    serde_json::from_str(&contents).map_err(|e| format!("Failed to parse {filename}: {e}"))
}

/// Atomically write serialized JSON to `.houston/{filename}`.
/// Writes to a `.tmp` file first, then renames to prevent corruption.
pub fn write_json<T: Serialize>(
    root: &Path,
    filename: &str,
    data: &T,
) -> Result<(), String> {
    let dir = houston_dir(root);
    ensure_houston_dir(root)?;
    let target = dir.join(filename);
    let tmp = dir.join(format!("{filename}.tmp"));
    let json =
        serde_json::to_string_pretty(data).map_err(|e| format!("Failed to serialize: {e}"))?;
    fs::write(&tmp, &json).map_err(|e| format!("Failed to write {filename}.tmp: {e}"))?;
    fs::rename(&tmp, &target).map_err(|e| format!("Failed to rename {filename}: {e}"))?;
    Ok(())
}
