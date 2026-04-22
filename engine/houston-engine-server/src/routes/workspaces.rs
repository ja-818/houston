//! `/v1/workspaces` REST routes.

use crate::routes::error::ApiError;
use crate::state::ServerState;
use axum::{
    extract::{Path, State},
    routing::{delete, get, patch, post},
    Json, Router,
};
use houston_engine_core::agents_crud::{self, Agent, CreateAgent, CreateAgentResult};
use houston_engine_core::workspaces::{
    self, CreateWorkspace, RenameWorkspace, UpdateProvider, Workspace,
};
use serde::Deserialize;
use std::sync::Arc;

pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route("/workspaces", get(list).post(create))
        .route("/workspaces/:id", delete(remove))
        .route("/workspaces/:id/rename", post(rename))
        .route("/workspaces/:id/provider", patch(set_provider))
        // Workspace-scoped agents CRUD.
        .route(
            "/workspaces/:id/agents",
            get(list_agents).post(create_agent),
        )
        .route(
            "/workspaces/:id/agents/:agent_id",
            delete(delete_agent),
        )
        .route(
            "/workspaces/:id/agents/:agent_id/rename",
            post(rename_agent),
        )
}

async fn list(State(st): State<Arc<ServerState>>) -> Result<Json<Vec<Workspace>>, ApiError> {
    Ok(Json(workspaces::list(st.engine.paths.docs())?))
}

async fn create(
    State(st): State<Arc<ServerState>>,
    Json(req): Json<CreateWorkspace>,
) -> Result<Json<Workspace>, ApiError> {
    Ok(Json(workspaces::create(st.engine.paths.docs(), req)?))
}

async fn remove(
    State(st): State<Arc<ServerState>>,
    Path(id): Path<String>,
) -> Result<(), ApiError> {
    workspaces::delete(st.engine.paths.docs(), &id)?;
    Ok(())
}

async fn rename(
    State(st): State<Arc<ServerState>>,
    Path(id): Path<String>,
    Json(req): Json<RenameWorkspace>,
) -> Result<Json<Workspace>, ApiError> {
    Ok(Json(workspaces::rename(st.engine.paths.docs(), &id, req)?))
}

async fn set_provider(
    State(st): State<Arc<ServerState>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateProvider>,
) -> Result<Json<Workspace>, ApiError> {
    Ok(Json(workspaces::update_provider(
        st.engine.paths.docs(),
        &id,
        req,
    )?))
}

// -- Workspace-scoped agent CRUD --

async fn list_agents(
    State(st): State<Arc<ServerState>>,
    Path(id): Path<String>,
) -> Result<Json<Vec<Agent>>, ApiError> {
    Ok(Json(agents_crud::list(st.engine.paths.docs(), &id)?))
}

async fn create_agent(
    State(st): State<Arc<ServerState>>,
    Path(id): Path<String>,
    Json(req): Json<CreateAgent>,
) -> Result<Json<CreateAgentResult>, ApiError> {
    Ok(Json(agents_crud::create(st.engine.paths.docs(), &id, req)?))
}

async fn delete_agent(
    State(st): State<Arc<ServerState>>,
    Path((id, agent_id)): Path<(String, String)>,
) -> Result<(), ApiError> {
    agents_crud::delete(st.engine.paths.docs(), &id, &agent_id)?;
    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RenameAgentBody {
    new_name: String,
}

async fn rename_agent(
    State(st): State<Arc<ServerState>>,
    Path((id, agent_id)): Path<(String, String)>,
    Json(body): Json<RenameAgentBody>,
) -> Result<Json<Agent>, ApiError> {
    Ok(Json(agents_crud::rename(
        st.engine.paths.docs(),
        &id,
        &agent_id,
        &body.new_name,
    )?))
}
