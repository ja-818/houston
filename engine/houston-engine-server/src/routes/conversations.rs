//! `/v1/conversations` REST routes — read-only listing.

use crate::routes::error::ApiError;
use crate::state::ServerState;
use axum::{extract::State, routing::post, Json, Router};
use houston_engine_core::conversations::{self, ConversationEntry};
use serde::Deserialize;
use std::path::PathBuf;
use std::sync::Arc;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListRequest {
    pub agent_path: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListAllRequest {
    pub agent_paths: Vec<String>,
}

pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route("/conversations/list", post(list))
        .route("/conversations/list-all", post(list_all))
}

async fn list(
    State(_st): State<Arc<ServerState>>,
    Json(req): Json<ListRequest>,
) -> Result<Json<Vec<ConversationEntry>>, ApiError> {
    let root = PathBuf::from(req.agent_path);
    Ok(Json(conversations::list(&root)?))
}

async fn list_all(
    State(_st): State<Arc<ServerState>>,
    Json(req): Json<ListAllRequest>,
) -> Result<Json<Vec<ConversationEntry>>, ApiError> {
    let roots: Vec<PathBuf> = req.agent_paths.into_iter().map(PathBuf::from).collect();
    let refs: Vec<&std::path::Path> = roots.iter().map(|p| p.as_path()).collect();
    Ok(Json(conversations::list_all(&refs)?))
}
