# houston-tauri — thin Tauri adapter

Post-Phase-4 this crate is intentionally minimal. Domain logic lives in the
engine crates (`houston-engine-core`, `houston-engine-server`) and is exposed
over HTTP + WebSocket. `houston-tauri` keeps only what the desktop webview
cannot get over the wire.

## Modules

| Module | Purpose |
|---|---|
| `state` | `AppState` — DB + scheduler handle kept around for local-only needs (log reads, session search). |
| `event_sink` | `TauriEventSink` — `EventSink` impl backed by Tauri's event bus. Retained for tests / future reuse; the running app uses the engine's broadcast sink instead. |
| `paths` | `~/...` expansion helper shared by OS-native commands. |
| `tray` | System tray UI. |

## What used to live here

Agent store, agent files, conversations, composio commands, the file watcher
bridge, prompt assembly, and every `#[tauri::command]` proxy for domain work
have moved into `engine/houston-engine-core`. Their REST + WS surface lives
in `engine/houston-engine-server`. The desktop webview reaches them through
`@houston-ai/engine-client` over the loopback HTTP+WS port printed by the
`houston-engine` sidecar on startup (see `app/src-tauri/src/engine_supervisor.rs`).

## See also

- `engine/houston-engine-server` — binary spawned by the Tauri supervisor.
- `knowledge-base/engine-protocol.md` — wire contract.
- `knowledge-base/engine-server.md` — operator guide.
