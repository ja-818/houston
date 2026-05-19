//! One-shot migration that retires `workspace.provider` / `workspace.model`
//! in favor of per-agent storage.
//!
//! Houston used to keep the provider+model on the workspace as the implicit
//! default for every agent inside it. That created two foot-guns:
//!
//! 1. Stale defaults inside the agent-creation dialog could silently bake a
//!    different provider into a new agent's `config.json` even when the user
//!    never touched the picker — the workspace was the source of truth at
//!    write-time but a stale value at mount-time.
//! 2. Users who changed the workspace default after creating agents had no
//!    obvious way to tell which agents would inherit the new value and which
//!    had a baked-in override.
//!
//! We're moving to "the agent owns its provider, full stop." This migration
//! preserves existing intent: for each workspace that has a default set, we
//! write that pair into every contained agent's `config.json` (only when the
//! field is missing on that agent), then strip the field from the workspace
//! entry. After the migration runs, the workspace JSON no longer carries
//! `provider` / `model` and the engine's provider resolver no longer reads
//! them.
//!
//! Idempotent: a workspace without provider/model is skipped on every call.

use super::{io, Workspace};
use crate::error::CoreResult;
use serde_json::{Map, Value};
use std::fs;
use std::path::Path;

/// Walk every workspace in `root`. For each one that has a non-empty
/// `provider` or `model`, push those values down into the contained agents'
/// `.houston/config/config.json` (filling missing fields only, never
/// overwriting) and then clear them from the workspace entry.
pub fn migrate_workspace_provider_into_agents(root: &Path) -> CoreResult<()> {
    let mut workspaces = io::read_all(root)?;
    let mut workspaces_dirty = false;

    for ws in workspaces.iter_mut() {
        if ws.provider.is_none() && ws.model.is_none() {
            continue;
        }
        let ws_dir = root.join(&ws.name);
        if ws_dir.is_dir() {
            if let Err(e) = backfill_workspace_agents(&ws_dir, ws) {
                // Log and skip clearing the workspace fields — re-running the
                // migration will retry. We never want to lose the workspace's
                // intent because one agent dir was unreadable.
                tracing::warn!(
                    "[workspaces.migrate] backfill failed for {}: {e}",
                    ws_dir.display()
                );
                continue;
            }
        }
        // Either the directory is missing (no agents to backfill) or every
        // agent inside has been updated. Drop the workspace-level fields so
        // subsequent boots skip this entry.
        ws.provider = None;
        ws.model = None;
        workspaces_dirty = true;
    }

    if workspaces_dirty {
        io::write_all(root, &workspaces)?;
    }
    Ok(())
}

fn backfill_workspace_agents(ws_dir: &Path, ws: &Workspace) -> CoreResult<()> {
    for entry in fs::read_dir(ws_dir)? {
        let entry = entry?;
        if !entry.file_type()?.is_dir() {
            continue;
        }
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if name_str.starts_with('.') {
            continue;
        }
        let agent_dir = entry.path();
        backfill_agent_config(&agent_dir, ws)?;
    }
    Ok(())
}

fn backfill_agent_config(agent_dir: &Path, ws: &Workspace) -> CoreResult<()> {
    let cfg_dir = agent_dir.join(".houston").join("config");
    let cfg_path = cfg_dir.join("config.json");

    let mut cfg: Map<String, Value> = if cfg_path.exists() {
        let raw = fs::read_to_string(&cfg_path)?;
        if raw.trim().is_empty() {
            Map::new()
        } else {
            match serde_json::from_str::<Value>(&raw) {
                Ok(Value::Object(m)) => m,
                Ok(_) | Err(_) => {
                    // The file exists but isn't a JSON object. Don't clobber
                    // it — the user might be holding their own format we
                    // don't recognize. Skip this agent.
                    tracing::warn!(
                        "[workspaces.migrate] {} is not a JSON object — skipping",
                        cfg_path.display()
                    );
                    return Ok(());
                }
            }
        }
    } else {
        Map::new()
    };

    let mut dirty = false;
    if !cfg.contains_key("provider") {
        if let Some(p) = ws.provider.as_deref() {
            cfg.insert("provider".into(), Value::String(p.to_string()));
            dirty = true;
        }
    }
    if !cfg.contains_key("model") {
        if let Some(m) = ws.model.as_deref() {
            cfg.insert("model".into(), Value::String(m.to_string()));
            dirty = true;
        }
    }

    if dirty {
        fs::create_dir_all(&cfg_dir)?;
        let body = serde_json::to_string_pretty(&Value::Object(cfg))?;
        fs::write(&cfg_path, body)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::workspaces::Workspace;
    use serde_json::json;
    use tempfile::TempDir;

    fn write_workspaces(root: &Path, body: Value) {
        fs::write(root.join("workspaces.json"), body.to_string()).unwrap();
    }

    fn read_workspaces(root: &Path) -> Vec<Workspace> {
        let raw = fs::read_to_string(root.join("workspaces.json")).unwrap();
        serde_json::from_str(&raw).unwrap()
    }

    fn read_agent_cfg(agent_dir: &Path) -> Value {
        let raw = fs::read_to_string(agent_dir.join(".houston/config/config.json")).unwrap();
        serde_json::from_str(&raw).unwrap()
    }

    #[test]
    fn empty_agent_config_gets_workspace_defaults() {
        let d = TempDir::new().unwrap();
        let root = d.path();
        let ws_dir = root.join("Personal");
        let agent = ws_dir.join("Agent A");
        fs::create_dir_all(agent.join(".houston/config")).unwrap();
        fs::write(agent.join(".houston/config/config.json"), "{}").unwrap();
        write_workspaces(
            root,
            json!([{
                "id": "w1",
                "name": "Personal",
                "isDefault": false,
                "createdAt": "t",
                "provider": "openai",
                "model": "gpt-5.5",
            }]),
        );

        migrate_workspace_provider_into_agents(root).unwrap();

        let cfg = read_agent_cfg(&agent);
        assert_eq!(cfg["provider"], "openai");
        assert_eq!(cfg["model"], "gpt-5.5");
        let workspaces = read_workspaces(root);
        assert!(workspaces[0].provider.is_none());
        assert!(workspaces[0].model.is_none());
    }

    #[test]
    fn existing_agent_provider_is_preserved() {
        let d = TempDir::new().unwrap();
        let root = d.path();
        let agent = root.join("Personal").join("Agent A");
        fs::create_dir_all(agent.join(".houston/config")).unwrap();
        fs::write(
            agent.join(".houston/config/config.json"),
            r#"{"provider":"anthropic","model":"opus"}"#,
        )
        .unwrap();
        write_workspaces(
            root,
            json!([{
                "id": "w1",
                "name": "Personal",
                "isDefault": false,
                "createdAt": "t",
                "provider": "openai",
                "model": "gpt-5.5",
            }]),
        );

        migrate_workspace_provider_into_agents(root).unwrap();

        let cfg = read_agent_cfg(&agent);
        assert_eq!(cfg["provider"], "anthropic");
        assert_eq!(cfg["model"], "opus");
    }

    #[test]
    fn missing_config_file_is_created() {
        let d = TempDir::new().unwrap();
        let root = d.path();
        let agent = root.join("Personal").join("Agent A");
        fs::create_dir_all(&agent).unwrap();
        write_workspaces(
            root,
            json!([{
                "id": "w1",
                "name": "Personal",
                "isDefault": false,
                "createdAt": "t",
                "provider": "openai",
                "model": "gpt-5.5",
            }]),
        );

        migrate_workspace_provider_into_agents(root).unwrap();

        let cfg = read_agent_cfg(&agent);
        assert_eq!(cfg["provider"], "openai");
        assert_eq!(cfg["model"], "gpt-5.5");
    }

    #[test]
    fn idempotent_on_already_migrated_workspaces() {
        let d = TempDir::new().unwrap();
        let root = d.path();
        let agent = root.join("Personal").join("Agent A");
        fs::create_dir_all(agent.join(".houston/config")).unwrap();
        fs::write(
            agent.join(".houston/config/config.json"),
            r#"{"provider":"anthropic","model":"opus"}"#,
        )
        .unwrap();
        // Workspaces.json already has no provider/model — i.e. already migrated.
        write_workspaces(
            root,
            json!([{
                "id": "w1",
                "name": "Personal",
                "isDefault": false,
                "createdAt": "t",
            }]),
        );

        migrate_workspace_provider_into_agents(root).unwrap();
        migrate_workspace_provider_into_agents(root).unwrap();

        let cfg = read_agent_cfg(&agent);
        assert_eq!(cfg["provider"], "anthropic");
        assert_eq!(cfg["model"], "opus");
    }

    #[test]
    fn workspace_without_directory_clears_fields() {
        let d = TempDir::new().unwrap();
        let root = d.path();
        // No "Personal" dir on disk.
        write_workspaces(
            root,
            json!([{
                "id": "w1",
                "name": "Personal",
                "isDefault": false,
                "createdAt": "t",
                "provider": "openai",
                "model": "gpt-5.5",
            }]),
        );

        migrate_workspace_provider_into_agents(root).unwrap();
        let workspaces = read_workspaces(root);
        assert!(workspaces[0].provider.is_none());
        assert!(workspaces[0].model.is_none());
    }

    #[test]
    fn hidden_dirs_are_skipped() {
        let d = TempDir::new().unwrap();
        let root = d.path();
        let ws = root.join("Personal");
        fs::create_dir_all(ws.join(".houston")).unwrap();
        fs::create_dir_all(ws.join("Agent A").join(".houston/config")).unwrap();
        fs::write(ws.join("Agent A/.houston/config/config.json"), "{}").unwrap();
        write_workspaces(
            root,
            json!([{
                "id": "w1",
                "name": "Personal",
                "isDefault": false,
                "createdAt": "t",
                "provider": "openai",
                "model": "gpt-5.5",
            }]),
        );

        migrate_workspace_provider_into_agents(root).unwrap();

        // The `.houston` sibling under Personal/ must NOT have been treated
        // as an agent (no config file dropped inside it).
        assert!(!ws.join(".houston/config/config.json").exists());
        let cfg = read_agent_cfg(&ws.join("Agent A"));
        assert_eq!(cfg["provider"], "openai");
    }
}
