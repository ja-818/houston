pub mod polling;
pub mod types;

use anyhow::Context;
use tokio::sync::mpsc;
use tokio::task::JoinHandle;

use crate::channel::Channel;
use crate::types::{ChannelMessage, ChannelStatus};

use self::types::{GetMeResponse, SendMessageResponse};

/// Telegram channel adapter using long polling.
pub struct TelegramChannel {
    bot_token: String,
    status: ChannelStatus,
    tx: mpsc::UnboundedSender<ChannelMessage>,
    rx: Option<mpsc::UnboundedReceiver<ChannelMessage>>,
    poll_handle: Option<JoinHandle<()>>,
    http_client: reqwest::Client,
}

impl TelegramChannel {
    /// Create a new Telegram channel adapter.
    ///
    /// - `bot_token`: Telegram bot token from BotFather.
    pub fn new(bot_token: String) -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        Self {
            bot_token,
            status: ChannelStatus::Disconnected,
            tx,
            rx: Some(rx),
            poll_handle: None,
            http_client: reqwest::Client::new(),
        }
    }

    /// Verify the bot token by calling Telegram's `getMe` endpoint.
    async fn verify_token(&self) -> anyhow::Result<()> {
        let url = format!(
            "https://api.telegram.org/bot{}/getMe",
            self.bot_token
        );

        let resp = self
            .http_client
            .get(&url)
            .send()
            .await
            .context("failed to call getMe")?;

        let body: GetMeResponse = resp
            .json()
            .await
            .context("failed to parse getMe response")?;

        if !body.ok {
            let desc = body
                .description
                .unwrap_or_else(|| "unknown error".to_string());
            return Err(anyhow::anyhow!("getMe failed: {}", desc));
        }

        if let Some(user) = &body.result {
            let name = user.first_name.as_deref().unwrap_or("unknown");
            tracing::info!(bot_name = %name, "Telegram bot token verified");
        }

        Ok(())
    }
}

#[async_trait::async_trait]
impl Channel for TelegramChannel {
    async fn connect(&mut self) -> anyhow::Result<()> {
        self.status = ChannelStatus::Connecting;
        tracing::info!("connecting to Telegram via long polling");

        if let Err(err) = self.verify_token().await {
            let msg = format!("Telegram token verification failed: {err}");
            self.status = ChannelStatus::Error(msg.clone());
            return Err(err).context(msg);
        }

        let token = self.bot_token.clone();
        let tx = self.tx.clone();
        let handle = tokio::spawn(async move {
            if let Err(err) = polling::start_polling(token, tx).await {
                tracing::error!(error = %err, "Telegram polling exited with error");
            }
        });

        self.poll_handle = Some(handle);
        self.status = ChannelStatus::Connected;
        tracing::info!("connected to Telegram");

        Ok(())
    }

    async fn disconnect(&mut self) -> anyhow::Result<()> {
        tracing::info!("disconnecting from Telegram");

        if let Some(handle) = self.poll_handle.take() {
            handle.abort();
        }

        self.status = ChannelStatus::Disconnected;
        Ok(())
    }

    async fn send_message(&self, channel_id: &str, text: &str) -> anyhow::Result<()> {
        let url = format!(
            "https://api.telegram.org/bot{}/sendMessage",
            self.bot_token
        );

        let body = serde_json::json!({
            "chat_id": channel_id,
            "text": text,
        });

        let resp = self
            .http_client
            .post(&url)
            .json(&body)
            .send()
            .await
            .context("failed to call sendMessage")?;

        let result: SendMessageResponse = resp
            .json()
            .await
            .context("failed to parse sendMessage response")?;

        if !result.ok {
            let desc = result
                .description
                .unwrap_or_else(|| "unknown error".to_string());
            return Err(anyhow::anyhow!("sendMessage failed: {}", desc));
        }

        Ok(())
    }

    fn status(&self) -> ChannelStatus {
        self.status.clone()
    }

    fn channel_type(&self) -> &str {
        "telegram"
    }

    fn message_receiver(&mut self) -> Option<mpsc::UnboundedReceiver<ChannelMessage>> {
        self.rx.take()
    }
}

impl Drop for TelegramChannel {
    fn drop(&mut self) {
        if let Some(handle) = self.poll_handle.take() {
            handle.abort();
        }
    }
}
