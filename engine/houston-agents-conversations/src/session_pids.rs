//! Shared map of session keys to running process PIDs.
//!
//! Allows `stop_session` to look up and kill a running Claude CLI process by
//! its session key.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Thread-safe map of session_key → process PID for running sessions.
/// Register as Tauri managed state in your app setup.
#[derive(Default, Clone)]
pub struct SessionPidMap(Arc<Mutex<HashMap<String, u32>>>);

impl SessionPidMap {
    pub async fn insert(&self, session_key: String, pid: u32) {
        self.0.lock().await.insert(session_key, pid);
    }

    pub async fn remove(&self, session_key: &str) -> Option<u32> {
        self.0.lock().await.remove(session_key)
    }
}
