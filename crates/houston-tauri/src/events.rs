use houston_sessions::FeedItem;
use serde::Serialize;

/// Generic events emitted from the Rust backend to the frontend via Tauri's event system.
///
/// Applications can extend this with their own event types or use it directly.
/// Emit via `app_handle.emit("houston-event", HoustonEvent::...)`.
#[derive(Clone, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum HoustonEvent {
    /// A feed item from a running session.
    FeedItem {
        session_key: String,
        item: FeedItem,
    },
    /// Session status changed (starting, running, completed, error).
    SessionStatus {
        session_key: String,
        status: String,
        error: Option<String>,
    },
    /// Toast notification for the UI.
    Toast {
        message: String,
        variant: String,
    },
    /// CLI tool authentication required.
    AuthRequired {
        message: String,
    },
    /// Activity completion notification.
    CompletionToast {
        title: String,
        issue_id: Option<String>,
    },

    // ----- Event system (houston-events) -----

    /// An input event was received and queued for processing.
    EventReceived {
        event_id: String,
        event_type: String,
        source_channel: String,
        source_identifier: String,
        summary: String,
    },
    /// An input event was processed.
    EventProcessed {
        event_id: String,
        status: String,
    },

    // ----- Scheduler (houston-scheduler) -----

    /// A heartbeat fired.
    HeartbeatFired {
        prompt: String,
        project_id: Option<String>,
    },
    /// A cron job fired.
    CronFired {
        job_id: String,
        job_name: String,
        prompt: String,
    },

    // ----- Channels (houston-channels) -----

    /// A message arrived from an external channel (Slack, Telegram, etc.).
    ChannelMessageReceived {
        channel_type: String,
        channel_id: String,
        sender_name: String,
        text: String,
    },
    /// A channel's connection status changed.
    ChannelStatusChanged {
        channel_id: String,
        channel_type: String,
        status: String,
        error: Option<String>,
    },

    // ----- Routines -----

    /// Routines list changed (.houston/routines.json).
    RoutinesChanged {
        agent_path: String,
    },
    /// Routine runs changed (.houston/routine_runs.json).
    RoutineRunsChanged {
        agent_path: String,
    },

    // ----- Agent data changes (AI-native reactivity) -----
    // Emitted by agent_store writes AND by the file watcher.
    // Frontend uses these to invalidate TanStack Query caches.

    /// Activity list changed (.houston/activity.json).
    ActivityChanged {
        agent_path: String,
    },
    /// Integrations changed (.houston/integrations.json).
    IntegrationsChanged {
        agent_path: String,
    },
    /// Skills changed (.houston/skills/).
    SkillsChanged {
        agent_path: String,
    },
    /// Learnings changed (.houston/memory/).
    LearningsChanged {
        agent_path: String,
    },
    /// Channel config changed (.houston/channels.json).
    ChannelsConfigChanged {
        agent_path: String,
    },
    /// Agent files changed (non-.houston files).
    FilesChanged {
        agent_path: String,
    },
    /// Config changed (.houston/config.json).
    ConfigChanged {
        agent_path: String,
    },
    /// Context files changed (CLAUDE.md, .houston/prompts/).
    ContextChanged {
        agent_path: String,
    },
    /// Conversations list changed.
    ConversationsChanged {
        project_id: String,
        agent_path: String,
    },

    // ----- Slack Sync -----

    /// Slack sync started for an agent.
    SlackSyncStarted {
        agent_path: String,
        slack_channel_name: String,
    },
    /// Slack sync stopped for an agent.
    SlackSyncStopped {
        agent_path: String,
    },
    /// A new Slack thread was created for a conversation.
    SlackThreadCreated {
        agent_path: String,
        session_key: String,
        thread_ts: String,
    },
}
