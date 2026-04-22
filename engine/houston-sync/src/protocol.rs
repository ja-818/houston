use serde::{Deserialize, Serialize};

/// Envelope for all sync messages flowing through the relay.
///
/// Payload is intentionally kept as raw JSON — the TypeScript package
/// `@houston-ai/sync-protocol` is the single source of truth for payload
/// shapes. The Rust layer only routes envelopes; it never interprets them.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncMessage {
    #[serde(rename = "type")]
    pub msg_type: String,
    pub from: SyncPeer,
    pub ts: String,
    pub payload: serde_json::Value,
}

/// Identifies which side sent a message.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SyncPeer {
    Desktop,
    Mobile,
    Relay,
}
