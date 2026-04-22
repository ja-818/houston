//! `/v1/store`, `/v1/agents:*`, and `/v1/workspaces:installFromGithub` REST routes.

use crate::routes::error::ApiError;
use crate::state::ServerState;
use axum::{
    extract::{Path, Query, State},
    routing::{delete, get, post},
    Json, Router,
};
use houston_engine_core::store::{
    self, ImportedWorkspace, InstallAgent, InstallFromGithub, StoreListing,
};
use serde::Deserialize;
use std::sync::Arc;

pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route("/store/catalog", get(catalog))
        .route("/store/search", get(search))
        .route("/store/installs", post(install))
        .route("/store/installs/:agent_id", delete(uninstall))
        .route("/agents/install-from-github", post(install_from_github))
        .route("/agents/check-updates", post(check_updates))
        .route(
            "/workspaces/install-from-github",
            post(install_workspace_from_github),
        )
}

async fn catalog() -> Result<Json<Vec<StoreListing>>, ApiError> {
    Ok(Json(store::fetch_catalog().await?))
}

#[derive(Deserialize)]
struct SearchQuery {
    q: String,
}

async fn search(Query(q): Query<SearchQuery>) -> Result<Json<Vec<StoreListing>>, ApiError> {
    Ok(Json(store::search(&q.q).await?))
}

async fn install(
    State(st): State<Arc<ServerState>>,
    Json(req): Json<InstallAgent>,
) -> Result<(), ApiError> {
    store::install_agent(&st.engine.paths.agents_dir(), req).await?;
    Ok(())
}

async fn uninstall(
    State(st): State<Arc<ServerState>>,
    Path(agent_id): Path<String>,
) -> Result<(), ApiError> {
    store::uninstall_agent(&st.engine.paths.agents_dir(), &agent_id)?;
    Ok(())
}

async fn install_from_github(
    State(st): State<Arc<ServerState>>,
    Json(req): Json<InstallFromGithub>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let agent_id =
        store::install_agent_from_github(&st.engine.paths.agents_dir(), &req.github_url).await?;
    Ok(Json(serde_json::json!({ "agentId": agent_id })))
}

async fn check_updates(
    State(st): State<Arc<ServerState>>,
) -> Result<Json<Vec<String>>, ApiError> {
    Ok(Json(
        store::check_agent_updates(&st.engine.paths.agents_dir()).await?,
    ))
}

async fn install_workspace_from_github(
    State(st): State<Arc<ServerState>>,
    Json(req): Json<InstallFromGithub>,
) -> Result<Json<ImportedWorkspace>, ApiError> {
    Ok(Json(
        store::install_workspace_from_github(
            st.engine.paths.docs(),
            &st.engine.paths.agents_dir(),
            &req.github_url,
        )
        .await?,
    ))
}
