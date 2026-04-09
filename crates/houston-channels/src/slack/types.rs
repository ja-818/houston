use serde::{Deserialize, Serialize};

/// Response from Slack's `apps.connections.open` API.
#[derive(Debug, Deserialize)]
pub struct ConnectionsOpenResponse {
    pub ok: bool,
    pub url: Option<String>,
    pub error: Option<String>,
}

/// A Socket Mode envelope wrapping an event.
///
/// Note: `envelope_id` is `Option` because system frames like the `hello`
/// and `disconnect` messages don't include one. Only `events_api` envelopes
/// (which carry real user messages) have an `envelope_id` to ack.
#[derive(Debug, Deserialize)]
pub struct SlackEnvelope {
    pub envelope_id: Option<String>,
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
    /// Present when the message was sent by a bot.
    pub bot_id: Option<String>,
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
    pub ts: Option<String>,
    pub channel: Option<String>,
    pub error: Option<String>,
}

/// Response from Slack's `conversations.create` API.
#[derive(Debug, Deserialize)]
pub struct ConversationsCreateResponse {
    pub ok: bool,
    pub channel: Option<ConversationsCreateChannel>,
    pub error: Option<String>,
}

/// Channel info in `conversations.create` response.
#[derive(Debug, Deserialize)]
pub struct ConversationsCreateChannel {
    pub id: String,
    pub name: String,
}

/// Response from Slack's `conversations.list` API.
#[derive(Debug, Deserialize)]
pub struct ConversationsListResponse {
    pub ok: bool,
    pub channels: Option<Vec<ConversationsListChannel>>,
    pub error: Option<String>,
}

/// Channel info in `conversations.list` response.
#[derive(Debug, Deserialize)]
pub struct ConversationsListChannel {
    pub id: String,
    pub name: String,
}

/// Response from Slack's `oauth.v2.access` API.
#[derive(Debug, Deserialize)]
pub struct OAuthAccessResponse {
    pub ok: bool,
    pub access_token: Option<String>,
    pub team: Option<OAuthTeam>,
    pub authed_user: Option<OAuthAuthedUser>,
    pub error: Option<String>,
}

/// Team info in OAuth response.
#[derive(Debug, Deserialize)]
pub struct OAuthTeam {
    pub id: String,
    pub name: String,
}

/// Authed user info in OAuth response.
#[derive(Debug, Deserialize)]
pub struct OAuthAuthedUser {
    pub id: String,
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
    pub profile: Option<SlackUserProfile>,
}

/// Slack user profile with avatar.
#[derive(Debug, Deserialize)]
pub struct SlackUserProfile {
    pub display_name: Option<String>,
    pub real_name: Option<String>,
    pub image_48: Option<String>,
    pub image_72: Option<String>,
}
