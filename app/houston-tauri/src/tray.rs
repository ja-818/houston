//! System tray helpers for keeping the app alive in the background.
//!
//! When the user closes the window, the app hides to the system tray instead
//! of quitting. The Rust backend (channels, scheduler, heartbeats) keeps
//! running. This is what makes the agent feel "always alive."
//!
//! # Usage
//!
//! ```rust,ignore
//! // In your Tauri setup closure:
//! houston_tauri::tray::setup_tray(app, "MyApp")?;
//!
//! // On the builder, intercept close to hide:
//! .on_window_event(houston_tauri::tray::hide_on_close)
//! ```

use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

/// Set up a system tray icon with show/quit menu.
///
/// - Left-click tray icon: show/focus the main window
/// - Right-click menu: "Open {app_name}" and "Quit"
///
/// Requires the `tray-icon` feature on the `tauri` dependency.
pub fn setup_tray(app: &tauri::App, app_name: &str) -> Result<(), Box<dyn std::error::Error>> {
    let open_label = format!("Open {app_name}");
    let open_item = MenuItemBuilder::with_id("open", &open_label).build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .items(&[&open_item, &quit_item])
        .build()?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().cloned().unwrap())
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app: &tauri::AppHandle, event| match event.id().as_ref() {
            "open" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray: &tauri::tray::TrayIcon, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

/// Window event handler that hides the window instead of closing it.
///
/// Use with `tauri::Builder::on_window_event`:
/// ```rust,ignore
/// tauri::Builder::default()
///     .on_window_event(houston_tauri::tray::hide_on_close)
/// ```
pub fn hide_on_close(window: &tauri::Window, event: &tauri::WindowEvent) {
    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
    }
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}
