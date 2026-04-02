//! Channel manager: bridges keel-channels adapters with the Tauri event system.
//!
//! Start/stop channels, consume incoming messages, send responses.
//! The app receives `(registry_id, message)` tuples and decides how to route them.

use keel_channels::{
    Channel, ChannelConfig, ChannelMessage, ChannelRegistry, ChannelStatus,
    SlackChannel, TelegramChannel,
};
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

/// A channel message tagged with the registry ID of the channel it came from.
pub type RoutedMessage = (String, ChannelMessage);

/// Manages live channel connections and routes incoming messages.
pub struct ChannelManager {
    registry: Arc<RwLock<ChannelRegistry>>,
    message_tx: mpsc::UnboundedSender<RoutedMessage>,
}

impl ChannelManager {
    /// Create a new channel manager. Returns the manager and a receiver
    /// for incoming `(registry_id, message)` tuples from all connected channels.
    pub fn new() -> (Self, mpsc::UnboundedReceiver<RoutedMessage>) {
        let (tx, rx) = mpsc::unbounded_channel();
        let mgr = Self {
            registry: Arc::new(RwLock::new(ChannelRegistry::new())),
            message_tx: tx,
        };
        (mgr, rx)
    }

    /// Start a channel adapter from config. Connects and begins consuming messages.
    pub async fn start_channel(
        &self,
        id: String,
        config: ChannelConfig,
    ) -> Result<(), String> {
        let mut adapter = create_adapter(&config)?;
        adapter.connect().await.map_err(|e| e.to_string())?;

        // Take the message receiver and spawn a forwarder task.
        if let Some(mut rx) = adapter.message_receiver() {
            let tx = self.message_tx.clone();
            let registry_id = id.clone();
            tokio::spawn(async move {
                while let Some(msg) = rx.recv().await {
                    if tx.send((registry_id.clone(), msg)).is_err() {
                        break; // Manager dropped
                    }
                }
            });
        }

        self.registry.write().await.register(id, adapter);
        Ok(())
    }

    /// Stop and remove a channel adapter.
    pub async fn stop_channel(&self, id: &str) -> Result<(), String> {
        let mut reg = self.registry.write().await;
        if let Some(mut ch) = reg.unregister(id) {
            ch.disconnect().await.map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    /// Show a typing indicator on a specific channel.
    pub async fn send_typing(
        &self,
        registry_id: &str,
        target: &str,
    ) -> Result<(), String> {
        let reg = self.registry.read().await;
        let ch = reg.get(registry_id).ok_or("Channel not found")?;
        ch.send_typing(target).await.map_err(|e| e.to_string())
    }

    /// Send a message to a specific channel by its registry ID.
    pub async fn send_message(
        &self,
        registry_id: &str,
        target: &str,
        text: &str,
    ) -> Result<(), String> {
        let reg = self.registry.read().await;
        let ch = reg.get(registry_id).ok_or("Channel not found")?;
        ch.send_message(target, text).await.map_err(|e| e.to_string())
    }

    /// List all registered channels and their statuses.
    pub async fn list(&self) -> Vec<(String, ChannelStatus)> {
        self.registry
            .read()
            .await
            .list()
            .into_iter()
            .map(|(id, s)| (id.to_string(), s))
            .collect()
    }
}

/// Create a channel adapter from config.
fn create_adapter(config: &ChannelConfig) -> Result<Box<dyn Channel>, String> {
    match config.channel_type.as_str() {
        "telegram" => Ok(Box::new(TelegramChannel::new(config.token.clone()))),
        "slack" => {
            let app_token = config
                .extra
                .get("app_token")
                .and_then(|v| v.as_str())
                .ok_or("Slack requires 'app_token' in extra config")?
                .to_string();
            Ok(Box::new(SlackChannel::new(
                config.token.clone(),
                app_token,
            )))
        }
        other => Err(format!("Unknown channel type: {other}")),
    }
}
