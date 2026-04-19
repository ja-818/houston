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
        agent_path: String,
        session_key: String,
        item: FeedItem,
    },
    /// Session status changed (starting, running, completed, error).
    SessionStatus {
        agent_path: String,
        session_key: String,
        status: String,
        error: Option<String>,
    },
    /// Toast notification for the UI.
    Toast {
        message: String,
        variant: String,
    },
    /// CLI tool authentication required — provider session returned 401 or similar.
    AuthRequired {
        provider: String,
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
    /// Skills changed (.agents/skills/ — skill.sh / Claude Code convention).
    SkillsChanged {
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
    /// Learnings changed (.houston/learnings/learnings.json).
    LearningsChanged {
        agent_path: String,
    },

    // ----- Composio CLI lifecycle -----

    /// Composio CLI is installed and ready. Frontend should invalidate
    /// the connections query so the integrations tab updates.
    ComposioCliReady,
    /// Composio CLI install or upgrade failed.
    ComposioCliFailed { message: String },
}
