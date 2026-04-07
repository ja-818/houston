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

/// Copy a file from an absolute source path into a workspace directory.
/// Returns the file name used (which may be deduplicated if a file with the
/// same name already exists).
pub fn copy_file_to_dir(dir: &Path, source: &Path) -> Result<String, String> {
    if !source.is_file() {
        return Err(format!("Source is not a file: {}", source.display()));
    }
    let name = source
        .file_name()
        .ok_or_else(|| "Source has no file name".to_string())?
        .to_string_lossy()
        .to_string();

    let dest = deduplicate_name(dir, &name);
    let final_name = dest
        .file_name()
        .unwrap()
        .to_string_lossy()
        .to_string();

    fs::copy(source, &dest)
        .map_err(|e| format!("Failed to copy {}: {e}", source.display()))?;
    Ok(final_name)
}

/// Write raw bytes as a file into a workspace directory.
/// Returns the file name used (which may be deduplicated).
pub fn import_file(dir: &Path, name: &str, data: &[u8]) -> Result<String, String> {
    let dest = deduplicate_name(dir, name);
    let final_name = dest
        .file_name()
        .unwrap()
        .to_string_lossy()
        .to_string();

    fs::write(&dest, data)
        .map_err(|e| format!("Failed to write {name}: {e}"))?;
    Ok(final_name)
}

/// Create a folder inside a workspace directory.
/// Accepts a relative path (e.g., "docs" or "output/images") and creates all
/// intermediate directories. Returns the relative path that was created.
pub fn create_folder(dir: &Path, relative: &str) -> Result<String, String> {
    let relative = relative.trim().trim_matches('/');
    if relative.is_empty() {
        return Err("Folder name cannot be empty".to_string());
    }
    let target = dir.join(relative);
    fs::create_dir_all(&target)
        .map_err(|e| format!("Failed to create folder {relative}: {e}"))?;
    Ok(relative.to_string())
}

/// If `dir/name` already exists, append `(2)`, `(3)`, etc. before the extension.
fn deduplicate_name(dir: &Path, name: &str) -> std::path::PathBuf {
    let candidate = dir.join(name);
    if !candidate.exists() {
        return candidate;
    }

    let path = Path::new(name);
    let stem = path.file_stem().unwrap_or_default().to_string_lossy();
    let ext = path.extension().map(|e| e.to_string_lossy().to_string());

    for i in 2..=999 {
        let new_name = match &ext {
            Some(e) => format!("{stem} ({i}).{e}"),
            None => format!("{stem} ({i})"),
        };
        let candidate = dir.join(&new_name);
        if !candidate.exists() {
            return candidate;
        }
    }
    dir.join(name)
}
