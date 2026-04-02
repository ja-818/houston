# keel-tauri

Tauri 2 plugin wrapping keel-sessions and keel-db. Provides app state, event types, and a session supervisor for Tauri desktop apps.

## Install

```toml
[dependencies]
keel-tauri = "0.1"
```

## Usage

```rust
use keel_tauri::{state::AppState, supervisor, events};

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

// The supervisor bridges keel-sessions events to Tauri event emission
supervisor::start(&app_handle, &state).await;
```

## Modules

- `state` -- `AppState` struct holding `SessionManager` + `Database`
- `supervisor` -- bridges session events to Tauri frontend events
- `events` -- typed event structs for Tauri IPC

## Re-exports

This crate re-exports both sub-crates for convenience:

```rust
use keel_tauri::keel_sessions;
use keel_tauri::keel_db;
```

---

Part of [Keel & Deck](../../README.md).
