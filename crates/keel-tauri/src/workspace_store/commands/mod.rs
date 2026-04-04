//! Tauri commands for workspace store operations.
//!
//! All commands take a `project_id` and resolve the project folder via AppState,
//! then delegate to [`WorkspaceStore`](super::WorkspaceStore).
//!
//! Register these in your Tauri app's `invoke_handler`.

mod crud;
mod extras;

pub use crud::*;
pub use extras::*;

use crate::paths::expand_tilde;
use crate::state::AppState;
use std::path::PathBuf;

/// Resolve a project's folder path from its ID via the database.
pub(crate) async fn resolve_project_dir(
    state: &AppState,
    project_id: &str,
) -> Result<PathBuf, String> {
    let project = state
        .db
        .get_project(project_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Project not found")?;
    Ok(expand_tilde(&PathBuf::from(&project.folder_path)))
}
