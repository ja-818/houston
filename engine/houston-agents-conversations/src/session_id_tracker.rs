//! Tracks Claude CLI session IDs per `(agent_dir, session_key)` pair so
//! `--resume` continues the right conversation across turns and app restarts.
//!
//! Each handle owns its disk path: setting a new ID updates the in-memory
//! slot AND persists to `.houston/sessions/{session_key}.sid` under the
//! agent directory. No shared "main" session file — every conversation is
//! independently scoped.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};

/// Return the disk path where a given session_key's Claude session ID is persisted.
pub fn session_id_path(agent_dir: &Path, session_key: &str) -> PathBuf {
    agent_dir
        .join(".houston")
        .join("sessions")
        .join(format!("{session_key}.sid"))
}

/// Handle to a single conversation's Claude session ID. Cheap to clone.
/// Setting a new ID persists to disk atomically.
#[derive(Clone)]
pub struct SessionIdHandle {
    id: Arc<Mutex<Option<String>>>,
    sid_path: PathBuf,
}

impl SessionIdHandle {
    /// Get the current session ID for resuming.
    pub async fn get(&self) -> Option<String> {
        self.id.lock().await.clone()
    }

    /// Store a new session ID and persist to disk so `--resume` survives app restarts.
    pub async fn set(&self, id: String) {
        *self.id.lock().await = Some(id.clone());
        if let Some(parent) = self.sid_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let _ = std::fs::write(&self.sid_path, &id);
    }

    /// Clear the session ID (e.g. on conversation reset). Does not remove the disk file.
    pub async fn clear(&self) {
        *self.id.lock().await = None;
    }
}

/// Managed Tauri state: one `SessionIdHandle` per `(agent_dir, session_key)`.
/// Lazy-loads persisted IDs from disk on first access.
#[derive(Default, Clone)]
pub struct SessionIdTracker {
    inner: Arc<RwLock<HashMap<String, SessionIdHandle>>>,
}

impl SessionIdTracker {
    /// Get (or lazily create) the handle for a given conversation.
    ///
    /// `agent_key` is a unique identifier combining agent + session
    /// (e.g. `"{agent_dir}:{session_key}"`).
    /// `agent_dir` is the expanded agent filesystem path — where
    /// `.houston/sessions/{session_key}.sid` is stored.
    pub async fn get_for_session(
        &self,
        agent_key: &str,
        agent_dir: &Path,
        session_key: &str,
    ) -> SessionIdHandle {
        // Fast path: already in memory.
        {
            let map = self.inner.read().await;
            if let Some(handle) = map.get(agent_key) {
                return handle.clone();
            }
        }

        // Slow path: create handle and try to load the persisted ID from disk.
        let sid_path = session_id_path(agent_dir, session_key);
        let initial = std::fs::read_to_string(&sid_path)
            .ok()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());

        let handle = SessionIdHandle {
            id: Arc::new(Mutex::new(initial)),
            sid_path,
        };

        let mut map = self.inner.write().await;
        map.entry(agent_key.to_string())
            .or_insert(handle)
            .clone()
    }

    /// Remove in-memory handles for a deleted agent.
    /// `agent_key_prefix` should match the `"{agent_dir}:"` prefix used when storing.
    pub async fn remove_agent(&self, agent_key_prefix: &str) {
        let mut map = self.inner.write().await;
        map.retain(|k, _| !k.starts_with(agent_key_prefix));
    }
}
