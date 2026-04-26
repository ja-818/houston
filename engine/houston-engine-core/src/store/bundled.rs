use super::StoreListing;
use crate::error::{CoreError, CoreResult};
use crate::workspaces;
use serde::Deserialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Deserialize)]
struct BundledCatalog {
    agents: Vec<StoreListing>,
}

pub(super) fn bundled_catalog() -> CoreResult<Option<Vec<StoreListing>>> {
    let Some(root) = bundled_store_root() else {
        return Ok(None);
    };
    let path = root.join("catalog.json");
    if !path.exists() {
        return Ok(None);
    }
    let body = fs::read_to_string(path)?;
    let catalog: BundledCatalog = serde_json::from_str(&body)?;
    Ok(Some(catalog.agents))
}

fn bundled_store_root() -> Option<PathBuf> {
    if let Ok(dir) = std::env::var("HOUSTON_STORE_DIR") {
        let path = PathBuf::from(dir);
        if path.join("catalog.json").exists() {
            return Some(path);
        }
    }

    let mut starts = Vec::new();
    if let Ok(cwd) = std::env::current_dir() {
        starts.push(cwd);
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            starts.push(parent.to_path_buf());
        }
    }

    for start in starts {
        for ancestor in start.ancestors() {
            let candidate = ancestor.join("store");
            if candidate.join("catalog.json").exists() {
                return Some(candidate);
            }
        }
    }

    None
}

pub(super) fn install_bundled_agent(
    agents_dir: &Path,
    source_agent_id: &str,
    requested_agent_id: Option<&str>,
) -> CoreResult<()> {
    let root = bundled_store_root()
        .ok_or_else(|| CoreError::NotFound("bundled Houston Store not found".into()))?;
    let source_dir = root.join("agents").join(source_agent_id);
    if !source_dir.join("houston.json").exists() {
        return Err(CoreError::NotFound(format!(
            "bundled agent not found: {source_agent_id}"
        )));
    }

    let catalog = bundled_catalog()?.unwrap_or_default();
    let listing = catalog.iter().find(|l| l.id == source_agent_id);
    let agent_id = requested_agent_id.unwrap_or(source_agent_id);
    let target_dir = agents_dir.join(agent_id);
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir)?;
    }
    copy_dir_all(&source_dir, &target_dir)?;

    let source = serde_json::json!({
        "source": "houston-store",
        "agent_id": source_agent_id,
        "version": listing.and_then(|l| l.version.as_deref()),
        "content_hash": listing.and_then(|l| l.content_hash.as_deref()),
        "installed_at": chrono::Utc::now().to_rfc3339(),
    });
    fs::write(
        target_dir.join(".source.json"),
        serde_json::to_string_pretty(&source)?,
    )?;
    Ok(())
}

pub(crate) fn copy_dir_all(from: &Path, to: &Path) -> CoreResult<()> {
    fs::create_dir_all(to)?;
    for entry in fs::read_dir(from)? {
        let entry = entry?;
        let source = entry.path();
        let target = to.join(entry.file_name());
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(&source, &target)?;
        } else if ty.is_file() {
            fs::copy(&source, &target)?;
        }
    }
    Ok(())
}

pub(super) fn sync_bundled_agent_instances(
    docs_dir: &Path,
    agents_dir: &Path,
    agent_id: &str,
) -> CoreResult<usize> {
    let packaged_skills = agents_dir.join(agent_id).join(".agents").join("skills");
    let has_packaged_skills = packaged_skills.exists();

    let mut changed = 0;
    for workspace in workspaces::read_all(docs_dir)? {
        let workspace_dir = docs_dir.join(workspace.name);
        if !workspace_dir.exists() {
            continue;
        }
        for entry in fs::read_dir(&workspace_dir)?.flatten() {
            let folder = entry.path();
            if !folder.is_dir() {
                continue;
            }
            let meta_path = folder.join(".houston").join("agent.json");
            if !meta_path.exists() {
                continue;
            }
            let Ok(meta) = fs::read_to_string(&meta_path)
                .ok()
                .and_then(|body| serde_json::from_str::<serde_json::Value>(&body).ok())
                .ok_or(())
            else {
                continue;
            };
            if meta["config_id"].as_str() != Some(agent_id) {
                continue;
            }
            let mut instance_changed = false;
            if has_packaged_skills {
                let target = folder.join(".agents").join("skills");
                if copy_missing_skill_dirs(&packaged_skills, &target)? {
                    instance_changed = true;
                }
            }
            if clear_seeded_intro_activity(&folder)? {
                instance_changed = true;
            }
            if instance_changed {
                changed += 1;
            }
        }
    }
    Ok(changed)
}

fn clear_seeded_intro_activity(agent_dir: &Path) -> CoreResult<bool> {
    let mut changed = false;
    for relative in [".houston/activity.json", ".houston/activity/activity.json"] {
        let path = agent_dir.join(relative);
        if !path.exists() {
            continue;
        }
        let body = fs::read_to_string(&path)?;
        if is_seeded_intro_activity_list(&body) {
            fs::write(&path, "[]")?;
            changed = true;
        }
    }
    Ok(changed)
}

fn is_seeded_intro_activity_list(body: &str) -> bool {
    let Ok(value) = serde_json::from_str::<serde_json::Value>(body) else {
        return false;
    };
    let Some(items) = value.as_array() else {
        return false;
    };
    let [item] = items.as_slice() else {
        return false;
    };
    let status = item.get("status").and_then(|value| value.as_str());
    let title = item
        .get("title")
        .and_then(|value| value.as_str())
        .unwrap_or_default();
    let description = item
        .get("description")
        .and_then(|value| value.as_str())
        .unwrap_or_default();

    status == Some("needs_you")
        && title.starts_with("Start anywhere")
        && description.starts_with("No upfront onboarding.")
}

fn copy_missing_skill_dirs(from: &Path, to: &Path) -> CoreResult<bool> {
    fs::create_dir_all(to)?;
    let mut changed = false;
    for entry in fs::read_dir(from)? {
        let entry = entry?;
        if !entry.file_type()?.is_dir() {
            continue;
        }
        let source = entry.path();
        let target = to.join(entry.file_name());
        if target.exists() {
            if sync_existing_skill_metadata(&source, &target)? {
                changed = true;
            }
            continue;
        }
        copy_dir_all(&source, &target)?;
        changed = true;
    }
    Ok(changed)
}

fn sync_existing_skill_metadata(source_dir: &Path, target_dir: &Path) -> CoreResult<bool> {
    let source_md = source_dir.join("SKILL.md");
    let target_md = target_dir.join("SKILL.md");
    if !source_md.exists() || !target_md.exists() {
        return Ok(false);
    }

    let (mut source_summary, _) = match houston_skills::format::parse_file(&source_md) {
        Ok(parsed) => parsed,
        Err(e) => {
            tracing::warn!(
                "[store] skipping skill metadata sync for {}: {e}",
                source_md.display()
            );
            return Ok(false);
        }
    };

    let target_raw = fs::read_to_string(&target_md)?;
    let (target_summary, target_body) = match houston_skills::format::parse_content(&target_raw) {
        Ok((summary, body)) => (Some(summary), body),
        Err(_) => (None, raw_skill_body(&target_raw).unwrap_or_default()),
    };

    if let Some(summary) = target_summary {
        source_summary.created = summary.created.or(source_summary.created);
        source_summary.last_used = summary.last_used.or(source_summary.last_used);
    }

    let updated = houston_skills::format::serialize(&source_summary, &target_body);
    if updated == target_raw {
        return Ok(false);
    }

    let tmp = target_md.with_file_name("SKILL.md.tmp");
    fs::write(&tmp, updated)?;
    fs::rename(&tmp, &target_md)?;
    Ok(true)
}

fn raw_skill_body(content: &str) -> Option<String> {
    let trimmed = content.trim_start();
    if !trimmed.starts_with("---") {
        return None;
    }
    let after_first = trimmed[3..].strip_prefix('\n').unwrap_or(&trimmed[3..]);
    let end_idx = after_first.find("\n---")?;
    let body_start = end_idx + 4;
    Some(
        after_first
            .get(body_start..)
            .unwrap_or_default()
            .trim_start_matches('\n')
            .to_string(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents_crud::{self, CreateAgent};
    use crate::workspaces::CreateWorkspace;
    use std::collections::BTreeSet;
    use std::sync::Mutex;
    use tempfile::TempDir;

    static ENV_LOCK: Mutex<()> = Mutex::new(());

    fn write_bundled_agent(root: &Path, id: &str, version: &str, skill_body: &str) {
        let dir = root.join("agents").join(id);
        fs::create_dir_all(dir.join(".agents/skills/demo")).unwrap();
        fs::write(
            dir.join("houston.json"),
            format!(
                r#"{{
  "id": "{id}",
  "name": "Demo",
  "description": "Demo agent",
  "version": "{version}",
  "tabs": [{{"id": "chat", "label": "Chat", "builtIn": "chat"}}]
}}"#
            ),
        )
        .unwrap();
        fs::write(dir.join("CLAUDE.md"), "## Demo").unwrap();
        fs::write(dir.join(".agents/skills/demo/SKILL.md"), skill_body).unwrap();
    }

    fn write_catalog(root: &Path, id: &str, version: &str, hash: &str) {
        fs::write(
            root.join("catalog.json"),
            format!(
                r#"{{
  "version": 1,
  "agents": [{{
    "id": "{id}",
    "name": "Demo",
    "description": "Demo agent",
    "category": "business",
    "author": "Houston",
    "tags": ["demo"],
    "icon_url": "",
    "repo": "houston-store/{id}",
    "installs": 0,
    "registered_at": "2026-04-26",
    "version": "{version}",
    "content_hash": "{hash}",
    "bundled": true
  }}]
}}"#
            ),
        )
        .unwrap();
    }

    #[test]
    fn bundled_catalog_reads_from_store_dir() {
        let _guard = ENV_LOCK.lock().unwrap();
        let store = TempDir::new().unwrap();
        write_bundled_agent(store.path(), "demo", "1.0.0", "v1");
        write_catalog(store.path(), "demo", "1.0.0", "hash-v1");
        std::env::set_var("HOUSTON_STORE_DIR", store.path());

        let catalog = bundled_catalog().unwrap().unwrap();

        std::env::remove_var("HOUSTON_STORE_DIR");
        assert_eq!(catalog.len(), 1);
        assert_eq!(catalog[0].repo, "houston-store/demo");
        assert!(catalog[0].bundled);
    }

    #[test]
    fn install_bundled_agent_copies_package_and_source() {
        let _guard = ENV_LOCK.lock().unwrap();
        let store = TempDir::new().unwrap();
        let agents = TempDir::new().unwrap();
        write_bundled_agent(store.path(), "demo", "1.0.0", "v1");
        write_catalog(store.path(), "demo", "1.0.0", "hash-v1");
        std::env::set_var("HOUSTON_STORE_DIR", store.path());

        install_bundled_agent(agents.path(), "demo", Some("demo")).unwrap();

        std::env::remove_var("HOUSTON_STORE_DIR");
        assert!(agents.path().join("demo/houston.json").exists());
        assert!(agents
            .path()
            .join("demo/.agents/skills/demo/SKILL.md")
            .exists());
        let source = fs::read_to_string(agents.path().join("demo/.source.json")).unwrap();
        assert!(source.contains(r#""source": "houston-store""#));
        assert!(source.contains(r#""content_hash": "hash-v1""#));
    }

    #[test]
    fn check_updates_refreshes_bundled_agent() {
        let _guard = ENV_LOCK.lock().unwrap();
        let store = TempDir::new().unwrap();
        let agents = TempDir::new().unwrap();
        write_bundled_agent(store.path(), "demo", "1.0.0", "v1");
        write_catalog(store.path(), "demo", "1.0.0", "hash-v1");
        std::env::set_var("HOUSTON_STORE_DIR", store.path());
        install_bundled_agent(agents.path(), "demo", Some("demo")).unwrap();

        fs::remove_dir_all(store.path().join("agents/demo")).unwrap();
        write_bundled_agent(store.path(), "demo", "1.1.0", "v2");
        write_catalog(store.path(), "demo", "1.1.0", "hash-v2");

        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let updated = rt
            .block_on(crate::store::check_agent_updates(agents.path()))
            .unwrap();

        std::env::remove_var("HOUSTON_STORE_DIR");
        assert_eq!(updated, vec!["demo"]);
        let skill =
            fs::read_to_string(agents.path().join("demo/.agents/skills/demo/SKILL.md")).unwrap();
        assert_eq!(skill, "v2");
    }

    #[test]
    fn sync_bundled_agent_instances_copies_new_skills_only() {
        let _guard = ENV_LOCK.lock().unwrap();
        let store = TempDir::new().unwrap();
        let agents = TempDir::new().unwrap();
        let docs = TempDir::new().unwrap();
        write_bundled_agent(store.path(), "demo", "1.0.0", "v1");
        write_catalog(store.path(), "demo", "1.0.0", "hash-v1");
        std::env::set_var("HOUSTON_STORE_DIR", store.path());
        install_bundled_agent(agents.path(), "demo", Some("demo")).unwrap();

        let ws = workspaces::create(
            docs.path(),
            CreateWorkspace {
                name: "Acme".into(),
                provider: None,
                model: None,
            },
        )
        .unwrap();
        agents_crud::create(
            docs.path(),
            &ws.id,
            CreateAgent {
                name: "Ops".into(),
                config_id: "demo".into(),
                color: None,
                claude_md: None,
                installed_path: Some(agents.path().join("demo").to_string_lossy().to_string()),
                seeds: None,
                existing_path: None,
            },
        )
        .unwrap();

        let instance_skill = docs.path().join("Acme/Ops/.agents/skills/demo/SKILL.md");
        fs::write(&instance_skill, "user edited").unwrap();
        fs::remove_dir_all(store.path().join("agents/demo")).unwrap();
        write_bundled_agent(store.path(), "demo", "1.1.0", "v2");
        fs::create_dir_all(store.path().join("agents/demo/.agents/skills/new-action")).unwrap();
        fs::write(
            store
                .path()
                .join("agents/demo/.agents/skills/new-action/SKILL.md"),
            "new",
        )
        .unwrap();
        write_catalog(store.path(), "demo", "1.1.0", "hash-v2");
        install_bundled_agent(agents.path(), "demo", Some("demo")).unwrap();

        let changed = sync_bundled_agent_instances(docs.path(), agents.path(), "demo").unwrap();

        std::env::remove_var("HOUSTON_STORE_DIR");
        assert_eq!(changed, 1);
        assert_eq!(fs::read_to_string(instance_skill).unwrap(), "user edited");
        assert!(docs
            .path()
            .join("Acme/Ops/.agents/skills/new-action/SKILL.md")
            .exists());
    }

    #[test]
    fn sync_bundled_agent_instances_refreshes_skill_metadata_only() {
        let _guard = ENV_LOCK.lock().unwrap();
        let store = TempDir::new().unwrap();
        let agents = TempDir::new().unwrap();
        let docs = TempDir::new().unwrap();
        let old_skill = r#"---
name: demo
description: Old action
version: 1
tags: []
---

# Demo

Package v1 body
"#;
        let new_skill = r#"---
name: demo
description: New action
version: 2
tags: [demo]
inputs:
  - name: company
    label: Company
prompt_template: |
  Research {{company}}
---

# Demo

Package v2 body
"#;
        write_bundled_agent(store.path(), "demo", "1.0.0", old_skill);
        write_catalog(store.path(), "demo", "1.0.0", "hash-v1");
        std::env::set_var("HOUSTON_STORE_DIR", store.path());
        install_bundled_agent(agents.path(), "demo", Some("demo")).unwrap();

        let ws = workspaces::create(
            docs.path(),
            CreateWorkspace {
                name: "Acme".into(),
                provider: None,
                model: None,
            },
        )
        .unwrap();
        agents_crud::create(
            docs.path(),
            &ws.id,
            CreateAgent {
                name: "Ops".into(),
                config_id: "demo".into(),
                color: None,
                claude_md: None,
                installed_path: Some(agents.path().join("demo").to_string_lossy().to_string()),
                seeds: None,
                existing_path: None,
            },
        )
        .unwrap();

        let instance_skill = docs.path().join("Acme/Ops/.agents/skills/demo/SKILL.md");
        fs::write(
            &instance_skill,
            r#"---
name: demo
description: User-customized action
version: 1
tags: []
last_used: 2026-04-20
---

# Demo

User customized body
"#,
        )
        .unwrap();
        fs::remove_dir_all(store.path().join("agents/demo")).unwrap();
        write_bundled_agent(store.path(), "demo", "1.1.0", new_skill);
        write_catalog(store.path(), "demo", "1.1.0", "hash-v2");
        install_bundled_agent(agents.path(), "demo", Some("demo")).unwrap();

        let changed = sync_bundled_agent_instances(docs.path(), agents.path(), "demo").unwrap();

        std::env::remove_var("HOUSTON_STORE_DIR");
        assert_eq!(changed, 1);
        let updated = fs::read_to_string(&instance_skill).unwrap();
        let (summary, body) = houston_skills::format::parse_content(&updated).unwrap();
        assert_eq!(summary.description, "New action");
        assert_eq!(summary.version, 2);
        assert_eq!(summary.last_used.as_deref(), Some("2026-04-20"));
        assert_eq!(summary.inputs.len(), 1);
        assert_eq!(summary.inputs[0].name, "company");
        assert_eq!(
            summary.prompt_template.as_deref(),
            Some("Research {{company}}")
        );
        assert!(body.contains("User customized body"));
        assert!(!body.contains("Package v2 body"));
    }

    #[test]
    fn sync_bundled_agent_instances_removes_seeded_intro_activity_only() {
        let _guard = ENV_LOCK.lock().unwrap();
        let store = TempDir::new().unwrap();
        let agents = TempDir::new().unwrap();
        let docs = TempDir::new().unwrap();
        write_bundled_agent(store.path(), "demo", "1.0.0", "v1");
        write_catalog(store.path(), "demo", "1.0.0", "hash-v1");
        std::env::set_var("HOUSTON_STORE_DIR", store.path());
        install_bundled_agent(agents.path(), "demo", Some("demo")).unwrap();

        let ws = workspaces::create(
            docs.path(),
            CreateWorkspace {
                name: "Acme".into(),
                provider: None,
                model: None,
            },
        )
        .unwrap();
        agents_crud::create(
            docs.path(),
            &ws.id,
            CreateAgent {
                name: "Ops".into(),
                config_id: "demo".into(),
                color: None,
                claude_md: None,
                installed_path: Some(agents.path().join("demo").to_string_lossy().to_string()),
                seeds: None,
                existing_path: None,
            },
        )
        .unwrap();

        let agent_dir = docs.path().join("Acme/Ops");
        let legacy_activity = agent_dir.join(".houston/activity.json");
        let nested_activity = agent_dir.join(".houston/activity/activity.json");
        fs::create_dir_all(nested_activity.parent().unwrap()).unwrap();
        let seeded = r#"[{"id":"seeded","title":"Start anywhere - I'll ask for what I need","description":"No upfront onboarding. Tell me what you want to do.","status":"needs_you"}]"#;
        fs::write(&legacy_activity, seeded).unwrap();
        fs::write(&nested_activity, seeded).unwrap();

        let changed = sync_bundled_agent_instances(docs.path(), agents.path(), "demo").unwrap();

        assert_eq!(changed, 1);
        assert_eq!(fs::read_to_string(&legacy_activity).unwrap(), "[]");
        assert_eq!(fs::read_to_string(&nested_activity).unwrap(), "[]");

        let real_activity =
            r#"[{"id":"real","title":"Real work","description":"Keep this","status":"needs_you"}]"#;
        fs::write(&legacy_activity, real_activity).unwrap();
        fs::write(&nested_activity, real_activity).unwrap();

        let changed = sync_bundled_agent_instances(docs.path(), agents.path(), "demo").unwrap();

        std::env::remove_var("HOUSTON_STORE_DIR");
        assert_eq!(changed, 0);
        assert_eq!(fs::read_to_string(&legacy_activity).unwrap(), real_activity);
        assert_eq!(fs::read_to_string(&nested_activity).unwrap(), real_activity);
    }

    #[test]
    fn bundled_store_skills_parse_with_forms() {
        let store_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../store/agents");
        assert!(
            store_dir.exists(),
            "expected bundled Store agents at {}",
            store_dir.display()
        );

        let mut files = Vec::new();
        collect_skill_files(&store_dir, &mut files);
        assert!(
            files.len() >= 8,
            "expected bundled Store skills under {}",
            store_dir.display()
        );

        for file in &files {
            let (summary, _) = houston_skills::format::parse_file(file)
                .unwrap_or_else(|e| panic!("{} failed to parse: {e}", file.display()));
            assert!(
                !summary.inputs.is_empty(),
                "{} missing form inputs",
                file.display()
            );
            let template = summary
                .prompt_template
                .as_deref()
                .unwrap_or_else(|| panic!("{} missing prompt_template", file.display()));
            let input_names: BTreeSet<_> = summary.inputs.iter().map(|input| &input.name).collect();
            for placeholder in template_placeholders(template) {
                assert!(
                    input_names.contains(&placeholder),
                    "{} template references undeclared input {{{{{}}}}}",
                    file.display(),
                    placeholder
                );
            }
        }
    }

    #[test]
    fn bundled_store_agents_do_not_seed_activity_cards() {
        let store_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../store/agents");
        assert!(
            store_dir.exists(),
            "expected bundled Store agents at {}",
            store_dir.display()
        );

        let entries = fs::read_dir(&store_dir).unwrap_or_else(|e| {
            panic!("failed to read {}: {e}", store_dir.display());
        });
        for entry in entries.flatten() {
            let manifest_path = entry.path().join("houston.json");
            if !manifest_path.exists() {
                continue;
            }
            let body = fs::read_to_string(&manifest_path).unwrap_or_else(|e| {
                panic!("failed to read {}: {e}", manifest_path.display());
            });
            let manifest: serde_json::Value = serde_json::from_str(&body).unwrap_or_else(|e| {
                panic!("failed to parse {}: {e}", manifest_path.display());
            });
            let Some(seeds) = manifest
                .get("agentSeeds")
                .and_then(|value| value.as_object())
            else {
                continue;
            };
            assert!(
                !seeds.contains_key(".houston/activity.json"),
                "{} must not seed legacy activity cards",
                manifest_path.display()
            );
            assert!(
                !seeds.contains_key(".houston/activity/activity.json"),
                "{} must not seed activity cards",
                manifest_path.display()
            );
        }
    }

    fn collect_skill_files(dir: &Path, out: &mut Vec<PathBuf>) {
        let entries = fs::read_dir(dir).unwrap_or_else(|e| {
            panic!("failed to read {}: {e}", dir.display());
        });
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                collect_skill_files(&path, out);
            } else if path.file_name().and_then(|name| name.to_str()) == Some("SKILL.md") {
                out.push(path);
            }
        }
    }

    fn template_placeholders(template: &str) -> Vec<String> {
        let mut placeholders = Vec::new();
        let mut rest = template;
        while let Some(start) = rest.find("{{") {
            rest = &rest[start + 2..];
            let Some(end) = rest.find("}}") else {
                break;
            };
            let name = rest[..end].trim();
            if !name.is_empty() {
                placeholders.push(name.to_string());
            }
            rest = &rest[end + 2..];
        }
        placeholders
    }
}
