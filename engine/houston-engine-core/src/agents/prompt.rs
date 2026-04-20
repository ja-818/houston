//! Agent directory helpers used to assemble the system prompt and seed
//! template files.
//!
//! Relocated from `app/houston-tauri/src/agent.rs` as part of the engine
//! standalone migration. Transport-neutral — the Tauri adapter, REST routes,
//! and tests all consume the same functions.

use serde::Serialize;
use std::fs;
use std::path::Path;

/// Seed a single file into a directory if it doesn't already exist.
/// Never overwrites user edits.
pub fn seed_file(dir: &Path, name: &str, content: &str) -> Result<(), String> {
    let path = dir.join(name);
    if !path.exists() {
        fs::write(&path, content).map_err(|e| format!("Failed to write {name}: {e}"))?;
    }
    Ok(())
}

/// Build a system prompt by reading agent files and assembling them.
///
/// - `base_prompt`: The base identity prompt (always included first).
/// - `bootstrap_name`: If this file exists, it's injected prominently as a
///   first-run signal.
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

/// Info about an agent file for UI display.
#[derive(Serialize)]
pub struct AgentFileInfo {
    pub name: String,
    pub description: String,
    pub exists: bool,
}

/// List known agent files with their existence status.
pub fn list_files(dir: &Path, known: &[(&str, &str)]) -> Vec<AgentFileInfo> {
    known
        .iter()
        .map(|(name, desc)| AgentFileInfo {
            name: name.to_string(),
            description: desc.to_string(),
            exists: dir.join(name).exists(),
        })
        .collect()
}

/// Read an agent file, only allowing known file names.
pub fn read_file(dir: &Path, name: &str, allowed: &[&str]) -> Result<String, String> {
    if !allowed.contains(&name) {
        return Err(format!("Unknown agent file: {name}"));
    }
    fs::read_to_string(dir.join(name)).map_err(|e| format!("Failed to read {name}: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn seed_file_is_write_once() {
        let d = TempDir::new().unwrap();
        seed_file(d.path(), "CLAUDE.md", "first").unwrap();
        seed_file(d.path(), "CLAUDE.md", "second").unwrap();
        assert_eq!(fs::read_to_string(d.path().join("CLAUDE.md")).unwrap(), "first");
    }

    #[test]
    fn build_system_prompt_assembles_known_sections() {
        let d = TempDir::new().unwrap();
        fs::write(d.path().join("BOOT.md"), "boot body").unwrap();
        fs::write(d.path().join("section.md"), "section body").unwrap();

        let out = build_system_prompt(
            d.path(),
            "BASE",
            Some("BOOT.md"),
            &[("section.md", "Section")],
        );
        assert!(out.contains("BASE"));
        assert!(out.contains("FIRST RUN — BOOTSTRAP"));
        assert!(out.contains("boot body"));
        assert!(out.contains("# Section"));
        assert!(out.contains("section body"));
    }

    #[test]
    fn list_files_reports_existence() {
        let d = TempDir::new().unwrap();
        fs::write(d.path().join("present.md"), "x").unwrap();
        let out = list_files(
            d.path(),
            &[("present.md", "exists"), ("absent.md", "missing")],
        );
        assert_eq!(out.len(), 2);
        assert!(out[0].exists);
        assert!(!out[1].exists);
    }

    #[test]
    fn read_file_rejects_unknown_name() {
        let d = TempDir::new().unwrap();
        let err = read_file(d.path(), "../etc/passwd", &["allowed.md"]).unwrap_err();
        assert!(err.contains("Unknown agent file"));
    }
}
