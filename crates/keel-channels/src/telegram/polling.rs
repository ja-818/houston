use anyhow::Context;
use chrono::{DateTime, Utc};
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::types::{Attachment, ChannelMessage};

use super::types::{GetUpdatesResponse, TelegramMessage, Update};

const POLL_TIMEOUT_SECS: u64 = 30;

/// Fetch updates from the Telegram Bot API using long polling.
///
/// - `token`: Bot token for authentication.
/// - `offset`: Update offset (last processed update_id + 1), or 0 for the first call.
/// - `timeout`: Long poll timeout in seconds.
pub async fn poll_updates(
    client: &reqwest::Client,
    token: &str,
    offset: i64,
    timeout: u64,
) -> anyhow::Result<Vec<Update>> {
    let url = format!("https://api.telegram.org/bot{token}/getUpdates");

    let resp = client
        .get(&url)
        .query(&[
            ("offset", offset.to_string()),
            ("timeout", timeout.to_string()),
        ])
        .timeout(std::time::Duration::from_secs(timeout + 10))
        .send()
        .await
        .context("failed to call getUpdates")?;

    let body: GetUpdatesResponse = resp
        .json()
        .await
        .context("failed to parse getUpdates response")?;

    if !body.ok {
        let desc = body
            .description
            .unwrap_or_else(|| "unknown error".to_string());
        return Err(anyhow::anyhow!("getUpdates failed: {}", desc));
    }

    Ok(body.result.unwrap_or_default())
}

/// Run a long-polling loop, converting Telegram updates into [`ChannelMessage`]
/// values and forwarding them to `tx`.
///
/// Runs until the receiver is dropped or an unrecoverable error occurs.
/// The caller should spawn this as a tokio task.
pub async fn start_polling(
    token: String,
    tx: mpsc::UnboundedSender<ChannelMessage>,
) -> anyhow::Result<()> {
    let client = reqwest::Client::new();
    let mut offset: i64 = 0;

    tracing::info!("starting Telegram long polling");

    loop {
        let updates = match poll_updates(&client, &token, offset, POLL_TIMEOUT_SECS).await {
            Ok(u) => u,
            Err(err) => {
                tracing::warn!(error = %err, "Telegram poll error, retrying");
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                continue;
            }
        };

        for update in updates {
            // Advance offset past this update.
            offset = update.update_id + 1;

            let tg_msg = match update.message {
                Some(m) => m,
                None => continue,
            };

            let channel_message = telegram_message_to_channel_message(&tg_msg);

            if tx.send(channel_message).is_err() {
                tracing::warn!("message receiver dropped, stopping Telegram polling");
                return Ok(());
            }
        }
    }
}

/// Convert a Telegram message into a platform-agnostic [`ChannelMessage`].
fn telegram_message_to_channel_message(msg: &TelegramMessage) -> ChannelMessage {
    let sender_id = msg
        .from
        .as_ref()
        .map(|u| u.id.to_string())
        .unwrap_or_default();

    let sender_name = msg
        .from
        .as_ref()
        .map(|u| {
            let first = u.first_name.as_deref().unwrap_or("");
            let last = u.last_name.as_deref().unwrap_or("");
            format!("{first} {last}").trim().to_string()
        })
        .unwrap_or_default();

    let reply_to = msg
        .reply_to_message
        .as_ref()
        .map(|r| r.message_id.to_string());

    let mut attachments = Vec::new();

    if let Some(doc) = &msg.document {
        attachments.push(Attachment {
            name: doc
                .file_name
                .clone()
                .unwrap_or_else(|| "document".to_string()),
            url: None, // Telegram file URLs require a separate getFile call.
            mime_type: doc.mime_type.clone(),
            size: doc.file_size,
        });
    }

    if let Some(photos) = &msg.photo {
        // Use the largest photo variant (last in the array).
        if let Some(photo) = photos.last() {
            attachments.push(Attachment {
                name: "photo".to_string(),
                url: None,
                mime_type: Some("image/jpeg".to_string()),
                size: photo.file_size,
            });
        }
    }

    let timestamp: DateTime<Utc> = DateTime::from_timestamp(msg.date, 0).unwrap_or_else(Utc::now);

    ChannelMessage {
        id: Uuid::new_v4().to_string(),
        source: "telegram".to_string(),
        channel_id: msg.chat.id.to_string(),
        sender_id,
        sender_name,
        text: msg.text.clone().unwrap_or_default(),
        timestamp,
        reply_to,
        attachments,
    }
}
