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
    pub async fn post_to_slack(
        &mut self,
        session_key: &str,
        text: &str,
    ) -> Result<(), String> {
        // First check if we have an existing thread mapping
        if let Some(session) = self.find_session_for_key(session_key) {
            let thread = thread_map::find_thread(&session.config, session_key);
            if let Some(t) = thread {
                let bot_token = session.config.bot_token.clone();
                let channel_id = session.config.slack_channel_id.clone();
                let agent_name = session.agent_name.clone();
                let thread_ts = t.thread_ts.clone();

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

                return Ok(());
            }
        }

        // No thread yet — create one for this new conversation
        self.create_thread_for_new_conversation(session_key, text)
            .await
    }

    async fn create_thread_for_new_conversation(
        &mut self,
        session_key: &str,
        text: &str,
    ) -> Result<(), String> {
        let agent_path = self.find_agent_for_session_key(session_key)?;
        let session = self.sessions.get(&agent_path).ok_or("session disappeared")?;

        let bot_token = session.config.bot_token.clone();
        let channel_id = session.config.slack_channel_id.clone();
        let agent_name = session.agent_name.clone();
        let title = truncate(text, 80);

        // Post top-level message to create the thread
        let result = houston_channels::slack::api::post_message_as(
            &bot_token,
            &channel_id,
            &format!("New conversation: {title}"),
            None,
            Some(&agent_name),
            None,
        )
        .await
        .map_err(|e| e.to_string())?;

        let thread_ts = result.message_ts.ok_or("no ts in post_message response")?;

        self.add_thread_mapping(
            &agent_path,
            session_key.to_string(),
            thread_ts.clone(),
            title,
        )?;

        // Post the actual response as a thread reply
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

    fn find_agent_for_session_key(&self, session_key: &str) -> Result<String, String> {
        for (agent_path, _) in &self.sessions {
            let root = expand_tilde(&PathBuf::from(agent_path));
            let activities = crate::agent_store::activity::list(&root).unwrap_or_default();
            for act in activities {
                let act_key = act
                    .session_key
                    .unwrap_or_else(|| format!("activity-{}", act.id));
                if act_key == session_key {
                    return Ok(agent_path.clone());
                }
            }
            if session_key == "main" {
                return Ok(agent_path.clone());
            }
        }
        Err(format!("no agent found for session_key {session_key}"))
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
