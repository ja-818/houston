//! Read/write operations for `.houston/skills/*.md` files.
//!
//! Each skill is a markdown file with `## Instructions` and `## Learnings` sections.

use super::helpers::{ensure_houston_dir, houston_dir};
use super::types::Skill;
use std::fs;
use std::path::Path;

/// List all skills by scanning `.houston/skills/*.md`.
pub fn list(root: &Path) -> Result<Vec<Skill>, String> {
    let dir = houston_dir(root).join("skills");
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let mut skills = Vec::new();
    let entries = fs::read_dir(&dir).map_err(|e| format!("Failed to read skills dir: {e}"))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("md") {
            continue;
        }
        let name = path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        match parse_skill_file(&path, &name) {
            Ok(skill) => skills.push(skill),
            Err(e) => eprintln!("[workspace_store] skipping skill {name}: {e}"),
        }
    }
    skills.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(skills)
}

/// Read a single skill by name (without `.md` extension).
pub fn read(root: &Path, name: &str) -> Result<Skill, String> {
    let path = houston_dir(root).join("skills").join(format!("{name}.md"));
    if !path.exists() {
        return Err(format!("Skill not found: {name}"));
    }
    parse_skill_file(&path, name)
}

/// Write (create or overwrite) a skill file.
pub fn write(root: &Path, name: &str, instructions: &str, learnings: &str) -> Result<(), String> {
    ensure_houston_dir(root)?;
    let path = houston_dir(root).join("skills").join(format!("{name}.md"));
    let content = format!("## Instructions\n\n{instructions}\n\n## Learnings\n\n{learnings}\n");
    fs::write(&path, &content).map_err(|e| format!("Failed to write skill {name}: {e}"))
}

/// Delete a skill file.
pub fn delete(root: &Path, name: &str) -> Result<(), String> {
    let path = houston_dir(root).join("skills").join(format!("{name}.md"));
    if !path.exists() {
        return Err(format!("Skill not found: {name}"));
    }
    fs::remove_file(&path).map_err(|e| format!("Failed to delete skill {name}: {e}"))
}

/// Parse a skill markdown file into `## Instructions` and `## Learnings` sections.
fn parse_skill_file(path: &Path, name: &str) -> Result<Skill, String> {
    let content =
        fs::read_to_string(path).map_err(|e| format!("Failed to read skill {name}: {e}"))?;
    let instructions = extract_section(&content, "Instructions");
    let learnings = extract_section(&content, "Learnings");
    Ok(Skill {
        name: name.to_string(),
        instructions,
        learnings,
    })
}

/// Extract text after `## {heading}` until the next `## ` or end of file.
fn extract_section(content: &str, heading: &str) -> String {
    let marker = format!("## {heading}");
    let Some(start) = content.find(&marker) else {
        return String::new();
    };
    let after = &content[start + marker.len()..];
    let end = after.find("\n## ").unwrap_or(after.len());
    after[..end].trim().to_string()
}
