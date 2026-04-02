use keel_tauri::state::AppState;
use tauri::State;

/// List recent events from the event log table.
/// Falls back to an empty list if the table does not yet exist.
#[tauri::command]
pub async fn list_events(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<serde_json::Value>, String> {
    let rows = state
        .db
        .conn()
        .query(
            "SELECT id, input_type, source_channel, source_identifier, \
                    payload, project_id, created_at \
             FROM event_log WHERE project_id = ?1 \
             ORDER BY created_at DESC LIMIT 100",
            [project_id],
        )
        .await;

    match rows {
        Ok(mut rows) => {
            let mut results = Vec::new();
            while let Ok(Some(row)) = rows.next().await {
                let entry = serde_json::json!({
                    "id": row.get::<String>(0).unwrap_or_default(),
                    "input_type": row.get::<String>(1).unwrap_or_default(),
                    "source_channel": row.get::<String>(2).unwrap_or_default(),
                    "source_identifier": row.get::<String>(3).unwrap_or_default(),
                    "payload": row.get::<String>(4).unwrap_or_default(),
                    "project_id": row.get::<String>(5).unwrap_or_default(),
                    "created_at": row.get::<String>(6).unwrap_or_default(),
                });
                results.push(entry);
            }
            Ok(results)
        }
        // Table may not exist yet in fresh databases.
        Err(_) => Ok(Vec::new()),
    }
}
