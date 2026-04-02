use serde::{Deserialize, Serialize};

/// Response from Slack's `apps.connections.open` API.
#[derive(Debug, Deserialize)]
pub struct ConnectionsOpenResponse {
    pub ok: bool,
    pub url: Option<String>,
    pub error: Option<String>,
}

/// A Socket Mode envelope wrapping an event.
#[derive(Debug, Deserialize)]
pub struct SlackEnvelope {
    pub envelope_id: String,
    #[serde(rename = "type")]
    pub envelope_type: String,
    pub payload: Option<SlackEventPayload>,
}

/// The payload inside a Socket Mode envelope.
#[derive(Debug, Deserialize)]
pub struct SlackEventPayload {
    pub event: Option<SlackMessageEvent>,
}

/// A Slack message event.
#[derive(Debug, Deserialize)]
pub struct SlackMessageEvent {
    #[serde(rename = "type")]
    pub event_type: Option<String>,
    pub subtype: Option<String>,
    pub channel: Option<String>,
    pub user: Option<String>,
    pub text: Option<String>,
    pub ts: Option<String>,
    pub thread_ts: Option<String>,
    pub files: Option<Vec<SlackFile>>,
}

/// A file attached to a Slack message.
#[derive(Debug, Deserialize)]
pub struct SlackFile {
    pub name: Option<String>,
    pub url_private: Option<String>,
    pub mimetype: Option<String>,
    pub size: Option<u64>,
}

/// Acknowledgement payload sent back through the WebSocket.
#[derive(Debug, Serialize)]
pub struct SocketModeAck {
    pub envelope_id: String,
}

/// Response from Slack's `chat.postMessage` API.
#[derive(Debug, Deserialize)]
pub struct PostMessageResponse {
    pub ok: bool,
    pub error: Option<String>,
}

/// Response from Slack's `users.info` API.
#[derive(Debug, Deserialize)]
pub struct UsersInfoResponse {
    pub ok: bool,
    pub user: Option<SlackUser>,
    pub error: Option<String>,
}

/// Slack user profile information.
#[derive(Debug, Deserialize)]
pub struct SlackUser {
    pub id: Option<String>,
    pub name: Option<String>,
    pub real_name: Option<String>,
}
