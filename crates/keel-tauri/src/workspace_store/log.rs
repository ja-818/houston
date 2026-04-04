//! Append-only log operations for `.keel/log.jsonl`.

use super::helpers::{ensure_keel_dir, keel_dir};
use super::types::LogEntry;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;

const FILE: &str = "log.jsonl";

/// Append a single log entry as a JSON line.
pub fn append(root: &Path, entry: &LogEntry) -> Result<(), String> {
    ensure_keel_dir(root)?;
    let path = keel_dir(root).join(FILE);
    let line = serde_json::to_string(entry).map_err(|e| format!("Failed to serialize log: {e}"))?;

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| format!("Failed to open log file: {e}"))?;

    writeln!(file, "{line}").map_err(|e| format!("Failed to write log entry: {e}"))
}

/// Read all log entries from the JSONL file.
pub fn read(root: &Path) -> Result<Vec<LogEntry>, String> {
    let path = keel_dir(root).join(FILE);
    if !path.exists() {
        return Ok(Vec::new());
    }
    let contents =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read log file: {e}"))?;
    let mut entries = Vec::new();
    for (i, line) in contents.lines().enumerate() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        match serde_json::from_str::<LogEntry>(trimmed) {
            Ok(entry) => entries.push(entry),
            Err(e) => eprintln!("[workspace_store] skipping log line {i}: {e}"),
        }
    }
    Ok(entries)
}
