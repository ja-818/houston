//! SlackSyncManager: orchestrates 2-way sync between Houston conversations and Slack threads.

use std::collections::HashMap;
use std::path::PathBuf;

use crate::agent_store::types::SlackSyncConfig;
use crate::paths::expand_tilde;

use super::pending_reply::PendingReply;
use super::thread_map;

/// Per-agent sync state.
pub struct SlackSyncSession {
    pub agent_path: String,
    pub agent_name: String,
    pub registry_id: String,
    pub config: SlackSyncConfig,
}

/// Manages Slack sync sessions across all agents.
pub struct SlackSyncManager {
    sessions: HashMap<String, SlackSyncSession>,
    registry_to_agent: HashMap<String, String>,
    /// Live placeholder messages keyed by `session_key`. Owned here so the
    /// pending_reply module's free functions can access it via `&mut self`
    /// or via `Arc<RwLock<Self>>` from a debouncer task.
    pub(super) pending_replies: HashMap<String, PendingReply>,
}

impl SlackSyncManager {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
            registry_to_agent: HashMap::new(),
            pending_replies: HashMap::new(),
        }
    }

    /// True if there's a live placeholder for this conversation.
    /// Used by `outbound.rs` to decide between "edit placeholder" and
    /// "post a fresh reply" (the routine/heartbeat path).
    pub fn has_pending_reply(&self, session_key: &str) -> bool {
        self.pending_replies.contains_key(session_key)
    }

    pub fn register(
        &mut self,
        agent_path: String,
        agent_name: String,
        registry_id: String,
        config: SlackSyncConfig,
    ) {
        self.registry_to_agent
            .insert(registry_id.clone(), agent_path.clone());
        self.sessions.insert(
            agent_path.clone(),
            SlackSyncSession {
                agent_path,
                agent_name,
                registry_id,
                config,
            },
        );
    }

    pub fn unregister(&mut self, agent_path: &str) -> Option<SlackSyncSession> {
        if let Some(session) = self.sessions.remove(agent_path) {
            self.registry_to_agent.remove(&session.registry_id);
            Some(session)
        } else {
            None
        }
    }

    pub fn agent_for_registry(&self, registry_id: &str) -> Option<&str> {
        self.registry_to_agent.get(registry_id).map(|s| s.as_str())
    }

    pub fn session_for_agent(&self, agent_path: &str) -> Option<&SlackSyncSession> {
        self.sessions.get(agent_path)
    }

    /// Find the agent that owns a given Slack channel by its `channel_id`.
    ///
    /// **Why this is the right routing key:** All Houston agents share the
    /// same Slack app (single `SLACK_APP_TOKEN`), so opening N Socket Mode
    /// WebSockets just gives Slack N redundant connections for one app.
    /// Slack distributes events across them randomly — so a message in
    /// `#houston-moana` can land on the `AgentTestChannel` WebSocket. The
    /// only stable way to identify the owning agent is by the channel the
    /// message was actually posted in.
    pub fn session_for_channel(&self, channel_id: &str) -> Option<&SlackSyncSession> {
        self.sessions
            .values()
            .find(|s| s.config.slack_channel_id == channel_id)
    }

    fn find_session_for_key(&self, session_key: &str) -> Option<&SlackSyncSession> {
        self.sessions
            .values()
            .find(|s| thread_map::find_thread(&s.config, session_key).is_some())
    }

    /// Post an assistant message to the correct Slack thread, using agent name.
    /// If no thread exists yet, silently skips (thread is created by user's first message).
    pub async fn post_to_slack(
        &self,
        session_key: &str,
        text: &str,
    ) -> Result<(), String> {
        let session = match self.find_session_for_key(session_key) {
            Some(s) => s,
            None => return Ok(()), // No sync session for this conversation
        };
        let thread = match thread_map::find_thread(&session.config, session_key) {
            Some(t) => t,
            None => return Ok(()), // No thread yet — will be created on next user message
        };

        let bot_token = session.config.bot_token.clone();
        let channel_id = session.config.slack_channel_id.clone();
        let agent_name = session.agent_name.clone();
        let thread_ts = thread.thread_ts.clone();
        let icon_url = session.config.agent_icon_url.clone();

        houston_channels::slack::api::post_message_as(
            &bot_token,
            &channel_id,
            text,
            Some(&thread_ts),
            Some(&agent_name),
            icon_url.as_deref(),
        )
        .await
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn add_thread_mapping(
        &mut self,
        agent_path: &str,
        session_key: String,
        thread_ts: String,
        title: String,
    ) -> Result<(), String> {
        let session = self
            .sessions
            .get_mut(agent_path)
            .ok_or("no sync session for agent")?;
        let root = expand_tilde(&PathBuf::from(agent_path));
        thread_map::upsert_thread(&root, &mut session.config, session_key, thread_ts, title)
    }
}

impl Default for SlackSyncManager {
    fn default() -> Self {
        Self::new()
    }
}
