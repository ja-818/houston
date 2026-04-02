use keel_tauri::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn add_heartbeat(
    state: State<'_, AppState>,
    config: serde_json::Value,
) -> Result<String, String> {
    let scheduler = state
        .scheduler
        .as_ref()
        .ok_or_else(|| "Scheduler not initialized".to_string())?;

    let hb_config: keel_scheduler::HeartbeatConfig =
        serde_json::from_value(config).map_err(|e| e.to_string())?;

    let mut sched = scheduler.lock().await;
    let id = sched.add_heartbeat(hb_config);
    Ok(id)
}

#[tauri::command]
pub async fn remove_heartbeat(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let scheduler = state
        .scheduler
        .as_ref()
        .ok_or_else(|| "Scheduler not initialized".to_string())?;

    let mut sched = scheduler.lock().await;
    sched.remove_heartbeat(&id);
    Ok(())
}

#[tauri::command]
pub async fn add_cron(
    state: State<'_, AppState>,
    config: serde_json::Value,
) -> Result<String, String> {
    let scheduler = state
        .scheduler
        .as_ref()
        .ok_or_else(|| "Scheduler not initialized".to_string())?;

    let cron_config: keel_scheduler::CronJobConfig =
        serde_json::from_value(config).map_err(|e| e.to_string())?;

    let mut sched = scheduler.lock().await;
    sched.add_cron(cron_config).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_cron(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let scheduler = state
        .scheduler
        .as_ref()
        .ok_or_else(|| "Scheduler not initialized".to_string())?;

    let mut sched = scheduler.lock().await;
    sched.remove_cron(&id);
    Ok(())
}
