//! Live "Thinking…/text" placeholder state for one Slack thread.
//!
//! State machine for what gets shown in Slack as the model works through
//! a turn:
//!
//! - `Thinking → Text`: edit current message in place
//! - `Text → Text`: edit current message in place
//! - `Text → Thinking`: post a NEW `_Thinking…_` message in the same
//!   thread (don't edit the prior text — leave it as a permanent reply)
//! - `Thinking → Thinking`: no-op
//!
//! End-of-turn:
//! - Visible Text → leave it (already final)
//! - Visible Thinking + final desired Text → edit to that text
//! - Visible Thinking + final desired Thinking → delete the trailing
//!   placeholder (don't leave a useless ghost message)
//!
//! ## Storage
//! - In-memory only (not persisted). App restart mid-turn leaves a stale
//!   `_Thinking…_` in Slack until the next turn overwrites it.
//! - Keyed by `session_key`. One *current* placeholder per conversation
//!   (older placeholders that have been "frozen" as text replies are
//!   not tracked — once edited to text they belong to the thread).
//!
//! Debouncing of edits lives in the sibling `debounce` module.

use std::time::Instant;

use super::manager::SlackSyncManager;

/// What the live placeholder message is (or should be) showing.
/// Used for both the "currently visible" state and the "desired next" state.
#[derive(Clone)]
pub enum ReplyState {
    /// Model is doing something non-textual (tool call, reasoning, waiting).
    Thinking,
    /// Model produced user-facing text — show this verbatim.
    Text(String),
}

// Re-export under the old name so existing call sites compile unchanged.
pub use ReplyState as DesiredState;

/// In-memory state tracking the current live placeholder for one
/// conversation. Fields are `pub(super)` so the sibling `debounce`
/// module can read/write them without going through getters.
pub(super) struct PendingReply {
    /// The Slack `ts` of the message we're currently editing. Changes when
    /// we post a NEW `_Thinking…_` message after a Text→Thinking transition.
    pub(super) placeholder_ts: String,
    pub(super) bot_token: String,
    pub(super) channel_id: String,
    /// Thread root we're posting under — needed when we have to post a
    /// fresh `_Thinking…_` message mid-turn (Text→Thinking transition).
    pub(super) thread_ts: String,
    pub(super) agent_name: String,
    pub(super) icon_url: Option<String>,
    /// What's actually currently showing in Slack right now.
    pub(super) visible_state: ReplyState,
    /// What we want to show on the next flush.
    pub(super) desired_state: ReplyState,
    pub(super) last_edit_at: Instant,
    /// True if a debounced flush is already scheduled — prevents stacked spawns.
    pub(super) flush_scheduled: bool,
}

/// Post the FIRST `_Thinking…_` placeholder for a turn and remember its
/// `ts`. Subsequent state changes are handled by the `debounce` module.
///
/// `channel_id` and `thread_ts` come from the **incoming Slack message**, not
/// from the agent's stored config — the user's mental model is "Thinking
/// should appear as a reply in the thread where I just typed", regardless
/// of what the agent's home channel happens to be.
pub async fn post_thinking_placeholder(
    mgr: &mut SlackSyncManager,
    agent_path: &str,
    session_key: &str,
    channel_id: &str,
    thread_ts: &str,
) -> Result<(), String> {
    let session = match mgr.session_for_agent(agent_path) {
        Some(s) => s,
        None => {
            tracing::warn!(
                agent_path = %agent_path,
                "[slack-sync pending_reply] no sync session for agent — skipping placeholder"
            );
            return Ok(());
        }
    };
    let bot_token = session.config.bot_token.clone();
    let agent_name = session.agent_name.clone();
    let icon_url = session.config.agent_icon_url.clone();
    let channel_id = channel_id.to_string();
    let thread_ts = thread_ts.to_string();

    tracing::info!(
        session_key = %session_key,
        channel_id = %channel_id,
        thread_ts = %thread_ts,
        "[slack-sync pending_reply] posting initial _Thinking…_ placeholder"
    );

    let placeholder_ts = post_new_thinking(
        &bot_token,
        &channel_id,
        &thread_ts,
        &agent_name,
        icon_url.as_deref(),
    )
    .await?;

    mgr.pending_replies.insert(
        session_key.to_string(),
        PendingReply {
            placeholder_ts,
            bot_token,
            channel_id,
            thread_ts,
            agent_name,
            icon_url,
            visible_state: ReplyState::Thinking,
            desired_state: ReplyState::Thinking,
            last_edit_at: Instant::now(),
            flush_scheduled: false,
        },
    );

    Ok(())
}

/// Post a fresh `_Thinking…_` message under the same thread root.
/// Returns the new message's `ts`. Used both for the initial placeholder
/// and by the debouncer when the model transitions Text → Thinking.
pub(super) async fn post_new_thinking(
    bot_token: &str,
    channel_id: &str,
    thread_ts: &str,
    agent_name: &str,
    icon_url: Option<&str>,
) -> Result<String, String> {
    let result = houston_channels::slack::api::post_message_as(
        bot_token,
        channel_id,
        houston_channels::slack::api::THINKING_TEXT,
        Some(thread_ts),
        Some(agent_name),
        icon_url,
    )
    .await
    .map_err(|e| {
        tracing::error!(
            error = %e,
            "[slack-sync pending_reply] post_message_as for new Thinking FAILED"
        );
        e.to_string()
    })?;

    let ts = result
        .message_ts
        .ok_or("no ts in placeholder post_message response")?;
    tracing::info!(
        new_placeholder_ts = %ts,
        "[slack-sync pending_reply] posted new _Thinking…_ message"
    );
    Ok(ts)
}

