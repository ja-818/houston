//! `/v1/routines` + `/v1/routine-runs` REST routes.
//!
//! Routines are agent-scoped. Since agent paths are arbitrary filesystem
//! paths, they're passed as a `?agentPath=` query parameter rather than URL
//! path segments.

use crate::routes::error::ApiError;
use crate::state::ServerState;
use axum::{
    extract::{Path, Query, State},
    routing::{get, patch, post},
    Json, Router,
};
use houston_engine_core::preferences;
use houston_engine_core::routines::{
    self,
    engine_dispatcher::{EngineActivitySurface, EngineRoutineDispatcher},
    runner::run_routine,
    runs as routine_runs,
    types::{NewRoutine, Routine, RoutineRun, RoutineUpdate},
};
use serde::Deserialize;
use std::path::PathBuf;
use std::sync::Arc;

#[derive(Deserialize)]
struct AgentQuery {
    #[serde(rename = "agentPath")]
    agent_path: String,
}

#[derive(Deserialize)]
struct RunsQuery {
    #[serde(rename = "agentPath")]
    agent_path: String,
    #[serde(rename = "routineId", default)]
    routine_id: Option<String>,
}

fn agent_root(p: &str) -> PathBuf {
    PathBuf::from(p)
}

pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route("/routines", get(list).post(create))
        .route("/routines/:id", patch(update).delete(remove))
        .route("/routine-runs", get(list_runs))
        .route("/routine-runs/:id", patch(update_run))
        .route("/routines/:id/runs", post(create_run))
        // Scheduler lifecycle + manual trigger
        .route("/routines/:id/run-now", post(run_now))
        .route("/routines/scheduler/start", post(scheduler_start))
        .route("/routines/scheduler/stop", post(scheduler_stop))
        .route("/routines/scheduler/sync", post(scheduler_sync))
}

async fn list(
    State(_st): State<Arc<ServerState>>,
    Query(q): Query<AgentQuery>,
) -> Result<Json<Vec<Routine>>, ApiError> {
    Ok(Json(routines::list(&agent_root(&q.agent_path))?))
}

async fn create(
    State(st): State<Arc<ServerState>>,
    Query(q): Query<AgentQuery>,
    Json(req): Json<NewRoutine>,
) -> Result<Json<Routine>, ApiError> {
    let r = routines::create(&agent_root(&q.agent_path), req)?;
    st.routine_scheduler.sync_agent(&q.agent_path).await;
    Ok(Json(r))
}

async fn update(
    State(st): State<Arc<ServerState>>,
    Path(id): Path<String>,
    Query(q): Query<AgentQuery>,
    Json(req): Json<RoutineUpdate>,
) -> Result<Json<Routine>, ApiError> {
    let r = routines::update(&agent_root(&q.agent_path), &id, req)?;
    st.routine_scheduler.sync_agent(&q.agent_path).await;
    Ok(Json(r))
}

async fn remove(
    State(st): State<Arc<ServerState>>,
    Path(id): Path<String>,
    Query(q): Query<AgentQuery>,
) -> Result<(), ApiError> {
    routines::delete(&agent_root(&q.agent_path), &id)?;
    st.routine_scheduler.sync_agent(&q.agent_path).await;
    Ok(())
}

async fn list_runs(
    State(_st): State<Arc<ServerState>>,
    Query(q): Query<RunsQuery>,
) -> Result<Json<Vec<RoutineRun>>, ApiError> {
    let root = agent_root(&q.agent_path);
    let runs = match q.routine_id {
        Some(rid) => routine_runs::list_for_routine(&root, &rid)?,
        None => routine_runs::list(&root)?,
    };
    Ok(Json(runs))
}

async fn create_run(
    State(_st): State<Arc<ServerState>>,
    Path(id): Path<String>,
    Query(q): Query<AgentQuery>,
) -> Result<Json<RoutineRun>, ApiError> {
    Ok(Json(routine_runs::create(&agent_root(&q.agent_path), &id)?))
}

async fn update_run(
    State(_st): State<Arc<ServerState>>,
    Path(id): Path<String>,
    Query(q): Query<AgentQuery>,
    Json(req): Json<houston_engine_core::routines::types::RoutineRunUpdate>,
) -> Result<Json<RoutineRun>, ApiError> {
    Ok(Json(routine_runs::update(&agent_root(&q.agent_path), &id, req)?))
}

// -- Scheduler lifecycle --

fn make_dispatcher(st: &Arc<ServerState>) -> EngineRoutineDispatcher {
    EngineRoutineDispatcher {
        rt: st.engine.sessions.clone(),
        events: st.engine.events.clone(),
        db: st.engine.db.clone(),
        paths: st.engine.paths.clone(),
        app_system_prompt: st.engine.app_system_prompt.clone(),
    }
}

async fn run_now(
    State(st): State<Arc<ServerState>>,
    Path(id): Path<String>,
    Query(q): Query<AgentQuery>,
) -> Result<(), ApiError> {
    let dispatcher: Arc<dyn routines::runner::RoutineDispatcher> =
        Arc::new(make_dispatcher(&st));
    let surface: Arc<dyn routines::runner::ActivitySurface> = Arc::new(EngineActivitySurface);
    run_routine(
        st.engine.events.clone(),
        dispatcher,
        surface,
        &q.agent_path,
        &id,
    )
    .await?;
    Ok(())
}

async fn scheduler_start(
    State(st): State<Arc<ServerState>>,
    Query(q): Query<AgentQuery>,
) -> Result<(), ApiError> {
    let tz = preferences::timezone(&st.engine.db).await;
    let dispatcher: Arc<dyn routines::runner::RoutineDispatcher> =
        Arc::new(make_dispatcher(&st));
    let surface: Arc<dyn routines::runner::ActivitySurface> = Arc::new(EngineActivitySurface);
    st.routine_scheduler
        .start_agent(
            &q.agent_path,
            &tz,
            st.engine.events.clone(),
            dispatcher,
            surface,
        )
        .await;
    Ok(())
}

async fn scheduler_stop(
    State(st): State<Arc<ServerState>>,
    Query(q): Query<AgentQuery>,
) -> Result<(), ApiError> {
    st.routine_scheduler.stop_agent(&q.agent_path).await;
    Ok(())
}

async fn scheduler_sync(
    State(st): State<Arc<ServerState>>,
    Query(q): Query<AgentQuery>,
) -> Result<(), ApiError> {
    st.routine_scheduler.sync_agent(&q.agent_path).await;
    Ok(())
}
