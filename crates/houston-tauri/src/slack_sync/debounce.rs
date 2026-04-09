//! Debounced state-machine driver for the live Slack placeholder.
//!
//! Coalesces rapid FeedItem state changes into at most one Slack API call
//! per `DEBOUNCE` window per session_key, while always flushing the latest
//! desired state. The state machine itself (Thinking ↔ Text transitions)
//! lives here too — see `decide_action` for the truth table.

use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

use super::manager::SlackSyncManager;
use super::pending_reply::{post_new_thinking, PendingReply, ReplyState};

const DEBOUNCE: Duration = Duration::from_millis(2000);

/// What the flush phase should do, decided under lock and executed without it.
enum FlushAction {
    /// Already in the desired state — no API call.
    Noop,
    /// Edit current placeholder to this text. (Could also be Thinking text,
    /// but in practice we only edit on Text→Text or Thinking→Text.)
    Edit { text: String },
    /// Post a brand-new `_Thinking…_` message in the same thread, used on
    /// Text→Thinking transitions so the prior text becomes a permanent reply.
    PostNewThinking,
}

/// Snapshot of everything needed to perform a flush without holding the lock.
struct FlushContext {
    bot_token: String,
    channel_id: String,
    thread_ts: String,
    placeholder_ts: String,
    agent_name: String,
    icon_url: Option<String>,
    action: FlushAction,
    /// What `visible_state` should become after the flush succeeds.
    next_visible: ReplyState,
}

/// Public entry point: the model emitted a new state for this conversation.
/// Coalesces with any in-flight changes via the debouncer.
pub async fn set_reply_state(
    manager: Arc<RwLock<SlackSyncManager>>,
    session_key: String,
    state: ReplyState,
) {
    let context = {
        let mut mgr = manager.write().await;
        let pending = match mgr.pending_replies.get_mut(&session_key) {
            Some(p) => p,
            None => {
                tracing::debug!(
                    session_key = %session_key,
                    "[slack-sync debounce] set_reply_state called but no pending reply"
                );
                return;
            }
        };
        pending.desired_state = state;

        if pending.last_edit_at.elapsed() >= DEBOUNCE {
            pending.last_edit_at = Instant::now();
            pending.flush_scheduled = false;
            Some(build_flush_context(pending))
        } else if !pending.flush_scheduled {
            pending.flush_scheduled = true;
            None
        } else {
            None
        }
    };

    match context {
        Some(ctx) => execute_flush(&manager, &session_key, ctx).await,
        None => schedule_debounced(manager, session_key),
    }
}

/// Translate the current (visible_state → desired_state) into an action,
/// and snapshot all data needed to execute it without the lock.
fn build_flush_context(pending: &mut PendingReply) -> FlushContext {
    let action = decide_action(&pending.visible_state, &pending.desired_state);
    let next_visible = pending.desired_state.clone();
    FlushContext {
        bot_token: pending.bot_token.clone(),
        channel_id: pending.channel_id.clone(),
        thread_ts: pending.thread_ts.clone(),
        placeholder_ts: pending.placeholder_ts.clone(),
        agent_name: pending.agent_name.clone(),
        icon_url: pending.icon_url.clone(),
        action,
        next_visible,
    }
}

/// State-machine truth table.
fn decide_action(visible: &ReplyState, desired: &ReplyState) -> FlushAction {
    match (visible, desired) {
        // Same state → nothing to do.
        (ReplyState::Thinking, ReplyState::Thinking) => FlushAction::Noop,
        // Edit current placeholder to the new text (works for Thinking→Text and Text→Text).
        (_, ReplyState::Text(t)) => FlushAction::Edit { text: t.clone() },
        // Text→Thinking: leave the prior text as a permanent reply, post a new placeholder.
        (ReplyState::Text(_), ReplyState::Thinking) => FlushAction::PostNewThinking,
    }
}

/// Run a flush context against Slack, then update the manager state.
async fn execute_flush(
    manager: &Arc<RwLock<SlackSyncManager>>,
    session_key: &str,
    ctx: FlushContext,
) {
    let new_placeholder_ts: Option<String> = match &ctx.action {
        FlushAction::Noop => None,
        FlushAction::Edit { text } => {
            if let Err(e) = houston_channels::slack::api::update_message(
                &ctx.bot_token,
                &ctx.channel_id,
                &ctx.placeholder_ts,
                text,
            )
            .await
            {
                tracing::error!("[slack-sync] update_message failed: {e}");
                return;
            }
            None
        }
        FlushAction::PostNewThinking => {
            match post_new_thinking(
                &ctx.bot_token,
                &ctx.channel_id,
                &ctx.thread_ts,
                &ctx.agent_name,
                ctx.icon_url.as_deref(),
            )
            .await
            {
                Ok(ts) => Some(ts),
                Err(e) => {
                    tracing::error!("[slack-sync] post new thinking failed: {e}");
                    return;
                }
            }
        }
    };

    // Update visible_state (and placeholder_ts on PostNewThinking).
    let mut mgr = manager.write().await;
    if let Some(pending) = mgr.pending_replies.get_mut(session_key) {
        pending.visible_state = ctx.next_visible;
        if let Some(new_ts) = new_placeholder_ts {
            pending.placeholder_ts = new_ts;
        }
    }
}

/// Spawn a debounced task to flush after the DEBOUNCE window.
fn schedule_debounced(manager: Arc<RwLock<SlackSyncManager>>, session_key: String) {
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(DEBOUNCE).await;
        let context = {
            let mut mgr = manager.write().await;
            let pending = match mgr.pending_replies.get_mut(&session_key) {
                Some(p) => p,
                None => return, // Finalized while we slept
            };
            if !pending.flush_scheduled {
                return; // Already flushed by another path
            }
            pending.flush_scheduled = false;
            pending.last_edit_at = Instant::now();
            build_flush_context(pending)
        };
        execute_flush(&manager, &session_key, context).await;
    });
}
