use anyhow::Result;
use clap::Subcommand;
use keel_db::Database;
use serde_json::{json, Value};

#[derive(Subcommand)]
pub enum RoutineAction {
    /// Create a new routine
    Create {
        /// Project ID
        #[arg(long)]
        project_id: String,
        /// Routine name
        #[arg(long)]
        name: String,
        /// Trigger type: manual, daily, weekly, on_change
        #[arg(long)]
        trigger: String,
        /// Description / prompt for the execution agent
        #[arg(long)]
        description: Option<String>,
        /// JSON trigger configuration
        #[arg(long)]
        trigger_config: Option<String>,
    },
    /// List routines for a project
    List {
        /// Project ID
        #[arg(long)]
        project_id: String,
    },
    /// Update an existing routine
    Update {
        /// Routine ID
        id: String,
        /// New name
        #[arg(long)]
        name: Option<String>,
        /// New trigger type
        #[arg(long)]
        trigger: Option<String>,
        /// New description
        #[arg(long)]
        description: Option<String>,
        /// New trigger config JSON
        #[arg(long)]
        trigger_config: Option<String>,
        /// New status: active, paused, archived
        #[arg(long)]
        status: Option<String>,
    },
    /// Delete a routine
    Delete {
        /// Routine ID
        id: String,
    },
    /// Pause a routine
    Pause {
        /// Routine ID
        id: String,
    },
    /// Resume a paused routine
    Resume {
        /// Routine ID
        id: String,
    },
    /// Show run history for a routine
    History {
        /// Routine ID
        id: String,
        /// Maximum number of runs to show (default: 10)
        #[arg(long, default_value = "10")]
        limit: i64,
    },
    /// Start a new run for a routine
    Run {
        /// Routine ID
        id: String,
    },
}

pub async fn run(
    db: &Database,
    _global_project_id: Option<&str>,
    action: RoutineAction,
) -> Result<Value> {
    match action {
        RoutineAction::Create {
            project_id,
            name,
            trigger,
            description,
            trigger_config,
        } => {
            create(
                db,
                &project_id,
                &name,
                &trigger,
                description.as_deref(),
                trigger_config.as_deref(),
            )
            .await
        }
        RoutineAction::List { project_id } => list(db, &project_id).await,
        RoutineAction::Update {
            id,
            name,
            trigger,
            description,
            trigger_config,
            status,
        } => {
            update(
                db, &id, name, description, trigger, trigger_config, status,
            )
            .await
        }
        RoutineAction::Delete { id } => delete(db, &id).await,
        RoutineAction::Pause { id } => {
            crate::routine_ops::pause(db, &id).await
        }
        RoutineAction::Resume { id } => {
            crate::routine_ops::resume(db, &id).await
        }
        RoutineAction::History { id, limit } => {
            crate::routine_ops::history(db, &id, limit).await
        }
        RoutineAction::Run { id } => {
            crate::routine_ops::start_run(db, &id).await
        }
    }
}

async fn create(
    db: &Database,
    project_id: &str,
    name: &str,
    trigger_type: &str,
    description: Option<&str>,
    trigger_config: Option<&str>,
) -> Result<Value> {
    let id = uuid::Uuid::new_v4().to_string();
    let routine = db
        .create_routine(
            &id,
            project_id,
            name,
            description.unwrap_or(""),
            trigger_type,
            trigger_config.unwrap_or("{}"),
        )
        .await?;

    Ok(routine_to_json(&routine))
}

async fn list(db: &Database, project_id: &str) -> Result<Value> {
    let routines = db.list_routines(project_id).await?;
    let items: Vec<Value> = routines.iter().map(routine_to_json).collect();
    Ok(json!(items))
}

async fn update(
    db: &Database,
    routine_id: &str,
    name: Option<String>,
    description: Option<String>,
    trigger_type: Option<String>,
    trigger_config: Option<String>,
    status: Option<String>,
) -> Result<Value> {
    let existing = db
        .get_routine(routine_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Routine not found: {routine_id}"))?;

    let new_name = name.as_deref().unwrap_or(&existing.name);
    let new_desc = description.as_deref().unwrap_or(&existing.description);
    let new_trigger = trigger_type.as_deref().unwrap_or(&existing.trigger_type);
    let new_config = trigger_config
        .as_deref()
        .unwrap_or(&existing.trigger_config);
    let new_status = status.as_deref().unwrap_or(&existing.status);

    db.update_routine(
        routine_id, new_name, new_desc, new_trigger, new_config, new_status,
    )
    .await?;

    let updated = db
        .get_routine(routine_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Routine disappeared after update"))?;

    Ok(routine_to_json(&updated))
}

async fn delete(db: &Database, routine_id: &str) -> Result<Value> {
    let existing = db
        .get_routine(routine_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Routine not found: {routine_id}"))?;

    db.delete_routine(routine_id).await?;

    Ok(json!({
        "deleted": true,
        "id": existing.id,
        "name": existing.name,
    }))
}

pub(crate) fn routine_to_json(r: &keel_db::Routine) -> Value {
    let approval_rate = if r.run_count > 0 {
        format!(
            "{:.0}%",
            (r.approval_count as f64 / r.run_count as f64) * 100.0
        )
    } else {
        "n/a".into()
    };

    json!({
        "id": r.id,
        "project_id": r.project_id,
        "name": r.name,
        "description": r.description,
        "trigger_type": r.trigger_type,
        "trigger_config": r.trigger_config,
        "status": r.status,
        "run_count": r.run_count,
        "approval_count": r.approval_count,
        "approval_rate": approval_rate,
        "created_at": r.created_at,
        "updated_at": r.updated_at,
    })
}
