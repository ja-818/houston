//! Skills CRUD + remote install — relocated from
//! `app/src-tauri/src/commands/skills.rs`.
//!
//! Transport-neutral: every function takes a workspace path (the agent's
//! on-disk root) plus, where mutations happen, a `DynEventSink` so that
//! HTTP routes, CLI tools, and the Tauri adapter all emit the same
//! `HoustonEvent::SkillsChanged` stream.

use crate::error::{CoreError, CoreResult};
use houston_skills::{
    self,
    remote::{CommunitySkill, RepoSkill},
    CreateSkillInput, SkillError,
};
use houston_ui_events::{DynEventSink, HoustonEvent};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

// ── DTOs ───────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SkillSummaryResponse {
    pub name: String,
    pub description: String,
    pub version: u32,
    pub tags: Vec<String>,
    pub created: Option<String>,
    pub last_used: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SkillDetailResponse {
    pub name: String,
    pub description: String,
    pub version: u32,
    pub content: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateSkillRequest {
    pub workspace_path: String,
    pub name: String,
    pub description: String,
    pub content: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SaveSkillRequest {
    pub workspace_path: String,
    pub content: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RepoSkillInput {
    pub id: String,
    pub name: String,
    pub description: String,
    pub path: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct InstallFromRepoRequest {
    pub workspace_path: String,
    pub source: String,
    pub skills: Vec<RepoSkillInput>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct InstallCommunityRequest {
    pub workspace_path: String,
    pub source: String,
    pub skill_id: String,
}

// ── Error mapping ──────────────────────────────────────────────────

impl From<SkillError> for CoreError {
    fn from(err: SkillError) -> Self {
        match err {
            SkillError::NotFound(s) => CoreError::NotFound(s),
            SkillError::AlreadyExists(s) => CoreError::Conflict(s),
            SkillError::Validation(s) => CoreError::BadRequest(s),
            SkillError::Parse(s) => CoreError::BadRequest(s),
            SkillError::PatchNotFound => {
                CoreError::BadRequest("patch target not found".into())
            }
            SkillError::Io(s) => CoreError::Internal(s),
        }
    }
}

// ── Helpers ────────────────────────────────────────────────────────

fn expand_tilde(path: &Path) -> PathBuf {
    if path.starts_with("~") {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home).join(path.strip_prefix("~").unwrap_or(path));
        }
    }
    path.to_path_buf()
}

fn skills_dir(workspace_path: &str) -> PathBuf {
    expand_tilde(&PathBuf::from(workspace_path)).join(".agents/skills")
}

/// Create `.claude/skills/{name}` → `../../.agents/skills/{name}` symlink
/// so Claude Code discovers skills natively. Idempotent.
fn ensure_claude_symlink(workspace_path: &str, skill_name: &str) {
    let root = expand_tilde(&PathBuf::from(workspace_path));
    let claude_skills = root.join(".claude/skills");
    let _ = std::fs::create_dir_all(&claude_skills);
    let link = claude_skills.join(skill_name);
    if !link.exists() {
        let target = Path::new("../../.agents/skills").join(skill_name);
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink(&target, &link);
        #[cfg(not(unix))]
        let _ = target;
    }
}

fn remove_claude_symlink(workspace_path: &str, skill_name: &str) {
    let root = expand_tilde(&PathBuf::from(workspace_path));
    let link = root.join(".claude/skills").join(skill_name);
    if link.symlink_metadata().is_ok() {
        let _ = std::fs::remove_file(&link);
    }
}

fn emit_skills_changed(events: &DynEventSink, workspace_path: &str) {
    events.emit(HoustonEvent::SkillsChanged {
        agent_path: workspace_path.to_string(),
    });
}

// ── Public API ─────────────────────────────────────────────────────

pub fn list(workspace_path: &str) -> CoreResult<Vec<SkillSummaryResponse>> {
    let dir = skills_dir(workspace_path);
    let summaries = houston_skills::list_skills(&dir)?;
    for s in &summaries {
        ensure_claude_symlink(workspace_path, &s.name);
    }
    Ok(summaries
        .into_iter()
        .map(|s| SkillSummaryResponse {
            name: s.name,
            description: s.description,
            version: s.version,
            tags: s.tags,
            created: s.created,
            last_used: s.last_used,
        })
        .collect())
}

pub fn load(workspace_path: &str, name: &str) -> CoreResult<SkillDetailResponse> {
    let dir = skills_dir(workspace_path);
    let skill = houston_skills::load_skill(&dir, name)?;
    Ok(SkillDetailResponse {
        name: skill.summary.name,
        description: skill.summary.description,
        version: skill.summary.version,
        content: skill.content,
    })
}

pub fn create(events: &DynEventSink, req: CreateSkillRequest) -> CoreResult<()> {
    let dir = skills_dir(&req.workspace_path);
    std::fs::create_dir_all(&dir)?;
    houston_skills::create_skill(
        &dir,
        CreateSkillInput {
            name: req.name.clone(),
            description: req.description,
            content: req.content,
            tags: vec![],
        },
    )?;
    ensure_claude_symlink(&req.workspace_path, &req.name);
    emit_skills_changed(events, &req.workspace_path);
    Ok(())
}

pub fn delete(events: &DynEventSink, workspace_path: &str, name: &str) -> CoreResult<()> {
    let dir = skills_dir(workspace_path);
    houston_skills::delete_skill(&dir, name)?;
    remove_claude_symlink(workspace_path, name);
    emit_skills_changed(events, workspace_path);
    Ok(())
}

pub fn save(events: &DynEventSink, name: &str, req: SaveSkillRequest) -> CoreResult<()> {
    let dir = skills_dir(&req.workspace_path);
    houston_skills::edit_skill(&dir, name, &req.content)?;
    emit_skills_changed(events, &req.workspace_path);
    Ok(())
}

pub async fn list_from_repo(source: &str) -> CoreResult<Vec<RepoSkill>> {
    houston_skills::remote::list_skills_from_repo(source)
        .await
        .map_err(Into::into)
}

pub async fn install_from_repo(
    events: &DynEventSink,
    req: InstallFromRepoRequest,
) -> CoreResult<Vec<String>> {
    let dir = skills_dir(&req.workspace_path);
    let repo_skills: Vec<RepoSkill> = req
        .skills
        .into_iter()
        .map(|s| RepoSkill {
            id: s.id,
            name: s.name,
            description: s.description,
            path: s.path,
        })
        .collect();
    let names = houston_skills::remote::install_from_repo(&dir, &req.source, &repo_skills).await?;
    for n in &names {
        ensure_claude_symlink(&req.workspace_path, n);
    }
    emit_skills_changed(events, &req.workspace_path);
    Ok(names)
}

pub async fn search_community(query: &str) -> CoreResult<Vec<CommunitySkill>> {
    houston_skills::remote::search_skills(query)
        .await
        .map_err(Into::into)
}

pub async fn install_community(
    events: &DynEventSink,
    req: InstallCommunityRequest,
) -> CoreResult<String> {
    let dir = skills_dir(&req.workspace_path);
    let name = houston_skills::remote::install_skill(&dir, &req.source, &req.skill_id).await?;
    ensure_claude_symlink(&req.workspace_path, &name);
    emit_skills_changed(events, &req.workspace_path);
    Ok(name)
}

#[cfg(test)]
mod tests {
    use super::*;
    use houston_ui_events::{BroadcastEventSink, DynEventSink};
    use std::sync::Arc;
    use tempfile::TempDir;

    fn sink() -> (DynEventSink, BroadcastEventSink) {
        let b = BroadcastEventSink::new(16);
        (Arc::new(b.clone()), b)
    }

    #[test]
    fn list_empty_when_missing() {
        let d = TempDir::new().unwrap();
        let ws = d.path().to_string_lossy().to_string();
        assert!(list(&ws).unwrap().is_empty());
    }

    #[tokio::test]
    async fn create_then_list_and_load() {
        let d = TempDir::new().unwrap();
        let ws = d.path().to_string_lossy().to_string();
        let (events, bcast) = sink();
        let mut rx = bcast.subscribe();

        create(
            &events,
            CreateSkillRequest {
                workspace_path: ws.clone(),
                name: "my-skill".into(),
                description: "Test".into(),
                content: "## Procedure\n\n1. Do stuff\n".into(),
            },
        )
        .unwrap();

        let ev = rx.recv().await.expect("SkillsChanged event");
        matches!(ev, HoustonEvent::SkillsChanged { .. });

        let all = list(&ws).unwrap();
        assert_eq!(all.len(), 1);
        assert_eq!(all[0].name, "my-skill");
        assert_eq!(all[0].version, 1);

        let loaded = load(&ws, "my-skill").unwrap();
        assert!(loaded.content.contains("Do stuff"));

        assert!(d.path().join(".claude/skills/my-skill").symlink_metadata().is_ok());
    }

    #[test]
    fn create_duplicate_conflicts() {
        let d = TempDir::new().unwrap();
        let ws = d.path().to_string_lossy().to_string();
        let (events, _) = sink();
        create(
            &events,
            CreateSkillRequest {
                workspace_path: ws.clone(),
                name: "dup".into(),
                description: "".into(),
                content: "body".into(),
            },
        )
        .unwrap();
        let err = create(
            &events,
            CreateSkillRequest {
                workspace_path: ws.clone(),
                name: "dup".into(),
                description: "".into(),
                content: "body".into(),
            },
        )
        .unwrap_err();
        assert!(matches!(err, CoreError::Conflict(_)));
    }

    #[test]
    fn save_increments_version_and_emits() {
        let d = TempDir::new().unwrap();
        let ws = d.path().to_string_lossy().to_string();
        let (events, _) = sink();
        create(
            &events,
            CreateSkillRequest {
                workspace_path: ws.clone(),
                name: "editable".into(),
                description: "".into(),
                content: "v1".into(),
            },
        )
        .unwrap();
        save(
            &events,
            "editable",
            SaveSkillRequest {
                workspace_path: ws.clone(),
                content: "v2".into(),
            },
        )
        .unwrap();
        let s = load(&ws, "editable").unwrap();
        assert_eq!(s.version, 2);
        assert!(s.content.contains("v2"));
    }

    #[test]
    fn delete_removes_symlink_and_dir() {
        let d = TempDir::new().unwrap();
        let ws = d.path().to_string_lossy().to_string();
        let (events, _) = sink();
        create(
            &events,
            CreateSkillRequest {
                workspace_path: ws.clone(),
                name: "gone".into(),
                description: "".into(),
                content: "body".into(),
            },
        )
        .unwrap();
        assert!(d.path().join(".claude/skills/gone").symlink_metadata().is_ok());
        delete(&events, &ws, "gone").unwrap();
        assert!(!d.path().join(".agents/skills/gone").exists());
        assert!(d.path().join(".claude/skills/gone").symlink_metadata().is_err());
    }

    #[test]
    fn load_missing_is_not_found() {
        let d = TempDir::new().unwrap();
        let ws = d.path().to_string_lossy().to_string();
        let err = load(&ws, "nope").unwrap_err();
        assert!(matches!(err, CoreError::NotFound(_)));
    }
}
