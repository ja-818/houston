//! SlackSyncManager: orchestrates 2-way sync between Houston conversations and Slack threads.

use std::collections::HashMap;
use std::path::PathBuf;

use crate::agent_store::types::SlackSyncConfig;
use crate::paths::expand_tilde;

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
}

impl SlackSyncManager {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
            registry_to_agent: HashMap::new(),
        }
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

        houston_channels::slack::api::post_message_as(
            &bot_token,
            &channel_id,
            text,
            Some(&thread_ts),
            Some(&agent_name),
            None,
        )
        .await
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    /// Create a Slack thread for a conversation by posting the user's message as the
    /// top-level post (under the user's identity). Returns the thread_ts.
    pub async fn create_thread_for_user_message(
        &mut self,
        agent_path: &str,
        session_key: &str,
        user_text: &str,
    ) -> Result<Option<String>, String> {
        let session = match self.sessions.get(agent_path) {
            Some(s) => s,
            None => return Ok(None), // No Slack sync for this agent
        };
        // If thread already exists, return its ts
        if let Some(thread) = thread_map::find_thread(&session.config, session_key) {
            return Ok(Some(thread.thread_ts.clone()));
        }

        let bot_token = session.config.bot_token.clone();
        let channel_id = session.config.slack_channel_id.clone();
        let user_name = session.config.user_name.clone();
        let user_avatar = session.config.user_avatar.clone();

        // Post the user's message as the top-level post (creates the thread)
        let result = houston_channels::slack::api::post_message_as(
            &bot_token,
            &channel_id,
            user_text,
            None,
            Some(&user_name),
            user_avatar.as_deref(),
        )
        .await
        .map_err(|e| e.to_string())?;

        let thread_ts = result.message_ts.ok_or("no ts in post_message response")?;
        let title = truncate(user_text, 80);

        self.add_thread_mapping(
            agent_path,
            session_key.to_string(),
            thread_ts.clone(),
            title,
        )?;

        Ok(Some(thread_ts))
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

fn truncate(s: &str, max: usize) -> String {
    if s.len() <= max {
        s.to_string()
    } else {
        format!("{}...", &s[..max.min(s.len())])
    }
}
