# houston-engine-core

Transport-neutral runtime container and domain logic for the Houston
Engine. Owns `EngineState` (paths, event sinks) and hosts the feature
modules that REST routes, CLI tools, tests, and the Tauri adapter all
consume.

Think of this crate as "what the server does" minus the HTTP wrapper.

## Modules

| Module | Purpose |
|---|---|
| `state` | `EngineState`, `SharedEngineState` (`Arc`) |
| `paths` | `EnginePaths` — docs + home dir resolution |
| `error` | `CoreError` with HTTP-ready `ErrorCode` mapping |
| `workspaces` | Workspace CRUD (first slice migrated from the Tauri adapter) |

Further slices (agents, conversations, sessions, skills, provider/prefs,
store, routines, composio, sync) migrate here during Phase 2 of the
engine rollout. Each slice lands as a pure function module plus tests.
The `houston-engine-server` crate wraps them in REST handlers; the Tauri
adapter can call them directly during the transition.

## Dependencies

- `houston-db` — persistent state.
- `houston-ui-events` — `EventSink` trait + event enum.
- `houston-agent-files` — `.houston/` filesystem helpers.
- `houston-engine-protocol` — shared error codes.
