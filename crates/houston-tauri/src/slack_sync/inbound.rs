//! Inbound routing: Slack messages → Houston conversations.
//!
//! Thread replies go to existing conversations.
//! Top-level messages create new activities.

use std::sync::Arc;
use tokio::sync::RwLock;

use houston_channels::ChannelMessage;

use super::manager::SlackSyncManager;
use crate::channel_manager::RoutedMessage;
use crate::events::HoustonEvent;

/// Start the inbound listener that routes Slack messages to Houston conversations.
pub fn start_inbound_listener(
    mut message_rx: tokio::sync::mpsc::UnboundedReceiver<RoutedMessage>,
    app_handle: tauri::AppHandle,
    manager: Arc<RwLock<SlackSyncManager>>,
) {
    tauri::async_runtime::spawn(async move {
        while let Some((registry_id, msg)) = message_rx.recv().await {
            let mut mgr = manager.write().await;
            if let Err(e) = handle_inbound(&mut mgr, &registry_id, msg, &app_handle).await {
                tracing::error!(
                    registry_id = %registry_id,
                    error = %e,
                    "failed to handle inbound Slack message"
                );
            }
        }
        tracing::warn!("inbound message receiver closed");
    });
    tracing::info!("Slack inbound listener started");
}

async fn handle_inbound(
    mgr: &mut SlackSyncManager,
    registry_id: &str,
    msg: ChannelMessage,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    // Find which agent this message belongs to
    let agent_path = mgr
        .agent_for_registry(registry_id)
        .ok_or_else(|| format!("no agent for registry_id {registry_id}"))?
        .to_string();

    if let Some(thread_ts) = &msg.reply_to {
        // Thread reply → route to existing conversation
        handle_thread_reply(mgr, &agent_path, thread_ts, &msg, app_handle).await
    } else {
        // Top-level message → create new activity
        handle_new_message(mgr, &agent_path, &msg, app_handle).await
    }
}

async fn handle_thread_reply(
    mgr: &mut SlackSyncManager,
    agent_path: &str,
    thread_ts: &str,
    msg: &ChannelMessage,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    use tauri::Emitter;

    let session = mgr.session_for_agent(agent_path)
        .ok_or("no sync session for agent")?;

    let slack_thread = super::thread_map::find_session_key(&session.config, thread_ts);
    let session_key = match slack_thread {
        Some(t) => t.session_key.clone(),
        None => return Ok(()), // Thread we don't track — ignore
    };

    // Emit a channel message event so the frontend knows
    let _ = app_handle.emit(
        "houston-event",
        HoustonEvent::ChannelMessageReceived {
            channel_type: "slack".into(),
            channel_id: msg.channel_id.clone(),
            sender_name: msg.sender_name.clone(),
            text: msg.text.clone(),
        },
    );

    // Send the message to the agent's Claude session via Tauri command pattern
    // We invoke the same path as the frontend: emit a "slack-message-to-agent" event
    // that the app's command handler picks up.
    let _ = app_handle.emit(
        "slack-inbound-message",
        serde_json::json!({
            "agent_path": agent_path,
            "session_key": session_key,
            "text": msg.text.clone(),
            "sender_name": msg.sender_name,
        }),
    );

    Ok(())
}

async fn handle_new_message(
    mgr: &mut SlackSyncManager,
    agent_path: &str,
    msg: &ChannelMessage,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    use tauri::Emitter;

    let message_ts = msg.message_ts.as_deref()
        .ok_or("new message has no ts")?;

    // Create a new activity for this message
    let root = crate::paths::expand_tilde(&std::path::PathBuf::from(agent_path));
    let store = crate::agent_store::AgentStore::new(&root);
    let title = truncate(&msg.text, 80);
    let activity = store.create_activity(&title, &msg.text)?;
    let session_key = activity.session_key.clone()
        .unwrap_or_else(|| format!("activity-{}", activity.id));

    // Save thread mapping
    mgr.add_thread_mapping(
        agent_path,
        session_key.clone(),
        message_ts.to_string(),
        title.clone(),
    )?;

    // Emit ActivityChanged so frontend updates
    let _ = app_handle.emit(
        "houston-event",
        HoustonEvent::ActivityChanged {
            agent_path: agent_path.to_string(),
        },
    );

    // Route message to agent
    let _ = app_handle.emit(
        "slack-inbound-message",
        serde_json::json!({
            "agent_path": agent_path,
            "session_key": session_key,
            "text": msg.text.clone(),
            "sender_name": msg.sender_name,
        }),
    );

    Ok(())
}

fn truncate(s: &str, max: usize) -> String {
    if s.len() <= max {
        s.to_string()
    } else {
        format!("{}...", &s[..max.min(s.len())])
    }
}
