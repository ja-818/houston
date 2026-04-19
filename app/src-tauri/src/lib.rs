mod commands;
mod agent;
mod logging;
mod routine_runner;

use commands::agents::WorkspaceRoot;
use houston_agents_conversations::session_id_tracker::SessionIdTracker;
use houston_agents_conversations::session_pids::SessionPidMap;
use houston_tauri::houston_db::Database;
use houston_tauri::state::AppState;
use tauri::{Emitter, Manager};

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

    // Aptabase analytics is handled entirely in the frontend via @aptabase/web
    // (no Rust plugin needed — avoids Tokio runtime conflicts)

    builder
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // Resolve the user's shell PATH early so provider checks work
            // in release builds (macOS .app bundles get a minimal PATH).
            houston_tauri::houston_terminal_manager::claude_path::init();

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
            app.manage(SessionIdTracker::default());
            app.manage(SessionPidMap::default());
            app.manage(WorkspaceRoot(root.clone()));
            app.manage(houston_file_watcher::WatcherState::default());
            app.manage(routine_runner::RoutineSchedulerState::default());
            app.manage(commands::sync::SyncState::default());

            // Warm the Composio catalog cache in the background so the integrations
            // tab loads instantly when the user opens it.
            tauri::async_runtime::spawn(async {
                let apps = houston_composio::apps::list_all_apps().await;
                tracing::info!("[composio] Pre-warmed catalog: {} apps", apps.len());
            });

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
            commands::provider::launch_provider_login,
            // Houston Store — installed agent configs
            commands::agent_configs::list_installed_configs,
            // Houston Store — remote registry
            commands::store::fetch_store_catalog,
            commands::store::search_store,
            commands::store::install_store_agent,
            commands::store::uninstall_store_agent,
            commands::store::install_agent_from_github,
            commands::store::check_agent_updates,
            commands::store::install_workspace_from_github,
            // Chat commands (send_message, load_chat_history, file read/write)
            commands::chat::send_message,
            commands::chat::start_onboarding_session,
            commands::chat::stop_session,
            commands::chat::load_chat_history,
            commands::chat::summarize_activity,
            // Chat composer attachments — persist user-attached files in the
            // app cache dir scoped by activity/agent id, paths handed to Claude.
            commands::attachments::save_attachments,
            commands::attachments::delete_attachments,
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
            // Generic agent-file I/O — replaces the legacy typed CRUD commands.
            // Frontend reads/writes .houston/<type>/<type>.json via these + JSON Schema validation.
            houston_tauri::agent_files::read_agent_file,
            houston_tauri::agent_files::write_agent_file,
            houston_tauri::agent_files::seed_agent_schemas,
            houston_tauri::agent_files::migrate_agent_files,
            // Conversation listing (derived view over activity.json)
            houston_tauri::conversations::list_conversations,
            houston_tauri::conversations::list_all_conversations,
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
            houston_file_watcher::start_agent_watcher,
            houston_file_watcher::stop_agent_watcher,
            // Routine scheduler
            routine_runner::run_routine_now,
            routine_runner::start_routine_scheduler,
            routine_runner::stop_routine_scheduler,
            routine_runner::sync_routine_scheduler,
            // System
            commands::system::check_claude_cli,
            // Composio integrations (CLI-backed)
            houston_composio::commands::list_composio_connections,
            houston_composio::commands::list_composio_apps,
            houston_composio::commands::list_composio_connected_toolkits,
            houston_composio::commands::connect_composio_app,
            houston_composio::commands::start_composio_oauth,
            houston_composio::commands::complete_composio_login,
            houston_composio::commands::is_composio_cli_installed,
            houston_composio::commands::install_composio_cli,
            // Worktree + Terminal + Directory picker
            commands::worktree::pick_directory,
            commands::worktree::create_worktree,
            commands::worktree::remove_worktree,
            commands::worktree::list_worktrees,
            commands::worktree::run_shell,
            commands::worktree::open_terminal,
            // Logging
            logging::write_frontend_log,
            logging::read_recent_logs,
            // Mobile sync
            commands::sync::start_sync,
            commands::sync::stop_sync,
            commands::sync::get_sync_status,
            commands::sync::send_sync_message,
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
