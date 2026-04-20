mod commands;
mod engine_supervisor;
mod logging;

use engine_supervisor::{
    resolve_engine_binary, spawn_supervisor, wait_until_healthy, EngineHandshake,
    SupervisorCallbacks,
};
use houston_tauri::houston_db::Database;
use houston_tauri::state::AppState;
use houston_ui_events::HoustonEvent;
use std::sync::Arc;
use std::time::Duration;
use tauri::{Emitter, Manager};

/// Supervisor callback that toasts the UI on each engine restart.
struct TauriSupervisorCallbacks {
    handle: tauri::AppHandle,
}

impl SupervisorCallbacks for TauriSupervisorCallbacks {
    fn on_restart(&self, handshake: &EngineHandshake) {
        tracing::info!(
            "[engine] restarted on {} (token redacted)",
            handshake.base_url()
        );
        let payload = serde_json::json!({
            "baseUrl": handshake.base_url(),
            "token": handshake.token,
        });
        let _ = self.handle.emit("houston-engine-restarted", payload);
        let _ = self.handle.emit(
            "houston-event",
            HoustonEvent::CompletionToast {
                title: "Engine reconnected".into(),
                issue_id: None,
            },
        );
    }
}

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

            // AppState keeps a DB handle for any OS-native lookup (log
            // reading, session search). Domain state now lives in the
            // engine subprocess.
            app.manage(AppState {
                db,
                event_queue: None,
                scheduler: None,
            });

            // --- Spawn houston-engine as a subprocess --------------------
            //
            // All domain calls go through the engine over HTTP/WS. The
            // supervisor thread restarts it with exponential backoff on
            // crash and emits a toast via `houston-event` on each reconnect.
            let resource_dir = app.path().resource_dir().ok();
            let binary = resolve_engine_binary(resource_dir.as_ref())
                .expect("houston-engine binary missing — check externalBin bundling");
            tracing::info!("[engine] spawning {}", binary.display());

            let cb: Arc<TauriSupervisorCallbacks> = Arc::new(TauriSupervisorCallbacks {
                handle: app.handle().clone(),
            });
            let slot = spawn_supervisor(binary, Duration::from_secs(10), cb)
                .expect("failed to spawn houston-engine");
            let handshake = {
                let guard = slot.lock().expect("engine slot poisoned");
                guard
                    .as_ref()
                    .expect("engine subprocess missing after spawn")
                    .handshake
                    .clone()
            };
            wait_until_healthy(&handshake, Duration::from_secs(5))
                .expect("engine did not pass /v1/health in time");

            // Inject bootstrap so `app/src/lib/engine.ts::resolveConfig`
            // picks it up before any HoustonClient call fires.
            //
            // Two delivery paths because the webview + React may mount
            // BEFORE `setup()` finishes waiting on /v1/health:
            //   1. `window.eval` — fastest path, wins if the webview hasn't
            //      loaded the JS bundle yet.
            //   2. `houston-engine-ready` Tauri event — the frontend's
            //      `EngineGate` awaits this before rendering the app, so a
            //      slow health check simply shows a splash instead of
            //      crashing the React tree.
            let init_script = format!(
                "window.__HOUSTON_ENGINE__ = {{ baseUrl: \"{}\", token: \"{}\" }};",
                handshake.base_url(),
                handshake.token.replace('"', "\\\"")
            );
            if let Some(window) = app.get_webview_window("main") {
                if let Err(e) = window.eval(&init_script) {
                    tracing::error!("[engine] failed to inject bootstrap: {e}");
                }
            }
            let ready_payload = serde_json::json!({
                "baseUrl": handshake.base_url(),
                "token": handshake.token,
            });
            if let Err(e) = app.emit("houston-engine-ready", ready_payload) {
                tracing::error!("[engine] failed to emit ready event: {e}");
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
            // OS-native glue — everything domain-related flows through the
            // engine over HTTP/WS, not Tauri IPC.
            commands::os::pick_directory,
            commands::os::open_url,
            commands::os::open_file,
            commands::os::reveal_file,
            commands::os::reveal_agent,
            commands::os::open_terminal,
            commands::os::check_claude_cli,
            // Logging (writes to local log files).
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
                tauri::RunEvent::WindowEvent {
                    label,
                    event: tauri::WindowEvent::Focused(true),
                    ..
                } if label == "main" => {
                    tracing::debug!("[app] WindowEvent::Focused(true) — emitting app-activated");
                    let _ = app_handle.emit("app-activated", ());
                }
                _ => {}
            }
        });
}
