use houston_tauri::paths::expand_tilde;
use serde::Serialize;
use std::path::PathBuf;

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
    expand_tilde(&PathBuf::from(workspace_path)).join(".houston/skills")
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_skills(workspace_path: String) -> Result<Vec<SkillSummaryResponse>, String> {
    let dir = skills_dir(&workspace_path);
    let summaries = houston_skills::list_skills(&dir).map_err(|e| e.to_string())?;
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
            name,
            description,
            content,
            tags: vec![],
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_skill(workspace_path: String, name: String) -> Result<(), String> {
    let dir = skills_dir(&workspace_path);
    houston_skills::delete_skill(&dir, &name).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn save_skill(
    workspace_path: String,
    name: String,
    content: String,
) -> Result<(), String> {
    let dir = skills_dir(&workspace_path);
    houston_skills::edit_skill(&dir, &name, &content).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn install_skills_from_repo(
    workspace_path: String,
    source: String,
) -> Result<Vec<String>, String> {
    let dir = skills_dir(&workspace_path);
    houston_skills::remote::install_from_repo(&dir, &source)
        .await
        .map_err(|e| e.to_string())
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
    workspace_path: String,
    source: String,
    skill_id: String,
) -> Result<String, String> {
    let dir = skills_dir(&workspace_path);
    houston_skills::remote::install_skill(&dir, &source, &skill_id)
        .await
        .map_err(|e| e.to_string())
}
