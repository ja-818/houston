use keel_sessions::FeedItem;
use serde::Serialize;

/// Generic events emitted from the Rust backend to the frontend via Tauri's event system.
///
/// Applications can extend this with their own event types or use it directly.
/// Emit via `app_handle.emit("keel-event", KeelEvent::...)`.
#[derive(Clone, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum KeelEvent {
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
    /// An issue's status changed on the kanban board.
    IssueStatusChanged {
        issue_id: String,
        status: String,
    },
    /// Output files for an issue were updated.
    IssueOutputFilesChanged {
        issue_id: String,
        files: Vec<String>,
    },
    /// An issue's title changed.
    IssueTitleChanged {
        issue_id: String,
        title: String,
    },
    /// Issues list changed for a project (bulk refresh signal).
    IssuesChanged {
        project_id: String,
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
    /// Task completion notification.
    CompletionToast {
        title: String,
        issue_id: Option<String>,
    },

    // ----- Event system (keel-events) -----

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

    // ----- Scheduler (keel-scheduler) -----

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

    // ----- Channels (keel-channels) -----

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

    // ----- Memory (keel-memory) -----

    /// A memory was created or updated.
    MemoryChanged {
        memory_id: String,
        project_id: String,
        category: String,
    },
    /// A memory was deleted.
    MemoryDeleted {
        memory_id: String,
        project_id: String,
    },

    // ----- Routines -----

    /// A routine run changed status.
    RoutineRunChanged {
        routine_id: String,
        run_id: String,
        status: String,
    },
    /// Routines list changed for a project.
    RoutinesChanged {
        project_id: String,
    },
}
