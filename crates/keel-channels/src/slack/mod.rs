pub mod socket_mode;
pub mod types;

use anyhow::Context;
use tokio::sync::mpsc;
use tokio::task::JoinHandle;

use crate::channel::Channel;
use crate::types::{ChannelMessage, ChannelStatus};

use self::types::PostMessageResponse;

/// Slack channel adapter using Socket Mode (WebSocket).
///
/// Requires both a bot token (xoxb-...) and an app-level token (xapp-...)
/// with the `connections:write` scope for Socket Mode.
pub struct SlackChannel {
    bot_token: String,
    app_token: String,
    status: ChannelStatus,
    tx: mpsc::UnboundedSender<ChannelMessage>,
    rx: Option<mpsc::UnboundedReceiver<ChannelMessage>>,
    listen_handle: Option<JoinHandle<()>>,
    http_client: reqwest::Client,
}

impl SlackChannel {
    /// Create a new Slack channel adapter.
    ///
    /// - `bot_token`: Slack bot token (xoxb-...) for sending messages.
    /// - `app_token`: Slack app-level token (xapp-...) for Socket Mode.
    pub fn new(bot_token: String, app_token: String) -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        Self {
            bot_token,
            app_token,
            status: ChannelStatus::Disconnected,
            tx,
            rx: Some(rx),
            listen_handle: None,
            http_client: reqwest::Client::new(),
        }
    }
}

#[async_trait::async_trait]
impl Channel for SlackChannel {
    async fn connect(&mut self) -> anyhow::Result<()> {
        self.status = ChannelStatus::Connecting;
        tracing::info!("connecting to Slack via Socket Mode");

        let ws_url = match socket_mode::connect_socket_mode(&self.app_token).await {
            Ok(url) => url,
            Err(err) => {
                let msg = format!("failed to open Socket Mode connection: {err}");
                self.status = ChannelStatus::Error(msg.clone());
                return Err(err).context(msg);
            }
        };

        let tx = self.tx.clone();
        let ws_url_owned = ws_url.clone();
        let handle = tokio::spawn(async move {
            if let Err(err) = socket_mode::listen_socket_mode(&ws_url_owned, tx).await {
                tracing::error!(error = %err, "Slack Socket Mode listener exited with error");
            }
        });

        self.listen_handle = Some(handle);
        self.status = ChannelStatus::Connected;
        tracing::info!("connected to Slack Socket Mode");

        Ok(())
    }

    async fn disconnect(&mut self) -> anyhow::Result<()> {
        tracing::info!("disconnecting from Slack");

        if let Some(handle) = self.listen_handle.take() {
            handle.abort();
        }

        self.status = ChannelStatus::Disconnected;
        Ok(())
    }

    async fn send_message(&self, channel_id: &str, text: &str) -> anyhow::Result<()> {
        let body = serde_json::json!({
            "channel": channel_id,
            "text": text,
        });

        let resp = self
            .http_client
            .post("https://slack.com/api/chat.postMessage")
            .bearer_auth(&self.bot_token)
            .json(&body)
            .send()
            .await
            .context("failed to call chat.postMessage")?;

        let result: PostMessageResponse = resp
            .json()
            .await
            .context("failed to parse chat.postMessage response")?;

        if !result.ok {
            let err_msg = result.error.unwrap_or_else(|| "unknown error".to_string());
            return Err(anyhow::anyhow!("chat.postMessage failed: {}", err_msg));
        }

        Ok(())
    }

    fn status(&self) -> ChannelStatus {
        self.status.clone()
    }

    fn channel_type(&self) -> &str {
        "slack"
    }

    fn message_receiver(&mut self) -> Option<mpsc::UnboundedReceiver<ChannelMessage>> {
        self.rx.take()
    }
}

impl Drop for SlackChannel {
    fn drop(&mut self) {
        if let Some(handle) = self.listen_handle.take() {
            handle.abort();
        }
    }
}
