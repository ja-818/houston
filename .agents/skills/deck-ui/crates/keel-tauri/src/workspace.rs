//! Workspace directory helpers for AI agent apps.
//!
//! Provides utilities for seeding template files, building system prompts
//! from workspace contents, and listing/reading workspace files.

use std::fs;
use std::path::Path;

/// Seed a single file into a directory if it doesn't already exist.
/// Never overwrites user edits.
pub fn seed_file(dir: &Path, name: &str, content: &str) -> Result<(), String> {
    let path = dir.join(name);
    if !path.exists() {
        fs::write(&path, content)
            .map_err(|e| format!("Failed to write {name}: {e}"))?;
    }
    Ok(())
}

/// Build a system prompt by reading workspace files and assembling them.
///
/// - `base_prompt`: The base identity prompt (always included first).
/// - `bootstrap_name`: If this file exists, it's injected prominently as a first-run signal.
/// - `files`: List of `(filename, section_label)` to read and inject.
pub fn build_system_prompt(
    dir: &Path,
    base_prompt: &str,
    bootstrap_name: Option<&str>,
    files: &[(&str, &str)],
) -> String {
    let mut sections = vec![base_prompt.to_string()];

    if let Some(name) = bootstrap_name {
        if let Ok(content) = fs::read_to_string(dir.join(name)) {
            sections.push(format!(
                "# FIRST RUN — BOOTSTRAP\n\
                 {name} exists. This is your first time. Follow it EXACTLY.\n\n\
                 {content}"
            ));
        }
    }

    for (name, label) in files {
        if let Ok(content) = fs::read_to_string(dir.join(name)) {
            sections.push(format!("# {label}\n\n{content}"));
        }
    }

    sections.join("\n\n---\n\n")
}

/// Info about a workspace file for UI display.
#[derive(serde::Serialize)]
pub struct WorkspaceFileInfo {
    pub name: String,
    pub description: String,
    pub exists: bool,
}

/// List known workspace files with their existence status.
pub fn list_files(dir: &Path, known: &[(&str, &str)]) -> Vec<WorkspaceFileInfo> {
    known
        .iter()
        .map(|(name, desc)| WorkspaceFileInfo {
            name: name.to_string(),
            description: desc.to_string(),
            exists: dir.join(name).exists(),
        })
        .collect()
}

/// Read a workspace file, only allowing known file names.
pub fn read_file(
    dir: &Path,
    name: &str,
    allowed: &[&str],
) -> Result<String, String> {
    if !allowed.contains(&name) {
        return Err(format!("Unknown workspace file: {name}"));
    }
    fs::read_to_string(dir.join(name))
        .map_err(|e| format!("Failed to read {name}: {e}"))
}
