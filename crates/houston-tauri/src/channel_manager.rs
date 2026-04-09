//! Channel manager: bridges houston-channels adapters with the Tauri event system.
//!
//! Start/stop channels, consume incoming messages, send responses.
//! The app receives `(registry_id, message)` tuples and decides how to route them.

use houston_channels::{
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
                tracing::info!(
                    registry_id = %registry_id,
                    "[channel_manager] forwarder task started"
                );
                while let Some(msg) = rx.recv().await {
                    tracing::info!(
                        registry_id = %registry_id,
                        sender = %msg.sender_name,
                        text_preview = %msg.text.chars().take(40).collect::<String>(),
                        "[channel_manager] forwarding adapter message → manager tx"
                    );
                    if tx.send((registry_id.clone(), msg)).is_err() {
                        tracing::warn!(
                            registry_id = %registry_id,
                            "[channel_manager] manager tx dropped — forwarder exiting"
                        );
                        break;
                    }
                }
                tracing::warn!(
                    registry_id = %registry_id,
                    "[channel_manager] adapter rx closed — forwarder exiting"
                );
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

/// Auto-reconnect channels that were connected before app restart.
/// Queries the `channels` table for rows with `status = 'connected'`,
/// parses their config, and starts each one.
pub async fn auto_reconnect(db: &houston_db::Database, mgr: &ChannelManager) {
    let query = "SELECT id, channel_type, config FROM channels WHERE status = 'connected'";
    let rows = match db.conn().query(query, libsql::params![]).await {
        Ok(rows) => rows,
        Err(e) => {
            tracing::error!("[channels] auto-reconnect query failed: {e}");
            return;
        }
    };

    let mut rows = rows;
    while let Ok(Some(row)) = rows.next().await {
        let id: String = row.get(0).unwrap_or_default();
        let ch_type: String = row.get(1).unwrap_or_default();
        let config_str: String = row.get(2).unwrap_or_default();
        if let Ok(config_val) = serde_json::from_str::<serde_json::Value>(&config_str) {
            let token = config_val
                .get("token")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_string();
            let config = ChannelConfig {
                channel_type: ch_type.clone(),
                token,
                extra: config_val,
            };
            if let Err(e) = mgr.start_channel(id.clone(), config).await {
                tracing::error!("[channels] auto-reconnect failed for {id} ({ch_type}): {e}");
            } else {
                tracing::info!("[channels] auto-reconnected {id} ({ch_type})");
            }
        }
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
