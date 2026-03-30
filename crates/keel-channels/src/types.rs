use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// A platform-agnostic message received from or sent to a messaging channel.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelMessage {
    pub id: String,
    /// Source platform identifier (e.g., "slack", "telegram").
    pub source: String,
    /// Platform-specific channel or chat ID.
    pub channel_id: String,
    pub sender_id: String,
    pub sender_name: String,
    pub text: String,
    pub timestamp: DateTime<Utc>,
    /// Thread or reply context (platform-specific thread ID).
    pub reply_to: Option<String>,
    pub attachments: Vec<Attachment>,
}

/// A file or media attachment on a message.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub name: String,
    pub url: Option<String>,
    pub mime_type: Option<String>,
    pub size: Option<u64>,
}

/// Configuration needed to connect a channel adapter.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelConfig {
    /// Platform type (e.g., "slack", "telegram").
    pub channel_type: String,
    /// Bot token for authentication.
    pub token: String,
    /// Channel-specific configuration (e.g., Slack `app_token` for Socket Mode).
    pub extra: serde_json::Value,
}

/// Connection status of a channel adapter.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ChannelStatus {
    Disconnected,
    Connecting,
    Connected,
    Error(String),
}
