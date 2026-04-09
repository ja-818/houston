//! Outbound routing: Houston FeedItem events → Slack thread replies.
//!
//! Listens to Tauri "houston-event" emissions and either:
//! - **Edits the live "_Thinking…_" placeholder** (when one exists for this
//!   `session_key`) flipping it between Thinking and the latest assistant
//!   text via the debouncer; or
//! - **Posts a fresh threaded reply** (the routine/heartbeat path, where the
//!   agent speaks without a user prompt).
//!
//! Also listens for `SessionStatus` events to finalize the placeholder when
//! the turn completes or errors out.

use std::sync::Arc;
use tokio::sync::RwLock;

use super::manager::SlackSyncManager;
use super::finalize::Outcome;
use super::pending_reply::DesiredState;

/// Start the outbound listener that forwards agent responses to Slack.
pub fn start_outbound_listener(
    app_handle: &tauri::AppHandle,
    manager: Arc<RwLock<SlackSyncManager>>,
) {
    use tauri::Listener;

    let mgr = manager.clone();
    app_handle.listen("houston-event", move |event| {
        let payload_str = event.payload();
        let parsed: serde_json::Value = match serde_json::from_str(payload_str) {
            Ok(v) => v,
            Err(_) => return,
        };

        match parsed.get("type").and_then(|t| t.as_str()) {
            Some("FeedItem") => handle_feed_item(&parsed, &mgr),
            Some("SessionStatus") => handle_session_status(&parsed, &mgr),
            _ => {}
        }
    });

    tracing::info!(
        "[slack-sync outbound] listener started (Thinking-placeholder build, v1)"
    );
}

/// Route a FeedItem to either the placeholder (edit) or a fresh reply.
fn handle_feed_item(parsed: &serde_json::Value, mgr: &Arc<RwLock<SlackSyncManager>>) {
    let data = match parsed.get("data") {
        Some(d) => d,
        None => return,
    };
    let session_key = match data.get("session_key").and_then(|s| s.as_str()) {
        Some(k) => k.to_string(),
        None => return,
    };
    let item = match data.get("item") {
        Some(i) => i,
        None => return,
    };
    let feed_type = match item.get("feed_type").and_then(|t| t.as_str()) {
        Some(t) => t,
        None => return,
    };

    // Decide what state this event represents (or fresh post for routine path).
    let new_state: Option<DesiredState> = match feed_type {
        "assistant_text" => item
            .get("data")
            .and_then(|d| d.as_str())
            .map(|t| DesiredState::Text(t.to_string())),
        "tool_call" | "tool_result" | "system_message" => Some(DesiredState::Thinking),
        _ => None, // final_result, reasoning, etc. — ignore
    };

    let Some(state) = new_state else {
        return;
    };

    let state_label = match &state {
        DesiredState::Thinking => "Thinking",
        DesiredState::Text(_) => "Text",
    };
    tracing::debug!(
        session_key = %session_key,
        feed_type = %feed_type,
        state = %state_label,
        "[slack-sync outbound] FeedItem mapped to state"
    );

    let mgr_clone = mgr.clone();
    tauri::async_runtime::spawn(async move {
        // If there's a live placeholder for this conversation, edit it.
        // Otherwise (routine/heartbeat path), fall back to the legacy
        // "fresh threaded reply" behavior — but only for assistant_text,
        // since tool_call/tool_result aren't user-facing on their own.
        let has_pending = mgr_clone.read().await.has_pending_reply(&session_key);
        tracing::debug!(
            session_key = %session_key,
            has_pending = has_pending,
            "[slack-sync outbound] checked has_pending_reply"
        );
        if has_pending {
            super::debounce::set_reply_state(mgr_clone, session_key, state).await;
        } else if let DesiredState::Text(text) = state {
            tracing::debug!(
                session_key = %session_key,
                "[slack-sync outbound] no pending placeholder — falling back to fresh post_to_slack"
            );
            let mgr = mgr_clone.read().await;
            if let Err(e) = mgr.post_to_slack(&session_key, &text).await {
                tracing::error!(
                    "[slack-outbound] failed to post to Slack for {}: {}",
                    session_key,
                    e
                );
            }
        }
    });
}

/// Finalize the live placeholder when a session completes or errors out.
fn handle_session_status(parsed: &serde_json::Value, mgr: &Arc<RwLock<SlackSyncManager>>) {
    let data = match parsed.get("data") {
        Some(d) => d,
        None => return,
    };
    let session_key = match data.get("session_key").and_then(|s| s.as_str()) {
        Some(k) => k.to_string(),
        None => return,
    };
    let status = match data.get("status").and_then(|s| s.as_str()) {
        Some(s) => s,
        None => return,
    };

    let outcome = match status {
        "completed" => Outcome::Completed,
        "error" => Outcome::Error(
            data.get("error")
                .and_then(|e| e.as_str())
                .unwrap_or("unknown error")
                .to_string(),
        ),
        _ => return, // starting / running — ignore
    };

    tracing::info!(
        session_key = %session_key,
        status = %status,
        "[slack-sync outbound] finalizing pending reply"
    );

    let mgr_clone = mgr.clone();
    tauri::async_runtime::spawn(async move {
        let mut mgr = mgr_clone.write().await;
        super::finalize::finalize_reply(&mut mgr, &session_key, outcome).await;
    });
}
