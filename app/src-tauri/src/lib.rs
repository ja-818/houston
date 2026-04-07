mod commands;
mod agent;

use commands::agents::WorkspaceRoot;
use houston_tauri::agent_sessions::AgentSessionMap;
use houston_tauri::houston_db::Database;
use houston_tauri::state::AppState;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let data_dir = houston_tauri::houston_db::db::default_data_dir("houston");
            let db_path = data_dir.join("houston.db");

            let db = tauri::async_runtime::block_on(async {
                Database::connect(&db_path)
                    .await
                    .expect("Failed to open database")
            });

            let docs = dirs::document_dir().expect("No Documents directory found");
            let root = docs.join("Houston");
            std::fs::create_dir_all(&root).ok();

            app.manage(AppState {
                db,
                event_queue: None,
                scheduler: None,
            });
            app.manage(AgentSessionMap::default());
            app.manage(WorkspaceRoot(root));
            app.manage(houston_tauri::agent_watcher::WatcherState::default());

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
            // Agent CRUD (scoped to workspace, formerly "Workspace")
            commands::agents::list_agents,
            commands::agents::create_agent,
            commands::agents::delete_agent,
            commands::agents::rename_agent,
            commands::agents::update_agent_opened,
            // Preferences
            commands::preferences::get_preference,
            commands::preferences::set_preference,
            // Agent manifests (formerly "Experiences")
            commands::agent_manifests::list_installed_manifests,
            // Chat commands (send_message, load_chat_history, file read/write)
            commands::chat::send_message,
            commands::chat::load_chat_history,
            commands::chat::read_agent_file,
            commands::chat::write_agent_file,
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
            houston_tauri::agent_store::commands::list_goals,
            houston_tauri::agent_store::commands::create_goal,
            houston_tauri::agent_store::commands::update_goal,
            houston_tauri::agent_store::commands::delete_goal,
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
            // System
            commands::system::check_claude_cli,
            // Composio integrations
            houston_tauri::composio_commands::list_composio_connections,
            houston_tauri::composio_commands::start_composio_oauth,
            houston_tauri::composio_commands::reopen_composio_oauth,
            houston_tauri::composio_commands::submit_composio_callback,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
