//! End-of-turn finalization for the live placeholder.
//!
//! Called when `SessionStatus = Completed` or `Error` arrives. Cleans up
//! the live placeholder so the thread is left in a sensible state:
//!
//! - Visible Text → leave as-is (already showing the final answer)
//! - Visible Thinking + desired Text → edit current to that text
//! - Visible Thinking + desired Thinking → delete the trailing placeholder
//! - Error → edit current message to the error text

use super::manager::SlackSyncManager;
use super::pending_reply::ReplyState;

/// End-of-turn outcome for a pending reply.
pub enum Outcome {
    Completed,
    Error(String),
}

pub async fn finalize_reply(
    mgr: &mut SlackSyncManager,
    session_key: &str,
    outcome: Outcome,
) {
    let pending = match mgr.pending_replies.remove(session_key) {
        Some(p) => p,
        None => return,
    };

    if let Outcome::Error(e) = outcome {
        let truncated = if e.len() > 200 {
            format!("{}…", &e[..200])
        } else {
            e
        };
        let text = format!("⚠️ Agent hit an error: {truncated}");
        if let Err(e) = houston_channels::slack::api::update_message(
            &pending.bot_token,
            &pending.channel_id,
            &pending.placeholder_ts,
            &text,
        )
        .await
        {
            tracing::error!("[slack-sync] finalize error-update failed: {e}");
        }
        return;
    }

    // Outcome::Completed
    match (&pending.visible_state, &pending.desired_state) {
        // The latest text never flushed — push it now.
        (ReplyState::Thinking, ReplyState::Text(t)) => {
            if let Err(e) = houston_channels::slack::api::update_message(
                &pending.bot_token,
                &pending.channel_id,
                &pending.placeholder_ts,
                t,
            )
            .await
            {
                tracing::error!("[slack-sync] finalize text-update failed: {e}");
            }
        }
        // Trailing Thinking with no text waiting — delete the ghost message.
        (ReplyState::Thinking, ReplyState::Thinking) => {
            if let Err(e) = houston_channels::slack::api::delete_message(
                &pending.bot_token,
                &pending.channel_id,
                &pending.placeholder_ts,
            )
            .await
            {
                tracing::error!("[slack-sync] finalize delete failed: {e}");
            }
        }
        // Already showing text — nothing to do.
        (ReplyState::Text(_), _) => {}
    }
}
