//! Standalone Slack Web API helpers.
//!
//! These functions work with raw tokens and don't require a Channel adapter.
//! Used by both the SlackChannel adapter and the SlackSync module.

use anyhow::Context;

use super::types::{
    ConversationsCreateResponse, ConversationsListResponse, PostMessageResponse,
};
use crate::types::SendResult;

const BASE: &str = "https://slack.com/api";

/// Brand-voice placeholder text used while the agent is working.
/// Italicized via Slack mrkdwn so it reads as a status line, not a message.
pub const THINKING_TEXT: &str = "_Thinking…_";

/// Post a message (optionally threaded, optionally with a custom display name).
pub async fn post_message(
    bot_token: &str,
    channel: &str,
    text: &str,
    thread_ts: Option<&str>,
) -> anyhow::Result<SendResult> {
    post_message_as(bot_token, channel, text, thread_ts, None, None).await
}

/// Post a message with a custom display name and avatar (agent or user identity).
pub async fn post_message_as(
    bot_token: &str,
    channel: &str,
    text: &str,
    thread_ts: Option<&str>,
    username: Option<&str>,
    icon_url: Option<&str>,
) -> anyhow::Result<SendResult> {
    let client = reqwest::Client::new();
    let mut body = serde_json::json!({
        "channel": channel,
        "text": text,
    });
    if let Some(ts) = thread_ts {
        body["thread_ts"] = serde_json::Value::String(ts.to_string());
    }
    if let Some(name) = username {
        body["username"] = serde_json::Value::String(name.to_string());
    }
    if let Some(url) = icon_url {
        body["icon_url"] = serde_json::Value::String(url.to_string());
    }

    let resp = client
        .post(format!("{BASE}/chat.postMessage"))
        .bearer_auth(bot_token)
        .json(&body)
        .send()
        .await
        .context("chat.postMessage request failed")?;

    let result: PostMessageResponse = resp
        .json()
        .await
        .context("failed to parse chat.postMessage response")?;

    if !result.ok {
        anyhow::bail!("chat.postMessage: {}", result.error.unwrap_or_default());
    }

    Ok(SendResult {
        message_ts: result.ts,
    })
}

/// Delete a Slack message via `chat.delete`.
///
/// Used by the slack_sync "pending reply" flow to clean up a trailing
/// `_Thinking…_` placeholder when a turn ends without producing further
/// text — so the thread doesn't end on a useless ghost message.
pub async fn delete_message(
    bot_token: &str,
    channel: &str,
    ts: &str,
) -> anyhow::Result<()> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "channel": channel,
        "ts": ts,
    });

    let resp = client
        .post(format!("{BASE}/chat.delete"))
        .bearer_auth(bot_token)
        .json(&body)
        .send()
        .await
        .context("chat.delete request failed")?;

    let result: serde_json::Value = resp
        .json()
        .await
        .context("failed to parse chat.delete response")?;

    if !result["ok"].as_bool().unwrap_or(false) {
        let err = result["error"].as_str().unwrap_or("unknown");
        anyhow::bail!("chat.delete: {err}");
    }

    Ok(())
}

/// Edit an existing Slack message via `chat.update`.
///
/// Used by the slack_sync "pending reply" flow to flip a single threaded
/// message between `_Thinking…_` and the latest assistant text as the model
/// works through a turn.
pub async fn update_message(
    bot_token: &str,
    channel: &str,
    ts: &str,
    text: &str,
) -> anyhow::Result<()> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "channel": channel,
        "ts": ts,
        "text": text,
    });

    let resp = client
        .post(format!("{BASE}/chat.update"))
        .bearer_auth(bot_token)
        .json(&body)
        .send()
        .await
        .context("chat.update request failed")?;

    let result: serde_json::Value = resp
        .json()
        .await
        .context("failed to parse chat.update response")?;

    if !result["ok"].as_bool().unwrap_or(false) {
        let err = result["error"].as_str().unwrap_or("unknown");
        anyhow::bail!("chat.update: {err}");
    }

    Ok(())
}

/// Create a public Slack channel. Returns the channel ID.
/// If the channel name is already taken, finds and joins the existing one.
pub async fn create_channel(bot_token: &str, name: &str) -> anyhow::Result<String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{BASE}/conversations.create"))
        .bearer_auth(bot_token)
        .json(&serde_json::json!({ "name": name }))
        .send()
        .await
        .context("conversations.create request failed")?;

    let result: ConversationsCreateResponse = resp
        .json()
        .await
        .context("failed to parse conversations.create response")?;

    if !result.ok {
        let err = result.error.unwrap_or_default();
        if err == "name_taken" {
            return find_and_join_channel(bot_token, name).await;
        }
        anyhow::bail!("conversations.create: {err}");
    }

    result
        .channel
        .map(|c| c.id)
        .ok_or_else(|| anyhow::anyhow!("no channel in create response"))
}

/// Find a channel by name and join it. Returns the channel ID.
async fn find_and_join_channel(bot_token: &str, name: &str) -> anyhow::Result<String> {
    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{BASE}/conversations.list"))
        .bearer_auth(bot_token)
        .query(&[("types", "public_channel"), ("limit", "200")])
        .send()
        .await
        .context("conversations.list request failed")?;

    let result: ConversationsListResponse = resp
        .json()
        .await
        .context("failed to parse conversations.list response")?;

    if !result.ok {
        anyhow::bail!("conversations.list: {}", result.error.unwrap_or_default());
    }

    let channel = result
        .channels
        .unwrap_or_default()
        .into_iter()
        .find(|c| c.name == name)
        .ok_or_else(|| anyhow::anyhow!("channel '{name}' not found"))?;

    // Join the channel (no-op if already joined)
    let _ = client
        .post(format!("{BASE}/conversations.join"))
        .bearer_auth(bot_token)
        .json(&serde_json::json!({ "channel": channel.id }))
        .send()
        .await;

    Ok(channel.id)
}

/// Invite a user to a channel. No-op if already a member.
pub async fn invite_user(
    bot_token: &str,
    channel_id: &str,
    user_id: &str,
) -> anyhow::Result<()> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{BASE}/conversations.invite"))
        .bearer_auth(bot_token)
        .json(&serde_json::json!({
            "channel": channel_id,
            "users": user_id,
        }))
        .send()
        .await
        .context("conversations.invite request failed")?;

    let result: serde_json::Value = resp
        .json()
        .await
        .context("failed to parse conversations.invite response")?;

    let ok = result["ok"].as_bool().unwrap_or(false);
    if !ok {
        let err = result["error"].as_str().unwrap_or("unknown");
        // already_in_channel is not an error — the user is already there
        if err != "already_in_channel" {
            anyhow::bail!("conversations.invite: {err}");
        }
    }

    Ok(())
}

/// Fetch a user's display name and avatar URL.
pub async fn get_user_info(
    bot_token: &str,
    user_id: &str,
) -> anyhow::Result<(String, Option<String>)> {
    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{BASE}/users.info"))
        .bearer_auth(bot_token)
        .query(&[("user", user_id)])
        .send()
        .await
        .context("users.info request failed")?;

    let result: super::types::UsersInfoResponse = resp
        .json()
        .await
        .context("failed to parse users.info response")?;

    if !result.ok {
        anyhow::bail!("users.info: {}", result.error.unwrap_or_default());
    }

    let user = result.user.ok_or_else(|| anyhow::anyhow!("no user in response"))?;
    let name = user
        .profile
        .as_ref()
        .and_then(|p| p.display_name.as_deref())
        .filter(|n| !n.is_empty())
        .or(user.real_name.as_deref())
        .or(user.name.as_deref())
        .unwrap_or("User")
        .to_string();
    let avatar = user
        .profile
        .and_then(|p| p.image_72.or(p.image_48));

    Ok((name, avatar))
}
