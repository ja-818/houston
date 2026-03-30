//! # keel-channels
//!
//! A generic channel adapter system for messaging platforms.
//!
//! This crate provides a [`Channel`] trait that abstracts over different
//! messaging platforms (Slack, Telegram, etc.) and a [`ChannelRegistry`]
//! for managing multiple active channel connections.
//!
//! ## Architecture
//!
//! Each channel adapter owns its own tokio tasks for receiving messages.
//! Incoming messages are pushed into an mpsc channel as [`ChannelMessage`]
//! values that the consuming application polls.
//!
//! This crate is intentionally decoupled from `keel-events` — it produces
//! raw [`ChannelMessage`] values and the application is responsible for
//! mapping them into its own event types.

pub mod channel;
pub mod registry;
pub mod slack;
pub mod telegram;
pub mod types;

// Re-export primary types for convenience.
pub use channel::Channel;
pub use registry::ChannelRegistry;
pub use slack::SlackChannel;
pub use telegram::TelegramChannel;
pub use types::{Attachment, ChannelConfig, ChannelMessage, ChannelStatus};
