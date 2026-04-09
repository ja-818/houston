//! Slack 2-way sync: bridges Houston conversations with Slack threads.
//!
//! ## Architecture
//!
//! - **Outbound** (Houston → Slack): Listens to Tauri "houston-event" emissions,
//!   posts `AssistantText` items to the correct Slack thread.
//! - **Inbound** (Slack → Houston): Consumes messages from the ChannelManager,
//!   routes thread replies to existing conversations and creates new activities
//!   for top-level messages.
//! - **Thread map**: Persisted in `.houston/slack_sync.json` per agent. Maps
//!   `session_key ↔ thread_ts`.

pub mod debounce;
pub mod finalize;
pub mod inbound;
pub mod manager;
pub mod outbound;
pub mod pending_reply;
pub mod thread_create;
pub mod thread_map;

pub use manager::SlackSyncManager;
