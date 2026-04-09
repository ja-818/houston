//! Creating new Slack threads from Houston-side conversations.
//!
//! Used by `commands::chat::send_message` when the user types in the
//! desktop app and we want to mirror their first message into Slack as
//! the thread root.

use super::manager::SlackSyncManager;
use super::thread_map;

/// Create a Slack thread for a conversation by posting the user's message
/// as the top-level post (under the user's identity). Returns the
/// `thread_ts` of the new (or existing) thread.
pub async fn create_thread_for_user_message(
    mgr: &mut SlackSyncManager,
    agent_path: &str,
    session_key: &str,
    user_text: &str,
) -> Result<Option<String>, String> {
    let session = match mgr.session_for_agent(agent_path) {
        Some(s) => s,
        None => return Ok(None), // No Slack sync for this agent
    };
    if let Some(thread) = thread_map::find_thread(&session.config, session_key) {
        return Ok(Some(thread.thread_ts.clone()));
    }

    let bot_token = session.config.bot_token.clone();
    let channel_id = session.config.slack_channel_id.clone();
    let user_name = session.config.user_name.clone();
    let user_avatar = session.config.user_avatar.clone();

    let result = houston_channels::slack::api::post_message_as(
        &bot_token,
        &channel_id,
        user_text,
        None,
        Some(&user_name),
        user_avatar.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())?;

    let thread_ts = result.message_ts.ok_or("no ts in post_message response")?;
    let title = truncate(user_text, 80);

    mgr.add_thread_mapping(
        agent_path,
        session_key.to_string(),
        thread_ts.clone(),
        title,
    )?;

    Ok(Some(thread_ts))
}

fn truncate(s: &str, max: usize) -> String {
    if s.len() <= max {
        s.to_string()
    } else {
        format!("{}...", &s[..max.min(s.len())])
    }
}
