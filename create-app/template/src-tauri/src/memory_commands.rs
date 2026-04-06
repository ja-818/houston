use houston_memory::LearningsConfig;
use houston_tauri::paths::expand_tilde;
use serde::Serialize;
use std::path::PathBuf;

#[derive(Serialize)]
pub struct LearningEntryResponse {
    pub index: usize,
    pub text: String,
}

#[derive(Serialize)]
pub struct LearningsResponse {
    pub entries: Vec<LearningEntryResponse>,
    pub chars: usize,
    pub limit: usize,
}

fn memory_dir(workspace_path: &str) -> PathBuf {
    expand_tilde(&PathBuf::from(workspace_path)).join(".houston/memory")
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_learnings(
    workspace_path: String,
) -> Result<LearningsResponse, String> {
    let dir = memory_dir(&workspace_path);
    let config = LearningsConfig::default();
    let data =
        houston_memory::load_learnings(&dir, &config).map_err(|e| e.to_string())?;

    Ok(LearningsResponse {
        entries: data
            .entries
            .into_iter()
            .map(|e| LearningEntryResponse {
                index: e.index,
                text: e.text,
            })
            .collect(),
        chars: data.chars,
        limit: data.limit,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn add_learning(
    workspace_path: String,
    text: String,
) -> Result<(), String> {
    let dir = memory_dir(&workspace_path);
    let config = LearningsConfig::default();
    houston_memory::add_entry(&dir, &text, &config)
        .map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn replace_learning(
    workspace_path: String,
    index: usize,
    text: String,
) -> Result<(), String> {
    let dir = memory_dir(&workspace_path);
    let config = LearningsConfig::default();
    houston_memory::replace_entry(&dir, index, &text, &config)
        .map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn remove_learning(
    workspace_path: String,
    index: usize,
) -> Result<(), String> {
    let dir = memory_dir(&workspace_path);
    houston_memory::remove_entry(&dir, index)
        .map_err(|e| e.to_string())
}
