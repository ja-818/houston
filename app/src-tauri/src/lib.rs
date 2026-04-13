mod commands;
mod agent;
mod logging;
mod routine_runner;

use commands::agents::WorkspaceRoot;
use houston_tauri::agent_sessions::AgentSessionMap;
use houston_tauri::channel_manager::ChannelManager;
use houston_tauri::houston_db::Database;
use houston_tauri::slack_sync::SlackSyncManager;
use houston_tauri::state::AppState;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::RwLock;

pub fn run() {
    // Initialize logging before anything else
    let houston = houston_tauri::houston_db::db::houston_dir();
    logging::init(&houston);

    // Sentry: initialize before the builder so it catches panics in plugin inits.
    // The guard must live for the lifetime of the app to flush events on shutdown.
    let sentry_dsn = option_env!("SENTRY_DSN").unwrap_or("");
    let _sentry_client = if sentry_dsn.is_empty() {
        None
    } else {
        Some(sentry::init((
            sentry_dsn,
            sentry::ClientOptions {
                release: sentry::release_name!(),
                auto_session_tracking: true,
                ..Default::default()
            },
        )))
    };

    let mut builder = tauri::Builder::default();

    // Sentry plugin — only if DSN was provided
    if let Some(ref client) = _sentry_client {
        builder = builder.plugin(tauri_plugin_sentry::init(client));
    }

    // Aptabase analytics — only if app key was provided
    let aptabase_key = option_env!("APTABASE_APP_KEY").unwrap_or("");
    if !aptabase_key.is_empty() {
        builder = builder.plugin(tauri_plugin_aptabase::Builder::new(aptabase_key).build());
    }

    builder
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let houston = houston_tauri::houston_db::db::houston_dir();
            let db_path = houston.join("db").join("houston.db");

            let db = tauri::async_runtime::block_on(async {
                Database::connect(&db_path)
                    .await
                    .expect("Failed to open database")
            });

            let root = houston.join("workspaces");
            std::fs::create_dir_all(&root).ok();

            app.manage(AppState {
                db,
                event_queue: None,
                scheduler: None,
            });
            app.manage(AgentSessionMap::default());
            app.manage(houston_tauri::session_pids::SessionPidMap::default());
            app.manage(WorkspaceRoot(root.clone()));
            app.manage(houston_tauri::agent_watcher::WatcherState::default());
            app.manage(routine_runner::RoutineSchedulerState::default());

            // Channel manager + Slack sync
            let (channel_mgr, message_rx) = ChannelManager::new();
            let channel_mgr = Arc::new(channel_mgr);
            let sync_mgr = Arc::new(RwLock::new(SlackSyncManager::default()));
            app.manage(channel_mgr.clone());
            app.manage(sync_mgr.clone());

            // Start Slack sync listeners
            let app_handle = app.handle().clone();
            houston_tauri::slack_sync::outbound::start_outbound_listener(
                &app_handle,
                sync_mgr.clone(),
            );
            houston_tauri::slack_sync::inbound::start_inbound_listener(
                message_rx,
                app_handle.clone(),
                sync_mgr.clone(),
            );

            // Auto-reconnect Slack sync for agents that were connected before
            {
                let root = root.clone();
                let cmgr = channel_mgr.clone();
                let smgr = sync_mgr.clone();
                tauri::async_runtime::spawn(async move {
                    auto_reconnect_slack(&root, &cmgr, &smgr).await;
                });
            }

            // Warm the Composio catalog cache in the background so the integrations
            // tab loads instantly when the user opens it.
            tauri::async_runtime::spawn(async {
                let apps = houston_tauri::composio_apps::list_all_apps().await;
                tracing::info!("[composio] Pre-warmed catalog: {} apps", apps.len());
            });

            // Listen for inbound Slack messages → route to Claude sessions
            {
                use tauri::Listener;
                let handle = app.handle().clone();
                app.listen("slack-inbound-message", move |event| {
                    let parsed: serde_json::Value = match serde_json::from_str(event.payload()) {
                        Ok(v) => v,
                        Err(_) => return,
                    };
                    let agent_path = parsed["agent_path"].as_str().unwrap_or("").to_string();
                    let session_key = parsed["session_key"].as_str().unwrap_or("").to_string();
                    let text = parsed["text"].as_str().unwrap_or("").to_string();
                    if agent_path.is_empty() || session_key.is_empty() || text.is_empty() {
                        tracing::warn!("[slack-inbound] missing agent_path, session_key, or text — dropping");
                        return;
                    }
                    let h = handle.clone();
                    tokio::spawn(async move {
                        let state: tauri::State<'_, AppState> = h.state();
                        let sessions: tauri::State<'_, AgentSessionMap> = h.state();
                        let pids: tauri::State<'_, houston_tauri::session_pids::SessionPidMap> = h.state();
                        if let Err(e) = commands::chat::send_message(
                            h.clone(), state, sessions, pids,
                            agent_path, text, Some(session_key),
                            Some("slack".to_string()),
                            None, None,
                        ).await {
                            tracing::error!("[slack-inbound] send_message failed: {e}");
                        }
                    });
                });
            }

            // Size window to 80% of the screen so it looks good on any display
            if let Some(window) = app.get_webview_window("main") {
                if let Some(monitor) = window.current_monitor().ok().flatten() {
                    let screen = monitor.size();
                    let scale = monitor.scale_factor();
                    let w = (screen.width as f64 / scale * 0.80) as f64;
                    let h = (screen.height as f64 / scale * 0.80) as f64;
                    let _ = window.set_size(tauri::LogicalSize::new(w, h));
                    window.center().ok();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Workspace CRUD (top-level container, formerly "Space")
            commands::workspaces::list_workspaces,
            commands::workspaces::create_workspace,
            commands::workspaces::rename_workspace,
            commands::workspaces::delete_workspace,
            commands::workspaces::update_workspace_provider,
            // Agent CRUD (scoped to workspace, formerly "Workspace")
            commands::agents::list_agents,
            commands::agents::create_agent,
            commands::agents::delete_agent,
            commands::agents::rename_agent,
            commands::agents::update_agent_opened,
            // Preferences
            commands::preferences::get_preference,
            commands::preferences::set_preference,
            // Provider management
            commands::provider::check_provider_status,
            commands::provider::get_default_provider,
            commands::provider::set_default_provider,
            // Houston Store — installed agent configs
            commands::agent_configs::list_installed_configs,
            // Houston Store — remote registry
            commands::store::fetch_store_catalog,
            commands::store::search_store,
            commands::store::install_store_agent,
            commands::store::uninstall_store_agent,
            commands::store::install_agent_from_github,
            commands::store::check_agent_updates,
            // Chat commands (send_message, load_chat_history, file read/write)
            commands::chat::send_message,
            commands::chat::start_onboarding_session,
            commands::chat::stop_session,
            commands::chat::load_chat_history,
            commands::chat::read_agent_file,
            commands::chat::write_agent_file,
            commands::chat::summarize_activity,
            // Chat composer attachments — persist user-attached files in the
            // app cache dir scoped by activity/agent id, paths handed to Claude.
            commands::attachments::save_attachments,
            commands::attachments::delete_attachments,
            // Learnings
            commands::memory::load_learnings,
            commands::memory::add_learning,
            commands::memory::replace_learning,
            commands::memory::remove_learning,
            // Skills
            commands::skills::list_skills,
            commands::skills::load_skill,
            commands::skills::create_skill,
            commands::skills::save_skill,
            commands::skills::delete_skill,
            commands::skills::list_skills_from_repo,
            commands::skills::install_skills_from_repo,
            commands::skills::search_community_skills,
            commands::skills::install_community_skill,
            // Agent store — conversations, activity, routines, goals, channels, log, config
            houston_tauri::agent_store::commands::list_conversations,
            houston_tauri::agent_store::commands::list_all_conversations,
            houston_tauri::agent_store::commands::list_activity,
            houston_tauri::agent_store::commands::create_activity,
            houston_tauri::agent_store::commands::update_activity,
            houston_tauri::agent_store::commands::delete_activity,
            houston_tauri::agent_store::commands::list_routines,
            houston_tauri::agent_store::commands::create_routine,
            houston_tauri::agent_store::commands::update_routine,
            houston_tauri::agent_store::commands::delete_routine,
            houston_tauri::agent_store::commands::list_routine_runs,
            houston_tauri::agent_store::commands::list_goals,
            houston_tauri::agent_store::commands::create_goal,
            houston_tauri::agent_store::commands::update_goal,
            houston_tauri::agent_store::commands::delete_goal,
            houston_tauri::agent_store::commands::list_integrations,
            houston_tauri::agent_store::commands::track_integration,
            houston_tauri::agent_store::commands::remove_integration,
            houston_tauri::agent_store::commands::list_channels_config,
            houston_tauri::agent_store::commands::add_channel_config,
            houston_tauri::agent_store::commands::remove_channel_config,
            houston_tauri::agent_store::commands::append_log,
            houston_tauri::agent_store::commands::read_log,
            houston_tauri::agent_store::commands::read_config,
            houston_tauri::agent_store::commands::write_config,
            // Agent file operations
            houston_tauri::agent_commands::list_project_files,
            houston_tauri::agent_commands::open_file,
            houston_tauri::agent_commands::reveal_file,
            houston_tauri::agent_commands::delete_file,
            houston_tauri::agent_commands::rename_file,
            houston_tauri::agent_commands::create_agent_folder,
            houston_tauri::agent_commands::reveal_agent,
            houston_tauri::agent_commands::import_files,
            houston_tauri::agent_commands::open_url,
            houston_tauri::agent_commands::write_file_bytes,
            houston_tauri::agent_commands::read_project_file,
            houston_tauri::agent_commands::search_sessions,
            houston_tauri::agent_commands::list_recent_sessions,
            houston_tauri::agent_commands::load_session_feed,
            // Agent file watcher (AI-native reactivity)
            houston_tauri::agent_watcher::start_agent_watcher,
            houston_tauri::agent_watcher::stop_agent_watcher,
            // Routine scheduler
            routine_runner::run_routine_now,
            routine_runner::start_routine_scheduler,
            routine_runner::stop_routine_scheduler,
            routine_runner::sync_routine_scheduler,
            // System
            commands::system::check_claude_cli,
            // Slack sync
            commands::slack::connect_slack,
            commands::slack::disconnect_slack,
            commands::slack::get_slack_sync_status,
            // Composio integrations (CLI-backed)
            houston_tauri::composio_commands::list_composio_connections,
            houston_tauri::composio_commands::list_composio_apps,
            houston_tauri::composio_commands::list_composio_connected_toolkits,
            houston_tauri::composio_commands::connect_composio_app,
            houston_tauri::composio_commands::start_composio_oauth,
            houston_tauri::composio_commands::complete_composio_login,
            houston_tauri::composio_commands::is_composio_cli_installed,
            houston_tauri::composio_commands::install_composio_cli,
            // Worktree + Terminal + Directory picker
            commands::worktree::pick_directory,
            commands::worktree::create_worktree,
            commands::worktree::remove_worktree,
            commands::worktree::list_worktrees,
            commands::worktree::open_terminal,
            // Logging
            logging::write_frontend_log,
            logging::read_recent_logs,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            match &event {
                // App-level activation (cmd+tab, dock click, etc.)
                tauri::RunEvent::Resumed => {
                    tracing::info!("[app] RunEvent::Resumed — bringing window to front");
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                    let _ = app_handle.emit("app-activated", ());
                }
                // Window-level focus gain — fires when a notification click brings
                // the window to front even if RunEvent::Resumed doesn't fire.
                tauri::RunEvent::WindowEvent { label, event: tauri::WindowEvent::Focused(true), .. } if label == "main" => {
                    tracing::debug!("[app] WindowEvent::Focused(true) — emitting app-activated");
                    let _ = app_handle.emit("app-activated", ());
                }
                _ => {}
            }
        });
}

/// Scan all workspaces/agents for `.houston/slack_sync.json` and reconnect.
async fn auto_reconnect_slack(
    root: &std::path::Path,
    channel_mgr: &Arc<ChannelManager>,
    sync_mgr: &Arc<RwLock<SlackSyncManager>>,
) {
    let Ok(workspaces) = std::fs::read_dir(root) else { return };
    for ws_entry in workspaces.flatten() {
        if !ws_entry.path().is_dir() { continue; }
        let Ok(agents) = std::fs::read_dir(ws_entry.path()) else { continue };
        for agent_entry in agents.flatten() {
            let agent_path = agent_entry.path();
            if !agent_path.is_dir() { continue; }
            let sync_file = agent_path.join(".houston").join("slack_sync.json");
            if !sync_file.exists() { continue; }

            let Ok(contents) = std::fs::read_to_string(&sync_file) else { continue };
            let Ok(config) = serde_json::from_str::<houston_tauri::agent_store::types::SlackSyncConfig>(&contents) else { continue };
            if config.bot_token.is_empty() || config.app_token.is_empty() { continue; }

            let agent_path_str = agent_path.to_string_lossy().to_string();
            let agent_name = agent_path.file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();
            let registry_id = format!("slack-{}", agent_path_str);

            let ch_config = houston_channels::ChannelConfig {
                channel_type: "slack".into(),
                token: config.bot_token.clone(),
                extra: serde_json::json!({ "app_token": config.app_token }),
            };

            match channel_mgr.start_channel(registry_id.clone(), ch_config).await {
                Ok(()) => {
                    sync_mgr.write().await.register(
                        agent_path_str.clone(),
                        agent_name.clone(),
                        registry_id,
                        config,
                    );
                    tracing::info!("[slack] auto-reconnected: {agent_name}");
                }
                Err(e) => {
                    tracing::error!("[slack] auto-reconnect failed for {agent_name}: {e}");
                }
            }
        }
    }
}
