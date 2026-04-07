//! Per-agent session state with disk persistence.
//!
//! Each agent maintains its own Claude session ID for `--resume`.
//! The session ID is persisted to `.claude_session_id` in the workspace folder
//! so it survives app restarts.

use crate::chat_session::ChatSessionState;
use crate::paths::expand_tilde;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

const SESSION_FILE: &str = ".claude_session_id";

/// Managed Tauri state: one `ChatSessionState` per agent key.
/// Persists session IDs to disk so conversations survive app restarts.
#[derive(Default, Clone)]
pub struct AgentSessionMap {
    inner: Arc<RwLock<HashMap<String, ChatSessionState>>>,
}

impl AgentSessionMap {
    /// Get (or lazily create) the `ChatSessionState` for a given agent.
    /// On first access, loads the persisted session ID from disk if available.
    ///
    /// `agent_key` is an arbitrary unique identifier for the agent (e.g. project_id).
    /// `workspace_path` is the filesystem path where `.claude_session_id` is stored.
    pub async fn get_for_agent(
        &self,
        agent_key: &str,
        workspace_path: &str,
    ) -> ChatSessionState {
        // Fast path: already in memory.
        {
            let map = self.inner.read().await;
            if let Some(state) = map.get(agent_key) {
                return state.clone();
            }
        }

        // Slow path: create and try to load from disk.
        // Only load the shared .claude_session_id for the "main" session.
        // Activity sessions (activity-{id}) must start fresh — they each get
        // their own Claude session, not the agent's primary one.
        let state = ChatSessionState::default();

        let is_activity = agent_key.contains(":activity-");
        if !is_activity {
            let workspace_dir = expand_tilde(&PathBuf::from(workspace_path));
            let session_file = workspace_dir.join(SESSION_FILE);
            if let Ok(id) = std::fs::read_to_string(&session_file) {
                let id = id.trim().to_string();
                if !id.is_empty() {
                    state.set(id).await;
                }
            }
        }

        let mut map = self.inner.write().await;
        map.entry(agent_key.to_string())
            .or_insert(state)
            .clone()
    }

    /// Save the current session ID to disk after a session completes.
    pub async fn persist(
        &self,
        agent_key: &str,
        workspace_path: &str,
    ) {
        let session_id = {
            let map = self.inner.read().await;
            match map.get(agent_key) {
                Some(state) => state.get().await,
                None => None,
            }
        };

        if let Some(id) = session_id {
            let workspace_dir = expand_tilde(&PathBuf::from(workspace_path));
            let session_file = workspace_dir.join(SESSION_FILE);
            std::fs::write(&session_file, &id).ok();
        }
    }

    /// Remove session state for a deleted agent.
    pub async fn remove_agent(&self, agent_key: &str) {
        let mut map = self.inner.write().await;
        map.remove(agent_key);
    }
}
