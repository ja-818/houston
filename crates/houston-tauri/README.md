# houston-tauri

Tauri 2 integration layer wrapping houston-terminal-manager and houston-db. Provides app state, event types, session lifecycle, workspace persistence, and channel management for Tauri desktop apps.

## Install

```toml
[dependencies]
houston-tauri = "0.3"
```

## Usage

```rust
use houston_tauri::{state::AppState, supervisor, events};

// In your Tauri setup
fn main() {
    tauri::Builder::default()
        .manage(AppState::new().await)
        .invoke_handler(tauri::generate_handler![
            // your commands here
        ])
        .run(tauri::generate_context!())
        .expect("error running app");
}

// The supervisor bridges houston-terminal-manager events to Tauri event emission
supervisor::start(&app_handle, &state).await;
```

## Modules

- `state` -- `AppState` struct holding `SessionManager` + `Database`
- `supervisor` -- bridges session events to Tauri frontend events
- `events` -- typed event structs for Tauri IPC

## Re-exports

This crate re-exports all sub-crates for convenience:

```rust
use houston_tauri::houston_terminal_manager;
use houston_tauri::houston_db;
```

---

Part of [Houston](../../README.md).
