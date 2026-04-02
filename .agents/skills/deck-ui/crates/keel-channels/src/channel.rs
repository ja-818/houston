use crate::types::{ChannelMessage, ChannelStatus};
use tokio::sync::mpsc;

/// Trait for a messaging platform channel adapter.
///
/// Implementors manage the connection lifecycle and message flow for a
/// specific platform (Slack, Telegram, etc.). Incoming messages are pushed
/// into an mpsc channel that the consumer retrieves via [`Channel::message_receiver`].
#[async_trait::async_trait]
pub trait Channel: Send + Sync {
    /// Connect to the messaging platform.
    async fn connect(&mut self) -> anyhow::Result<()>;

    /// Disconnect from the platform.
    async fn disconnect(&mut self) -> anyhow::Result<()>;

    /// Send a text message to a specific channel or chat.
    async fn send_message(&self, channel_id: &str, text: &str) -> anyhow::Result<()>;

    /// Show a typing/activity indicator in the chat. No-op by default.
    /// Platforms that support it (Telegram) override this.
    async fn send_typing(&self, _channel_id: &str) -> anyhow::Result<()> {
        Ok(())
    }

    /// Get the current connection status.
    fn status(&self) -> ChannelStatus;

    /// Get the channel type name (e.g., "slack", "telegram").
    fn channel_type(&self) -> &str;

    /// Take the receiver for incoming messages.
    ///
    /// Returns `None` if the receiver has already been taken. The caller
    /// is responsible for driving the receiver to consume incoming messages.
    fn message_receiver(&mut self) -> Option<mpsc::UnboundedReceiver<ChannelMessage>>;
}
