use houston_tauri::agent_store::AgentStore;
use houston_tauri::agent_store::types::SlackSyncConfig;
use houston_tauri::channel_manager::ChannelManager;
use houston_tauri::events::HoustonEvent;
use houston_tauri::paths::expand_tilde;
use houston_tauri::slack_sync::SlackSyncManager;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, State};
use tokio::sync::RwLock;

// Slack app credentials loaded from environment at build time.
// These identify the app — the actual sensitive token (xoxb-) is per-user via OAuth.
// Set via .env file (gitignored) or CI environment variables.
const SLACK_CLIENT_ID: &str = env!("HOUSTON_SLACK_CLIENT_ID");
const SLACK_CLIENT_SECRET: &str = env!("HOUSTON_SLACK_CLIENT_SECRET");
const SLACK_APP_TOKEN: &str = env!("HOUSTON_SLACK_APP_TOKEN");

/// One-click Slack connect: OAuth + channel creation + sync start.
/// User clicks "Connect Slack" → browser opens → user approves → done.
#[tauri::command(rename_all = "snake_case")]
pub async fn connect_slack(
    app_handle: tauri::AppHandle,
    channel_mgr: State<'_, Arc<ChannelManager>>,
    sync_mgr: State<'_, Arc<RwLock<SlackSyncManager>>>,
    agent_path: String,
    agent_name: String,
) -> Result<serde_json::Value, String> {
    // Step 1: OAuth — open browser, user approves, we get bot_token
    let oauth_config = houston_channels::slack::oauth::SlackOAuthConfig {
        client_id: SLACK_CLIENT_ID.to_string(),
        client_secret: SLACK_CLIENT_SECRET.to_string(),
    };
    let url = houston_channels::slack::oauth::authorization_url(&oauth_config);
    open::that(&url).map_err(|e| format!("failed to open browser: {e}"))?;

    let tokens = houston_channels::slack::oauth::run_oauth_flow(&oauth_config)
        .await
        .map_err(|e| format!("OAuth failed: {e}"))?;

    let bot_token = tokens.bot_token;
    let root = expand_tilde(&PathBuf::from(&agent_path));

    // Step 2: Fetch the installing user's Slack identity
    let (user_name, user_avatar) = if !tokens.user_id.is_empty() {
        houston_channels::slack::api::get_user_info(&bot_token, &tokens.user_id)
            .await
            .unwrap_or_else(|_| ("You".to_string(), None))
    } else {
        ("You".to_string(), None)
    };

    // Step 3: Create a Slack channel for this agent
    let safe_name = format!("houston-{}", slug(&agent_name));
    let channel_id = houston_channels::slack::api::create_channel(&bot_token, &safe_name)
        .await
        .map_err(|e| format!("failed to create Slack channel: {e}"))?;

    // Step 4: Persist sync config
    let config = SlackSyncConfig {
        bot_token: bot_token.clone(),
        app_token: SLACK_APP_TOKEN.to_string(),
        slack_channel_id: channel_id.clone(),
        slack_channel_name: safe_name.clone(),
        user_name: user_name.clone(),
        user_avatar: user_avatar.clone(),
        threads: vec![],
    };
    let store = AgentStore::new(&root);
    store.ensure_houston_dir().ok();
    houston_tauri::slack_sync::thread_map::write_config(&root, &config)
        .map_err(|e| format!("failed to save sync config: {e}"))?;

    // Step 4: Start Socket Mode adapter
    let registry_id = format!("slack-{}", agent_path);
    let ch_config = houston_channels::ChannelConfig {
        channel_type: "slack".into(),
        token: bot_token.clone(),
        extra: serde_json::json!({ "app_token": SLACK_APP_TOKEN }),
    };
    channel_mgr
        .start_channel(registry_id.clone(), ch_config)
        .await?;

    // Step 5: Register sync session
    sync_mgr.write().await.register(
        agent_path.clone(),
        agent_name.clone(),
        registry_id,
        config,
    );

    let _ = app_handle.emit(
        "houston-event",
        HoustonEvent::SlackSyncStarted {
            agent_path: agent_path.clone(),
            slack_channel_name: safe_name.clone(),
        },
    );

    // Welcome message
    let _ = houston_channels::slack::api::post_message(
        &bot_token,
        &channel_id,
        &format!("Houston agent *{agent_name}* is now connected. Conversations will appear as threads here."),
        None,
    )
    .await;

    Ok(serde_json::json!({
        "channel_id": channel_id,
        "channel_name": safe_name,
        "team_name": tokens.team_name,
    }))
}

/// Disconnect Slack from an agent.
#[tauri::command(rename_all = "snake_case")]
pub async fn disconnect_slack(
    app_handle: tauri::AppHandle,
    channel_mgr: State<'_, Arc<ChannelManager>>,
    sync_mgr: State<'_, Arc<RwLock<SlackSyncManager>>>,
    agent_path: String,
) -> Result<(), String> {
    let session = sync_mgr.write().await.unregister(&agent_path);
    if let Some(session) = session {
        channel_mgr.stop_channel(&session.registry_id).await?;
    }
    let _ = app_handle.emit(
        "houston-event",
        HoustonEvent::SlackSyncStopped {
            agent_path: agent_path.clone(),
        },
    );
    Ok(())
}

/// Get current Slack sync status for an agent.
#[tauri::command(rename_all = "snake_case")]
pub async fn get_slack_sync_status(
    sync_mgr: State<'_, Arc<RwLock<SlackSyncManager>>>,
    agent_path: String,
) -> Result<serde_json::Value, String> {
    let mgr = sync_mgr.read().await;
    if let Some(session) = mgr.session_for_agent(&agent_path) {
        Ok(serde_json::json!({
            "connected": true,
            "channel_name": session.config.slack_channel_name,
            "channel_id": session.config.slack_channel_id,
            "thread_count": session.config.threads.len(),
        }))
    } else {
        Ok(serde_json::json!({ "connected": false }))
    }
}

fn slug(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' { c } else { '-' })
        .collect::<String>()
        .trim_matches('-')
        .to_string()
}
