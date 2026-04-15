use houston_tauri::events::HoustonEvent;
use houston_tauri::paths::expand_tilde;
use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::Emitter;

#[derive(Serialize)]
pub struct SkillSummaryResponse {
    pub name: String,
    pub description: String,
    pub version: u32,
    pub tags: Vec<String>,
    pub created: Option<String>,
    pub last_used: Option<String>,
}

#[derive(Serialize)]
pub struct SkillDetailResponse {
    pub name: String,
    pub description: String,
    pub version: u32,
    pub content: String,
}

fn skills_dir(workspace_path: &str) -> PathBuf {
    expand_tilde(&PathBuf::from(workspace_path)).join(".agents/skills")
}

/// Create a `.claude/skills/{name}` symlink pointing to `../../.agents/skills/{name}`.
/// Matches skill.sh convention so Claude Code can discover the skill.
fn ensure_claude_symlink(workspace_path: &str, skill_name: &str) {
    let root = expand_tilde(&PathBuf::from(workspace_path));
    let claude_skills = root.join(".claude/skills");
    let _ = std::fs::create_dir_all(&claude_skills);
    let link = claude_skills.join(skill_name);
    if !link.exists() {
        let target = Path::new("../../.agents/skills").join(skill_name);
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink(&target, &link);
    }
}

/// Remove a `.claude/skills/{name}` symlink.
fn remove_claude_symlink(workspace_path: &str, skill_name: &str) {
    let root = expand_tilde(&PathBuf::from(workspace_path));
    let link = root.join(".claude/skills").join(skill_name);
    if link.symlink_metadata().is_ok() {
        let _ = std::fs::remove_file(&link);
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_skills(workspace_path: String) -> Result<Vec<SkillSummaryResponse>, String> {
    let dir = skills_dir(&workspace_path);
    let summaries = houston_skills::list_skills(&dir).map_err(|e| e.to_string())?;
    // Keep `.claude/skills/<name>` symlinks in sync with the canonical
    // `.agents/skills/<name>` directories so Claude Code can discover skills
    // natively. Idempotent — only creates missing links.
    for summary in &summaries {
        ensure_claude_symlink(&workspace_path, &summary.name);
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

#[tauri::command(rename_all = "snake_case")]
pub async fn load_skill(
    workspace_path: String,
    name: String,
) -> Result<SkillDetailResponse, String> {
    let dir = skills_dir(&workspace_path);
    let skill = houston_skills::load_skill(&dir, &name).map_err(|e| e.to_string())?;
    Ok(SkillDetailResponse {
        name: skill.summary.name,
        description: skill.summary.description,
        version: skill.summary.version,
        content: skill.content,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_skill(
    app_handle: tauri::AppHandle,
    workspace_path: String,
    name: String,
    description: String,
    content: String,
) -> Result<(), String> {
    let dir = skills_dir(&workspace_path);
    std::fs::create_dir_all(&dir).map_err(|e| format!("Failed to create skills dir: {e}"))?;
    houston_skills::create_skill(
        &dir,
        houston_skills::CreateSkillInput {
            name: name.clone(),
            description,
            content,
            tags: vec![],
        },
    )
    .map_err(|e| e.to_string())?;
    ensure_claude_symlink(&workspace_path, &name);
    let _ = app_handle.emit("houston-event", HoustonEvent::SkillsChanged {
        agent_path: workspace_path.clone(),
    });
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_skill(
    app_handle: tauri::AppHandle,
    workspace_path: String,
    name: String,
) -> Result<(), String> {
    let dir = skills_dir(&workspace_path);
    houston_skills::delete_skill(&dir, &name).map_err(|e| e.to_string())?;
    // Always clean up the symlink — the agent may have deleted the source
    // but left the symlink, or vice versa.
    remove_claude_symlink(&workspace_path, &name);
    let _ = app_handle.emit("houston-event", HoustonEvent::SkillsChanged {
        agent_path: workspace_path.clone(),
    });
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn save_skill(
    app_handle: tauri::AppHandle,
    workspace_path: String,
    name: String,
    content: String,
) -> Result<(), String> {
    let dir = skills_dir(&workspace_path);
    houston_skills::edit_skill(&dir, &name, &content).map_err(|e| e.to_string())?;
    let _ = app_handle.emit("houston-event", HoustonEvent::SkillsChanged {
        agent_path: workspace_path.clone(),
    });
    Ok(())
}

#[derive(serde::Deserialize)]
pub struct RepoSkillInput {
    pub id: String,
    pub name: String,
    pub description: String,
    pub path: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_skills_from_repo(
    source: String,
) -> Result<Vec<houston_skills::remote::RepoSkill>, String> {
    houston_skills::remote::list_skills_from_repo(&source)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn install_skills_from_repo(
    app_handle: tauri::AppHandle,
    workspace_path: String,
    source: String,
    skills: Vec<RepoSkillInput>,
) -> Result<Vec<String>, String> {
    let dir = skills_dir(&workspace_path);
    let repo_skills: Vec<houston_skills::remote::RepoSkill> = skills
        .into_iter()
        .map(|s| houston_skills::remote::RepoSkill {
            id: s.id,
            name: s.name,
            description: s.description,
            path: s.path,
        })
        .collect();
    let result = houston_skills::remote::install_from_repo(&dir, &source, &repo_skills)
        .await
        .map_err(|e| e.to_string())?;
    for name in &result {
        ensure_claude_symlink(&workspace_path, name);
    }
    let _ = app_handle.emit("houston-event", HoustonEvent::SkillsChanged {
        agent_path: workspace_path.clone(),
    });
    Ok(result)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn search_community_skills(
    query: String,
) -> Result<Vec<houston_skills::remote::CommunitySkill>, String> {
    houston_skills::remote::search_skills(&query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn install_community_skill(
    app_handle: tauri::AppHandle,
    workspace_path: String,
    source: String,
    skill_id: String,
) -> Result<String, String> {
    let dir = skills_dir(&workspace_path);
    let result = houston_skills::remote::install_skill(&dir, &source, &skill_id)
        .await
        .map_err(|e| e.to_string())?;
    ensure_claude_symlink(&workspace_path, &result);
    let _ = app_handle.emit("houston-event", HoustonEvent::SkillsChanged {
        agent_path: workspace_path.clone(),
    });
    Ok(result)
}
