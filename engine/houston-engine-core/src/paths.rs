//! Filesystem path resolution for the engine.

use std::path::{Path, PathBuf};

/// Expand a leading `~` to the user's home directory. Mirrors the Tauri-side
/// helper so REST callers can submit `~/Documents/Houston/...` paths verbatim.
pub fn expand_tilde(path: &Path) -> PathBuf {
    if path.starts_with("~") {
        if let Ok(home) = std::env::var("HOME") {
            PathBuf::from(home).join(path.strip_prefix("~").unwrap_or(path))
        } else {
            path.to_path_buf()
        }
    } else {
        path.to_path_buf()
    }
}

#[derive(Clone, Debug)]
pub struct EnginePaths {
    /// Houston docs directory — holds workspaces (`~/Documents/Houston`).
    pub docs_dir: PathBuf,
    /// Houston home directory — holds `engine.json`, DB (`~/.houston`).
    pub home_dir: PathBuf,
}

impl EnginePaths {
    pub fn new(docs_dir: PathBuf, home_dir: PathBuf) -> Self {
        Self { docs_dir, home_dir }
    }

    pub fn docs(&self) -> &Path {
        &self.docs_dir
    }

    pub fn home(&self) -> &Path {
        &self.home_dir
    }

    /// Installed-agent definitions: `<home>/agents`.
    pub fn agents_dir(&self) -> PathBuf {
        self.home_dir.join("agents")
    }
}
