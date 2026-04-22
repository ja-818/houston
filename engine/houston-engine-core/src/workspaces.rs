//! Workspace CRUD — relocated from `app/src-tauri/src/commands/workspaces.rs`.
//!
//! Transport-neutral: operates on a filesystem root. HTTP routes call these
//! functions; so do tests and CLI tools.

use crate::error::{CoreError, CoreResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub is_default: bool,
    pub created_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provider: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorkspace {
    pub name: String,
    pub provider: Option<String>,
    pub model: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProvider {
    pub provider: String,
    pub model: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RenameWorkspace {
    pub new_name: String,
}

fn json_path(root: &Path) -> PathBuf {
    root.join("workspaces.json")
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

pub fn read_all(root: &Path) -> CoreResult<Vec<Workspace>> {
    let path = json_path(root);
    if !path.exists() {
        return Ok(Vec::new());
    }
    let contents = fs::read_to_string(&path)?;
    serde_json::from_str(&contents).map_err(Into::into)
}

fn write_all(root: &Path, workspaces: &[Workspace]) -> CoreResult<()> {
    let target = json_path(root);
    let tmp = root.join("workspaces.json.tmp");
    fs::create_dir_all(root)?;
    let json = serde_json::to_string_pretty(workspaces)?;
    fs::write(&tmp, &json)?;
    fs::rename(&tmp, &target)?;
    Ok(())
}

pub fn list(root: &Path) -> CoreResult<Vec<Workspace>> {
    fs::create_dir_all(root)?;
    read_all(root)
}

pub fn create(root: &Path, req: CreateWorkspace) -> CoreResult<Workspace> {
    let mut workspaces = read_all(root)?;
    if workspaces.iter().any(|w| w.name == req.name) {
        return Err(CoreError::Conflict(format!(
            "workspace named {:?} already exists",
            req.name
        )));
    }
    let ws = Workspace {
        id: Uuid::new_v4().to_string(),
        name: req.name.clone(),
        is_default: false,
        created_at: now_iso(),
        provider: req.provider,
        model: req.model,
    };
    let ws_dir = root.join(&req.name);
    fs::create_dir_all(ws_dir.join(".houston"))?;
    let connections = ws_dir.join(".houston").join("connections.json");
    if !connections.exists() {
        fs::write(&connections, "[]")?;
    }
    workspaces.push(ws.clone());
    write_all(root, &workspaces)?;
    Ok(ws)
}

pub fn rename(root: &Path, id: &str, req: RenameWorkspace) -> CoreResult<Workspace> {
    let mut workspaces = read_all(root)?;
    if workspaces.iter().any(|w| w.name == req.new_name && w.id != id) {
        return Err(CoreError::Conflict(format!(
            "workspace named {:?} already exists",
            req.new_name
        )));
    }
    let ws = workspaces
        .iter_mut()
        .find(|w| w.id == id)
        .ok_or_else(|| CoreError::NotFound(format!("workspace {id}")))?;
    let old_dir = root.join(&ws.name);
    let new_dir = root.join(&req.new_name);
    if new_dir.exists() && old_dir != new_dir {
        return Err(CoreError::Conflict(format!(
            "directory named {:?} already exists",
            req.new_name
        )));
    }
    if old_dir.exists() {
        fs::rename(&old_dir, &new_dir)?;
    }
    ws.name = req.new_name;
    let updated = ws.clone();
    write_all(root, &workspaces)?;
    Ok(updated)
}

pub fn delete(root: &Path, id: &str) -> CoreResult<()> {
    let workspaces = read_all(root)?;
    let ws = workspaces
        .iter()
        .find(|w| w.id == id)
        .ok_or_else(|| CoreError::NotFound(format!("workspace {id}")))?;
    if ws.is_default {
        return Err(CoreError::BadRequest(
            "cannot delete the default workspace".into(),
        ));
    }
    let ws_dir = root.join(&ws.name);
    let remaining: Vec<Workspace> = workspaces.iter().filter(|w| w.id != id).cloned().collect();
    write_all(root, &remaining)?;
    if ws_dir.exists() {
        fs::remove_dir_all(&ws_dir)?;
    }
    Ok(())
}

pub fn update_provider(root: &Path, id: &str, req: UpdateProvider) -> CoreResult<Workspace> {
    let mut workspaces = read_all(root)?;
    let ws = workspaces
        .iter_mut()
        .find(|w| w.id == id)
        .ok_or_else(|| CoreError::NotFound(format!("workspace {id}")))?;
    ws.provider = Some(req.provider);
    if let Some(m) = req.model {
        ws.model = Some(m);
    }
    let updated = ws.clone();
    write_all(root, &workspaces)?;
    Ok(updated)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn tmp() -> TempDir {
        TempDir::new().unwrap()
    }

    #[test]
    fn list_empty() {
        let d = tmp();
        assert!(list(d.path()).unwrap().is_empty());
    }

    #[test]
    fn create_then_list() {
        let d = tmp();
        let ws = create(
            d.path(),
            CreateWorkspace {
                name: "alpha".into(),
                provider: Some("anthropic".into()),
                model: None,
            },
        )
        .unwrap();
        assert_eq!(ws.name, "alpha");
        let all = list(d.path()).unwrap();
        assert_eq!(all.len(), 1);
        assert!(d.path().join("alpha/.houston/connections.json").exists());
    }

    #[test]
    fn create_duplicate_conflicts() {
        let d = tmp();
        create(d.path(), CreateWorkspace { name: "a".into(), provider: None, model: None }).unwrap();
        let err = create(d.path(), CreateWorkspace { name: "a".into(), provider: None, model: None }).unwrap_err();
        assert!(matches!(err, CoreError::Conflict(_)));
    }

    #[test]
    fn rename_and_delete() {
        let d = tmp();
        let ws = create(d.path(), CreateWorkspace { name: "a".into(), provider: None, model: None }).unwrap();
        let renamed = rename(d.path(), &ws.id, RenameWorkspace { new_name: "b".into() }).unwrap();
        assert_eq!(renamed.name, "b");
        delete(d.path(), &ws.id).unwrap();
        assert!(list(d.path()).unwrap().is_empty());
    }
}
