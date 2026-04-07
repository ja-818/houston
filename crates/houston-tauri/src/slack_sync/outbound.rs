//! Outbound routing: Houston FeedItem events → Slack thread replies.
//!
//! Listens to Tauri "houston-event" emissions and posts assistant messages to Slack.

use std::sync::Arc;
use tokio::sync::RwLock;

use super::manager::SlackSyncManager;

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

        // Only process FeedItem events
        if parsed.get("type").and_then(|t| t.as_str()) != Some("FeedItem") {
            return;
        }
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

        // FeedItem uses #[serde(tag = "feed_type", content = "data", rename_all = "snake_case")]
        let feed_type = match item.get("feed_type").and_then(|t| t.as_str()) {
            Some(t) => t,
            None => return,
        };

        // Only forward final assistant text (not streaming)
        if feed_type != "assistant_text" {
            return;
        }

        let text = match item.get("data").and_then(|d| d.as_str()) {
            Some(t) => t.to_string(),
            None => return,
        };

        let mgr = mgr.clone();
        tauri::async_runtime::spawn(async move {
            let mut mgr = mgr.write().await;
            if let Err(e) = mgr.post_to_slack(&session_key, &text).await {
                eprintln!(
                    "[slack-outbound] failed to post to Slack for {}: {}",
                    session_key, e
                );
            }
        });
    });

    eprintln!("[slack] outbound listener started");
}
