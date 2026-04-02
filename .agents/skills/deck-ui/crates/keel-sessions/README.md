# keel-sessions

Claude/Codex CLI process management. Spawn sessions, parse NDJSON streams, pump events, and control concurrency.

## Install

```toml
[dependencies]
keel-sessions = "0.1"
```

## Usage

```rust
use keel_sessions::{SessionManager, SessionUpdate, ClaudeEvent};

let manager = SessionManager::new();

// Spawn a new Claude session
let handle = manager.spawn("Fix the login bug", &project_dir).await?;

// Receive streaming events
while let Some(update) = handle.recv().await {
    match update {
        SessionUpdate::Event(event) => println!("{:?}", event),
        SessionUpdate::Exited(code) => break,
    }
}
```

## Modules

- `manager` -- `SessionManager` and `SessionHandle` for spawning/controlling CLI processes
- `parser` -- NDJSON stream parser, `ClaudeEvent` extraction, `StreamAccumulator`
- `session_pump` -- async event pump connecting process stdout to channels
- `session_io` -- stdin/stdout I/O helpers
- `concurrency` -- session concurrency limits and queue management
- `claude_path` -- PATH resolution for finding Claude/Codex CLI binaries
- `types` -- `ClaudeEvent`, `ContentBlock`, `FeedItem`, `SessionStatus`

## Key Types

- `SessionManager` -- creates and tracks sessions
- `SessionHandle` -- control handle for a running session (send input, stop, receive events)
- `ClaudeEvent` -- parsed NDJSON event from Claude CLI
- `FeedItem` -- normalized feed item for UI consumption
- `StreamAccumulator` -- accumulates streaming chunks into complete messages

---

Part of [Keel & Deck](../../README.md).
