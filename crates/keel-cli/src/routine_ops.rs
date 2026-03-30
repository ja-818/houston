use anyhow::Result;
use keel_db::Database;
use serde_json::{json, Value};

pub async fn pause(db: &Database, routine_id: &str) -> Result<Value> {
    let existing = db
        .get_routine(routine_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Routine not found: {routine_id}"))?;

    db.update_routine_status(routine_id, "paused").await?;

    Ok(json!({
        "id": existing.id,
        "name": existing.name,
        "status": "paused",
    }))
}

pub async fn resume(db: &Database, routine_id: &str) -> Result<Value> {
    let existing = db
        .get_routine(routine_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Routine not found: {routine_id}"))?;

    db.update_routine_status(routine_id, "active").await?;

    Ok(json!({
        "id": existing.id,
        "name": existing.name,
        "status": "active",
    }))
}

pub async fn history(db: &Database, routine_id: &str, limit: i64) -> Result<Value> {
    // Verify the routine exists.
    let _ = db
        .get_routine(routine_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Routine not found: {routine_id}"))?;

    let runs = db.list_routine_runs(routine_id, limit).await?;
    let items: Vec<Value> = runs
        .iter()
        .map(|r| {
            json!({
                "id": r.id,
                "routine_id": r.routine_id,
                "status": r.status,
                "output_summary": r.output_summary,
                "created_at": r.created_at,
                "completed_at": r.completed_at,
            })
        })
        .collect();
    Ok(json!(items))
}

pub async fn start_run(db: &Database, routine_id: &str) -> Result<Value> {
    let existing = db
        .get_routine(routine_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Routine not found: {routine_id}"))?;

    let run_id = uuid::Uuid::new_v4().to_string();
    db.create_routine_run(&run_id, routine_id).await?;

    Ok(json!({
        "run_id": run_id,
        "routine_id": routine_id,
        "routine_name": existing.name,
        "status": "running",
    }))
}
