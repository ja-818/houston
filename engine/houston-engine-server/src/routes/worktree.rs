//! `/v1/worktrees` + `/v1/shell` REST routes.
//!
//! Git worktree CRUD lives under `/v1/worktrees`. Generic shell execution
//! (cwd + command) lives at `/v1/shell`. OS-native helpers
//! (`pick_directory`, `open_terminal`) stay in the Tauri shell.

use crate::routes::error::ApiError;
use crate::state::ServerState;
use axum::{extract::State, routing::post, Json, Router};
use houston_engine_core::worktree::{
    self, CreateWorktreeRequest, ListWorktreesRequest, RemoveWorktreeRequest, RunShellRequest,
    WorktreeInfo,
};
use std::sync::Arc;

pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route("/worktrees", post(create))
        .route("/worktrees/list", post(list))
        .route("/worktrees/remove", post(remove))
        .route("/shell", post(run_shell))
}

async fn create(
    State(_st): State<Arc<ServerState>>,
    Json(req): Json<CreateWorktreeRequest>,
) -> Result<Json<WorktreeInfo>, ApiError> {
    Ok(Json(worktree::create_worktree(req).await?))
}

async fn list(
    State(_st): State<Arc<ServerState>>,
    Json(req): Json<ListWorktreesRequest>,
) -> Result<Json<Vec<WorktreeInfo>>, ApiError> {
    Ok(Json(worktree::list_worktrees(req).await?))
}

async fn remove(
    State(_st): State<Arc<ServerState>>,
    Json(req): Json<RemoveWorktreeRequest>,
) -> Result<(), ApiError> {
    worktree::remove_worktree(req).await?;
    Ok(())
}

async fn run_shell(
    State(_st): State<Arc<ServerState>>,
    Json(req): Json<RunShellRequest>,
) -> Result<Json<String>, ApiError> {
    Ok(Json(worktree::run_shell(req).await?))
}
