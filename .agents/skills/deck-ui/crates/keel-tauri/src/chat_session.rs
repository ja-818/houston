//! Managed Tauri state for tracking a single chat session's Claude session ID.
//!
//! Register with `app.manage(ChatSessionState::default())` during setup.
//! Pass as `State<'_, ChatSessionState>` in Tauri commands.

use std::sync::Arc;
use tokio::sync::Mutex;

/// Tracks the Claude CLI session ID for `--resume` across sends.
///
/// For single-conversation apps (like DesktopClaw), manage one instance.
/// For multi-conversation apps (like Houston), use the database instead.
#[derive(Default, Clone)]
pub struct ChatSessionState {
    claude_session_id: Arc<Mutex<Option<String>>>,
}

impl ChatSessionState {
    /// Get the current session ID for resuming.
    pub async fn get(&self) -> Option<String> {
        self.claude_session_id.lock().await.clone()
    }

    /// Store a new session ID (called when `SessionUpdate::SessionId` arrives).
    pub async fn set(&self, id: String) {
        *self.claude_session_id.lock().await = Some(id);
    }

    /// Clear the session ID (e.g. on conversation reset).
    pub async fn clear(&self) {
        *self.claude_session_id.lock().await = None;
    }
}
