//! `/v1/attachments` REST routes.

use crate::routes::error::ApiError;
use crate::state::ServerState;
use axum::{
    extract::{Path, State},
    routing::{delete, post},
    Json, Router,
};
use houston_engine_core::attachments::{self, SaveAttachmentsRequest};
use std::sync::Arc;

pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route("/attachments", post(save))
        .route("/attachments/:scope_id", delete(remove))
}

async fn save(
    State(st): State<Arc<ServerState>>,
    Json(req): Json<SaveAttachmentsRequest>,
) -> Result<Json<Vec<String>>, ApiError> {
    Ok(Json(attachments::save(st.engine.paths.home(), req)?))
}

async fn remove(
    State(st): State<Arc<ServerState>>,
    Path(scope_id): Path<String>,
) -> Result<(), ApiError> {
    attachments::delete(st.engine.paths.home(), &scope_id)?;
    Ok(())
}
