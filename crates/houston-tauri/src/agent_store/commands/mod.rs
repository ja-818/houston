//! Tauri commands for workspace store operations.
//!
//! All commands take a `workspace_path` and resolve the folder directly,
//! then delegate to [`WorkspaceStore`](super::WorkspaceStore).
//!
//! Register these in your Tauri app's `invoke_handler`.

mod crud;
mod extras;

pub use crud::*;
pub use extras::*;

use crate::paths::expand_tilde;
use std::path::PathBuf;

/// Resolve a workspace directory from a user-provided path.
pub(crate) fn resolve_workspace_dir(workspace_path: &str) -> Result<PathBuf, String> {
    Ok(expand_tilde(&PathBuf::from(workspace_path)))
}
