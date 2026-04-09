//! Inbound routing: Slack messages → Houston conversations.

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
            tracing::info!(
                registry_id = %registry_id,
                channel_id = %msg.channel_id,
                sender = %msg.sender_name,
                reply_to = ?msg.reply_to,
                text_preview = %msg.text.chars().take(40).collect::<String>(),
                "[slack-sync inbound] message received from channel manager"
            );
            let mut mgr = manager.write().await;
            if let Err(e) = handle_inbound(&mut mgr, &registry_id, msg, &app_handle).await {
                tracing::error!(
                    registry_id = %registry_id,
                    error = %e,
                    "[slack-sync inbound] failed to handle inbound Slack message"
                );
            }
        }
        tracing::warn!("[slack-sync inbound] message receiver closed");
    });
    tracing::info!("Slack inbound listener started");
}

async fn handle_inbound(
    mgr: &mut SlackSyncManager,
    registry_id: &str,
    msg: ChannelMessage,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    // Route by CHANNEL ID, not by which Socket Mode connection caught the
    // event — see SlackSyncManager::session_for_channel for why.
    let agent_path = match mgr.session_for_channel(&msg.channel_id) {
        Some(s) => s.agent_path.clone(),
        None => {
            tracing::warn!(
                channel_id = %msg.channel_id,
                caught_by = %registry_id,
                "[slack-sync inbound] no agent owns this channel — dropping message"
            );
            return Ok(());
        }
    };

    tracing::info!(
        agent_path = %agent_path,
        channel_id = %msg.channel_id,
        caught_by = %registry_id,
        is_thread_reply = msg.reply_to.is_some(),
        "[slack-sync inbound] routing message"
    );

    if let Some(thread_ts) = &msg.reply_to {
        handle_thread_reply(mgr, &agent_path, thread_ts, &msg, app_handle).await
    } else {
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

    let session = mgr
        .session_for_agent(agent_path)
        .ok_or("no sync session for agent")?;

    let session_key = match super::thread_map::find_session_key(&session.config, thread_ts) {
        Some(t) => t.session_key.clone(),
        None => {
            tracing::warn!(
                agent_path = %agent_path,
                thread_ts = %thread_ts,
                "[slack-sync inbound] thread not in agent's thread_map — dropping reply"
            );
            return Ok(());
        }
    };

    let _ = app_handle.emit(
        "houston-event",
        HoustonEvent::ChannelMessageReceived {
            channel_type: "slack".into(),
            channel_id: msg.channel_id.clone(),
            sender_name: msg.sender_name.clone(),
            text: msg.text.clone(),
        },
    );

    let _ = app_handle.emit(
        "slack-inbound-message",
        serde_json::json!({
            "agent_path": agent_path,
            "session_key": session_key,
            "text": msg.text.clone(),
            "sender_name": msg.sender_name,
        }),
    );

    // Placeholder threaded under the root in the user's actual channel.
    let _ = super::pending_reply::post_thinking_placeholder(
        mgr,
        agent_path,
        &session_key,
        &msg.channel_id,
        thread_ts,
    )
    .await;

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

    // Placeholder threaded under the user's own message in their actual channel.
    let _ = super::pending_reply::post_thinking_placeholder(
        mgr,
        agent_path,
        &session_key,
        &msg.channel_id,
        message_ts,
    )
    .await;

    Ok(())
}

fn truncate(s: &str, max: usize) -> String {
    if s.len() <= max {
        s.to_string()
    } else {
        format!("{}...", &s[..max.min(s.len())])
    }
}
