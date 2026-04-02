use std::collections::HashMap;

use crate::channel::Channel;
use crate::types::ChannelStatus;

/// Registry that manages multiple active channel adapters.
///
/// Each channel is identified by a unique string ID chosen by the caller.
pub struct ChannelRegistry {
    channels: HashMap<String, Box<dyn Channel>>,
}

impl ChannelRegistry {
    /// Create an empty registry.
    pub fn new() -> Self {
        Self {
            channels: HashMap::new(),
        }
    }

    /// Register a channel adapter under the given ID.
    ///
    /// If a channel with the same ID already exists, it is replaced.
    pub fn register(&mut self, id: String, channel: Box<dyn Channel>) {
        self.channels.insert(id, channel);
    }

    /// Remove and return a channel adapter by ID.
    pub fn unregister(&mut self, id: &str) -> Option<Box<dyn Channel>> {
        self.channels.remove(id)
    }

    /// Get a reference to a channel by ID.
    pub fn get(&self, id: &str) -> Option<&dyn Channel> {
        self.channels.get(id).map(|c| c.as_ref())
    }

    /// Get a mutable reference to a channel by ID.
    pub fn get_mut(&mut self, id: &str) -> Option<&mut Box<dyn Channel>> {
        self.channels.get_mut(id)
    }

    /// List all registered channels with their current status.
    pub fn list(&self) -> Vec<(&str, ChannelStatus)> {
        self.channels
            .iter()
            .map(|(id, ch)| (id.as_str(), ch.status()))
            .collect()
    }

    /// Connect all registered channels, returning per-channel results.
    pub async fn connect_all(&mut self) -> Vec<(String, anyhow::Result<()>)> {
        let mut results = Vec::new();
        for (id, channel) in &mut self.channels {
            let result = channel.connect().await;
            results.push((id.clone(), result));
        }
        results
    }

    /// Disconnect all registered channels, logging any errors.
    pub async fn disconnect_all(&mut self) {
        for (id, channel) in &mut self.channels {
            if let Err(err) = channel.disconnect().await {
                tracing::error!(channel_id = %id, error = %err, "failed to disconnect channel");
            }
        }
    }
}

impl Default for ChannelRegistry {
    fn default() -> Self {
        Self::new()
    }
}
