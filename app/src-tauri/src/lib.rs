mod commands;
mod workspace;

use commands::workspaces::WorkspaceRoot;
use houston_tauri::agent_sessions::AgentSessionMap;
use houston_tauri::houston_db::Database;
use houston_tauri::state::AppState;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
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

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Space CRUD
            commands::spaces::list_spaces,
            commands::spaces::create_space,
            commands::spaces::rename_space,
            commands::spaces::delete_space,
            // Workspace CRUD (scoped to space)
            commands::workspaces::list_workspaces,
            commands::workspaces::create_workspace,
            commands::workspaces::delete_workspace,
            commands::workspaces::rename_workspace,
            commands::workspaces::update_workspace_opened,
            // Preferences
            commands::preferences::get_preference,
            commands::preferences::set_preference,
            // Experiences
            commands::experiences::list_installed_experiences,
            // Agent commands (send_message, list_agents, etc.)
            commands::agent::list_agents,
            commands::agent::create_agent,
            commands::agent::rename_agent,
            commands::agent::delete_agent,
            commands::agent::send_message,
            commands::agent::load_chat_history,
            commands::agent::read_workspace_file,
            commands::agent::write_workspace_file,
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
            // Workspace store — tasks, routines, goals, channels, skills, log, config
            houston_tauri::workspace_store::commands::list_tasks,
            houston_tauri::workspace_store::commands::create_task,
            houston_tauri::workspace_store::commands::update_task,
            houston_tauri::workspace_store::commands::delete_task,
            houston_tauri::workspace_store::commands::list_routines,
            houston_tauri::workspace_store::commands::create_routine,
            houston_tauri::workspace_store::commands::update_routine,
            houston_tauri::workspace_store::commands::delete_routine,
            houston_tauri::workspace_store::commands::list_goals,
            houston_tauri::workspace_store::commands::create_goal,
            houston_tauri::workspace_store::commands::update_goal,
            houston_tauri::workspace_store::commands::delete_goal,
            houston_tauri::workspace_store::commands::list_channels_config,
            houston_tauri::workspace_store::commands::add_channel_config,
            houston_tauri::workspace_store::commands::remove_channel_config,
            // Note: skills handled by commands::skills (uses houston-skills crate directly)
            houston_tauri::workspace_store::commands::append_log,
            houston_tauri::workspace_store::commands::read_log,
            houston_tauri::workspace_store::commands::read_config,
            houston_tauri::workspace_store::commands::write_config,
            // Workspace file operations
            houston_tauri::workspace_commands::list_project_files,
            houston_tauri::workspace_commands::open_file,
            houston_tauri::workspace_commands::reveal_file,
            houston_tauri::workspace_commands::delete_file,
            houston_tauri::workspace_commands::rename_file,
            houston_tauri::workspace_commands::create_workspace_folder,
            houston_tauri::workspace_commands::reveal_workspace,
            houston_tauri::workspace_commands::import_files,
            houston_tauri::workspace_commands::open_url,
            houston_tauri::workspace_commands::write_file_bytes,
            houston_tauri::workspace_commands::read_project_file,
            houston_tauri::workspace_commands::search_sessions,
            houston_tauri::workspace_commands::list_recent_sessions,
            houston_tauri::workspace_commands::load_session_feed,
            // Composio integrations
            houston_tauri::composio_commands::list_composio_connections,
            houston_tauri::composio_commands::start_composio_oauth,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
