//! Agent configs — relocated from `app/src-tauri/src/commands/agent_configs.rs`.
//!
//! Reads installed agent manifests from `<home>/agents/*/houston.json`.
//! Transport-neutral: HTTP routes and Tauri proxies both call `list_installed`.

use crate::error::CoreResult;
use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Serialize, Debug)]
pub struct InstalledConfig {
    pub config: serde_json::Value,
    pub path: String,
}

/// List every installed agent config under `<home>/agents/`.
///
/// Each subdirectory with a valid `houston.json` contributes one entry.
/// Malformed or unreadable files are skipped with a warning, matching
/// the prior Tauri behavior.
pub fn list_installed(home: &Path) -> CoreResult<Vec<InstalledConfig>> {
    let dir = home.join("agents");
    fs::create_dir_all(&dir)?;

    let mut configs = Vec::new();
    for entry in fs::read_dir(&dir)?.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let config_path = path.join("houston.json");
        if !config_path.exists() {
            continue;
        }
        match fs::read_to_string(&config_path) {
            Ok(contents) => match serde_json::from_str::<serde_json::Value>(&contents) {
                Ok(config) => configs.push(InstalledConfig {
                    config,
                    path: path.to_string_lossy().to_string(),
                }),
                Err(e) => {
                    tracing::warn!(
                        "[agent_configs] failed to parse {}: {e}",
                        config_path.display()
                    );
                }
            },
            Err(e) => {
                tracing::warn!(
                    "[agent_configs] failed to read {}: {e}",
                    config_path.display()
                );
            }
        }
    }

    Ok(configs)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn empty_home_creates_dir_returns_empty() {
        let d = TempDir::new().unwrap();
        let out = list_installed(d.path()).unwrap();
        assert!(out.is_empty());
        assert!(d.path().join("agents").is_dir());
    }

    #[test]
    fn finds_valid_configs_skips_broken() {
        let d = TempDir::new().unwrap();
        let agents = d.path().join("agents");

        let alpha = agents.join("alpha");
        fs::create_dir_all(&alpha).unwrap();
        fs::write(
            alpha.join("houston.json"),
            r#"{"name":"alpha","version":"1"}"#,
        )
        .unwrap();

        let broken = agents.join("broken");
        fs::create_dir_all(&broken).unwrap();
        fs::write(broken.join("houston.json"), "{not json").unwrap();

        let bare = agents.join("bare");
        fs::create_dir_all(&bare).unwrap();

        let out = list_installed(d.path()).unwrap();
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].config["name"], "alpha");
    }
}
