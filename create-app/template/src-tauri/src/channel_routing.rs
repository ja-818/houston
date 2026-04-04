//! Route incoming channel messages to the correct agent's session.

use crate::agent_sessions::AgentSessionMap;
use crate::workspace;
use keel_tauri::channel_manager::ChannelManager;
use keel_tauri::events::KeelEvent;
use keel_tauri::keel_channels::ChannelMessage;
use keel_tauri::keel_db::Database;
use keel_tauri::state::AppState;
use tauri::{Emitter, Manager};

/// Look up the project_id for a channel from the DB.
async fn lookup_channel_project(
    db: &Database,
    channel_registry_id: &str,
) -> Option<String> {
    let mut rows = db
        .conn()
        .query(
            "SELECT project_id FROM channels WHERE id = ?1",
            libsql::params![channel_registry_id.to_string()],
        )
        .await
        .ok()?;
    let row = rows.next().await.ok()??;
    let project_id: String = row.get(0).ok()?;
    if project_id.is_empty() {
        None
    } else {
        Some(project_id)
    }
}

/// Route an incoming channel message to the correct agent's session.
pub async fn route_channel_message(
    handle: &tauri::AppHandle,
    registry_id: String,
    msg: ChannelMessage,
) {
    let state = handle.state::<AppState>();

    // Resolve which agent (project) owns this channel.
    let project = match lookup_channel_project(&state.db, &registry_id).await {
        Some(pid) => match state.db.get_project(&pid).await {
            Ok(Some(p)) => p,
            _ => {
                eprintln!("[channels] project not found for channel {registry_id}");
                return;
            }
        },
        None => {
            // Fallback: channel has no project_id, use first project.
            match state.db.list_projects().await {
                Ok(p) if !p.is_empty() => p.into_iter().next().unwrap(),
                _ => {
                    eprintln!("[channels] no projects available for channel {registry_id}");
                    return;
                }
            }
        }
    };

    let working_dir = keel_tauri::paths::expand_tilde(
        &std::path::PathBuf::from(&project.folder_path),
    );
    let system_prompt = workspace::build_system_prompt(&working_dir);

    // Get per-agent session state.
    let agent_sessions = handle.state::<AgentSessionMap>();
    let chat_state = agent_sessions.get_for_agent(&project.id).await;
    let resume_id = chat_state.get().await;

    let session_key = uuid::Uuid::new_v4().to_string();

    // Push the user message to the "main" feed with channel label.
    let channel_tag = match msg.source.as_str() {
        "telegram" => "[Telegram]",
        "slack" => "[Slack]",
        _ => "[Channel]",
    };
    let _ = handle.emit(
        "keel-event",
        KeelEvent::FeedItem {
            session_key: session_key.clone(),
            item: keel_tauri::keel_sessions::FeedItem::UserMessage(
                format!("{channel_tag} {}", msg.text),
            ),
        },
    );

    // Persist channel user message.
    let source_label = msg.source.clone();
    let _ = state.db.add_chat_feed_item(
        &project.id, "main", "user_message",
        &serde_json::json!(format!("[{}] {}", channel_tag, msg.text)).to_string(),
        &source_label,
    ).await;

    // Show typing indicator on the channel while the agent works.
    let mgr = handle.state::<ChannelManager>();
    let _ = mgr.send_typing(&registry_id, &msg.channel_id).await;

    // Spawn the session and wait for the response.
    let session_handle = keel_tauri::session_runner::spawn_and_monitor(
        handle,
        session_key,
        msg.text.clone(),
        resume_id,
        Some(working_dir),
        Some(system_prompt),
        Some(chat_state),
        Some(keel_tauri::session_runner::PersistOptions {
            db: state.db.clone(),
            project_id: project.id.clone(),
            feed_key: "main".into(),
            source: source_label,
            claude_session_id: None,
        }),
    );

    // Wait for response, keep typing indicator alive, then send response.
    let target = msg.channel_id.clone();
    let handle2 = handle.clone();
    let reg_id = registry_id.clone();

    tauri::async_runtime::spawn(async move {
        let typing_handle = {
            let h = handle2.clone();
            let rid = reg_id.clone();
            let tgt = target.clone();
            tokio::spawn(async move {
                loop {
                    tokio::time::sleep(std::time::Duration::from_secs(4)).await;
                    let mgr = h.state::<ChannelManager>();
                    if mgr.send_typing(&rid, &tgt).await.is_err() {
                        break;
                    }
                }
            })
        };

        if let Ok(result) = session_handle.await {
            typing_handle.abort();
            if let Some(text) = result.response_text {
                let mgr = handle2.state::<ChannelManager>();
                if let Err(e) = mgr.send_message(&reg_id, &target, &text).await {
                    eprintln!("[channels] failed to send response: {e}");
                }
            }
        }
    });
}
