use anyhow::{anyhow, Context};
use chrono::Utc;
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message;
use uuid::Uuid;

use crate::types::{Attachment, ChannelMessage};

use super::types::{ConnectionsOpenResponse, SlackEnvelope, SocketModeAck};

/// Request a WebSocket URL from Slack's `apps.connections.open` endpoint.
///
/// Requires an app-level token (xapp-...) with the `connections:write` scope.
pub async fn connect_socket_mode(app_token: &str) -> anyhow::Result<String> {
    let client = reqwest::Client::new();
    let resp = client
        .post("https://slack.com/api/apps.connections.open")
        .bearer_auth(app_token)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .send()
        .await
        .context("failed to call apps.connections.open")?;

    let body: ConnectionsOpenResponse = resp
        .json()
        .await
        .context("failed to parse apps.connections.open response")?;

    if !body.ok {
        let err_msg = body.error.unwrap_or_else(|| "unknown error".to_string());
        return Err(anyhow!("apps.connections.open failed: {}", err_msg));
    }

    body.url
        .ok_or_else(|| anyhow!("apps.connections.open returned ok but no url"))
}

/// Listen on a Socket Mode WebSocket, forwarding incoming messages to `tx`.
///
/// This function runs indefinitely until the WebSocket closes or an
/// unrecoverable error occurs. The caller should spawn this as a tokio task.
pub async fn listen_socket_mode(
    ws_url: &str,
    tx: mpsc::UnboundedSender<ChannelMessage>,
) -> anyhow::Result<()> {
    let (ws_stream, _) = tokio_tungstenite::connect_async(ws_url)
        .await
        .context("failed to connect to Slack Socket Mode WebSocket")?;

    tracing::info!("connected to Slack Socket Mode WebSocket");

    let (mut write, mut read) = ws_stream.split();

    while let Some(msg_result) = read.next().await {
        let msg = match msg_result {
            Ok(m) => m,
            Err(err) => {
                tracing::error!(error = %err, "WebSocket read error");
                break;
            }
        };

        let text = match msg {
            Message::Text(t) => t,
            Message::Close(_) => {
                tracing::info!("Slack WebSocket closed by server");
                break;
            }
            Message::Ping(data) => {
                if let Err(err) = write.send(Message::Pong(data)).await {
                    tracing::error!(error = %err, "failed to send pong");
                }
                continue;
            }
            _ => continue,
        };

        let envelope: SlackEnvelope = match serde_json::from_str(&text) {
            Ok(e) => e,
            Err(err) => {
                tracing::warn!(error = %err, "failed to parse Slack envelope");
                continue;
            }
        };

        // Acknowledge the envelope immediately to prevent retries.
        let ack = SocketModeAck {
            envelope_id: envelope.envelope_id.clone(),
        };
        if let Ok(ack_json) = serde_json::to_string(&ack) {
            if let Err(err) = write.send(Message::Text(ack_json.into())).await {
                tracing::error!(error = %err, "failed to send envelope ack");
            }
        }

        // Only process event_callback envelopes containing message events.
        if envelope.envelope_type != "events_api" {
            continue;
        }

        let event = match envelope
            .payload
            .and_then(|p| p.event)
        {
            Some(e) => e,
            None => continue,
        };

        // Skip non-message events and message subtypes (edits, joins, etc.).
        let event_type = event.event_type.as_deref().unwrap_or("");
        if event_type != "message" || event.subtype.is_some() {
            continue;
        }

        let text_content = event.text.unwrap_or_default();
        let channel_id = event.channel.unwrap_or_default();
        let sender_id = event.user.unwrap_or_default();

        let attachments: Vec<Attachment> = event
            .files
            .unwrap_or_default()
            .into_iter()
            .map(|f| Attachment {
                name: f.name.unwrap_or_else(|| "unnamed".to_string()),
                url: f.url_private,
                mime_type: f.mimetype,
                size: f.size,
            })
            .collect();

        let channel_message = ChannelMessage {
            id: Uuid::new_v4().to_string(),
            source: "slack".to_string(),
            channel_id,
            sender_id: sender_id.clone(),
            sender_name: sender_id, // Resolved by the app layer if needed.
            text: text_content,
            timestamp: Utc::now(),
            reply_to: event.thread_ts,
            attachments,
        };

        if tx.send(channel_message).is_err() {
            tracing::warn!("message receiver dropped, stopping Socket Mode listener");
            break;
        }
    }

    Ok(())
}
