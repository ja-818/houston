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
use houston_engine_core::routines::{
    self, runs as routine_runs,
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
}

async fn list(
    State(_st): State<Arc<ServerState>>,
    Query(q): Query<AgentQuery>,
) -> Result<Json<Vec<Routine>>, ApiError> {
    Ok(Json(routines::list(&agent_root(&q.agent_path))?))
}

async fn create(
    State(_st): State<Arc<ServerState>>,
    Query(q): Query<AgentQuery>,
    Json(req): Json<NewRoutine>,
) -> Result<Json<Routine>, ApiError> {
    Ok(Json(routines::create(&agent_root(&q.agent_path), req)?))
}

async fn update(
    State(_st): State<Arc<ServerState>>,
    Path(id): Path<String>,
    Query(q): Query<AgentQuery>,
    Json(req): Json<RoutineUpdate>,
) -> Result<Json<Routine>, ApiError> {
    Ok(Json(routines::update(&agent_root(&q.agent_path), &id, req)?))
}

async fn remove(
    State(_st): State<Arc<ServerState>>,
    Path(id): Path<String>,
    Query(q): Query<AgentQuery>,
) -> Result<(), ApiError> {
    routines::delete(&agent_root(&q.agent_path), &id)?;
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
