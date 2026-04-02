use keel_tauri::keel_memory::{Memory, MemoryCategory, MemoryQuery, MemoryStore};
use tauri::State;

#[tauri::command]
pub async fn list_memories(
    store: State<'_, MemoryStore>,
    project_id: String,
) -> Result<Vec<Memory>, String> {
    store
        .list_by_project(&project_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_memory(
    store: State<'_, MemoryStore>,
    project_id: String,
    content: String,
    category: String,
    tags: Vec<String>,
) -> Result<Memory, String> {
    let cat: MemoryCategory = category.parse().map_err(|e: anyhow::Error| e.to_string())?;
    store
        .create(&project_id, &content, cat, "user", tags)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_memory(
    store: State<'_, MemoryStore>,
    memory_id: String,
) -> Result<(), String> {
    store.delete(&memory_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_memories(
    store: State<'_, MemoryStore>,
    project_id: String,
    query: String,
) -> Result<Vec<Memory>, String> {
    store
        .search(MemoryQuery {
            project_id: Some(project_id),
            search_text: Some(query),
            ..Default::default()
        })
        .await
        .map_err(|e| e.to_string())
}
