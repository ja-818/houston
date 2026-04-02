use keel_tauri::state::AppState;
use tauri::State;

/// List all configured channels from the channels table.
/// Returns an empty list if the table does not exist yet.
#[tauri::command]
pub async fn list_channels(
    state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    let rows = state
        .db
        .conn()
        .query(
            "SELECT id, channel_type, name, status, config, created_at \
             FROM channels ORDER BY created_at DESC",
            libsql::params![],
        )
        .await;

    match rows {
        Ok(mut rows) => {
            let mut results = Vec::new();
            while let Ok(Some(row)) = rows.next().await {
                let entry = serde_json::json!({
                    "id": row.get::<String>(0).unwrap_or_default(),
                    "channel_type": row.get::<String>(1).unwrap_or_default(),
                    "name": row.get::<String>(2).unwrap_or_default(),
                    "status": row.get::<String>(3).unwrap_or_default(),
                    "config": row.get::<String>(4).unwrap_or_default(),
                    "created_at": row.get::<String>(5).unwrap_or_default(),
                });
                results.push(entry);
            }
            Ok(results)
        }
        Err(_) => Ok(Vec::new()),
    }
}

#[tauri::command]
pub async fn add_channel(
    state: State<'_, AppState>,
    channel_type: String,
    name: String,
    config: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let config_str = serde_json::to_string(&config).map_err(|e| e.to_string())?;

    state
        .db
        .conn()
        .execute(
            "INSERT INTO channels (id, channel_type, name, status, config, created_at) \
             VALUES (?1, ?2, ?3, 'disconnected', ?4, ?5)",
            [&id, &channel_type, &name, &config_str, &now],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "id": id,
        "channel_type": channel_type,
        "name": name,
        "status": "disconnected",
        "config": config_str,
        "created_at": now,
    }))
}

#[tauri::command]
pub async fn remove_channel(
    state: State<'_, AppState>,
    channel_id: String,
) -> Result<(), String> {
    state
        .db
        .conn()
        .execute("DELETE FROM channels WHERE id = ?1", [&channel_id])
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn connect_channel(
    state: State<'_, AppState>,
    channel_id: String,
) -> Result<(), String> {
    state
        .db
        .conn()
        .execute(
            "UPDATE channels SET status = 'connecting' WHERE id = ?1",
            [&channel_id],
        )
        .await
        .map_err(|e| e.to_string())?;
    // Actual connection logic would be handled by a background task.
    Ok(())
}

#[tauri::command]
pub async fn disconnect_channel(
    state: State<'_, AppState>,
    channel_id: String,
) -> Result<(), String> {
    state
        .db
        .conn()
        .execute(
            "UPDATE channels SET status = 'disconnected' WHERE id = ?1",
            [&channel_id],
        )
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
