---
name: keel-backend
description: "Keel Rust crates for AI agent desktop app backends with Tauri 2. Session management (spawn_and_monitor, SessionQueue), workspace_store (.keel/ file CRUD for tasks, routines, goals, channels, skills), keel-db (chat_feed SQLite), keel-channels (Telegram, Slack), keel-events, keel-scheduler, KeelEvent emission. Files-first architecture."
---

# Keel Backend — Rust Crate Reference

Rust crates for building Tauri 2 desktop app backends that manage AI agent sessions (Claude CLI), workspace persistence (.keel/ files), messaging channels (Telegram, Slack), scheduling, and event routing.

## Install

Most apps only need `keel-tauri` — it re-exports everything:

```toml
[dependencies]
keel-tauri = "0.3"
```

Individual crates (rare — only for non-Tauri contexts):

```toml
keel-sessions = "0.1"    # Claude CLI process management
keel-db = "0.2"          # SQLite (chat_feed + preferences only)
keel-channels = "0.1"    # Telegram, Slack adapters
keel-events = "0.1"      # Event queue
keel-scheduler = "0.1"   # Heartbeat and cron scheduling
```

## Rules

- **No `unwrap()` in production.** Use `?` with proper error mapping.
- **No `let _ = something.await`** for operations that can fail.
- **Tauri commands return `Result<T, String>`.** Map errors with `.map_err(|e| e.to_string())`.
- **All events emit via** `app_handle.emit("keel-event", KeelEvent::...)`.
- **Use `expand_tilde()`** for user-facing paths. Rust `PathBuf` does not expand `~`.

---

## keel-tauri

The main integration crate. Provides session lifecycle, workspace persistence, channel management, and app state.

### Imports

```rust
use keel_tauri::{
    // Re-exported sub-crates
    keel_db, keel_sessions, keel_events, keel_scheduler, keel_channels,
    // Direct modules
    state::AppState,
    events::KeelEvent,
    session_runner::{spawn_and_monitor, SessionResult, PersistOptions},
    session_queue::{SessionQueue, SessionQueueConfig},
    agent_sessions::AgentSessionMap,
    chat_session::ChatSessionState,
    channel_manager::{ChannelManager, RoutedMessage},
    workspace::{seed_file, build_system_prompt, list_files, read_file},
    workspace_store::{WorkspaceStore, types::*},
    paths::expand_tilde,
};
```

### AppState

```rust
pub struct AppState {
    pub db: Database,
    pub event_queue: Option<EventQueueHandle>,
    pub scheduler: Option<Arc<Mutex<Scheduler>>>,
}

// Setup:
let db = Database::connect(&data_dir.join("app.db")).await?;
app.manage(AppState { db, event_queue: Some(handle), scheduler: Some(sched) });
```

### KeelEvent

Enum for Rust-to-JS event emission. Serialized as `{ type, data }`.

| Variant | Data fields |
|---------|-------------|
| `FeedItem` | `session_key`, `item: FeedItem` |
| `SessionStatus` | `session_key`, `status`, `error` |
| `Toast` | `message`, `variant` |
| `AuthRequired` | `message` |
| `CompletionToast` | `title`, `issue_id` |
| `EventReceived` | `event_id`, `event_type`, `source_channel`, `source_identifier`, `summary` |
| `EventProcessed` | `event_id`, `status` |
| `HeartbeatFired` | `prompt`, `project_id` |
| `CronFired` | `job_id`, `job_name`, `prompt` |
| `ChannelMessageReceived` | `channel_type`, `channel_id`, `sender_name`, `text` |
| `ChannelStatusChanged` | `channel_id`, `channel_type`, `status`, `error` |
| `RoutineRunChanged` | `routine_id`, `run_id`, `status` |
| `RoutinesChanged` | `project_id` |

```rust
app_handle.emit("keel-event", KeelEvent::FeedItem { session_key, item })?;
app_handle.emit("keel-event", KeelEvent::Toast { message: "Done".into(), variant: "success".into() })?;
```

### spawn_and_monitor

Core session lifecycle. Spawns Claude CLI, emits events, persists feed, tracks session ID.

```rust
pub fn spawn_and_monitor(
    app_handle: &tauri::AppHandle,
    session_key: String,          // unique key for events
    prompt: String,               // user's message
    resume_id: Option<String>,    // session ID for --resume
    working_dir: Option<PathBuf>, // Claude process working dir
    system_prompt: Option<String>,
    chat_state: Option<ChatSessionState>,  // tracks session ID
    persist: Option<PersistOptions>,       // DB persistence
) -> tokio::task::JoinHandle<SessionResult>
```

```rust
pub struct SessionResult {
    pub response_text: Option<String>,
    pub claude_session_id: Option<String>,
    pub error: Option<String>,
}

pub struct PersistOptions {
    pub db: Database,
    pub project_id: String,
    pub feed_key: String,
    pub source: String,
    pub claude_session_id: Option<String>,  // set automatically on SessionId update
}
```

**Key behaviors:**
- Auto-calls `claude_path::init()` (idempotent via `OnceLock`)
- Emits `KeelEvent::FeedItem` and `KeelEvent::SessionStatus`
- Writes `.claude_session_id` to working directory for `--resume` on restart
- Uses v2 session-keyed persistence when `claude_session_id` is set

```rust
let handle = spawn_and_monitor(
    &app_handle, "task-123".into(), prompt, resume_id,
    Some(working_dir), Some(system_prompt),
    Some(chat_state), Some(PersistOptions { db, project_id, feed_key, source, claude_session_id: None }),
);
let result = handle.await.unwrap();
```

### SessionQueue

Sequential message queue with automatic `--resume`. Messages queue while Claude is busy.

```rust
let queue = SessionQueue::new(app_handle, SessionQueueConfig {
    session_key: "main".into(),
    working_dir: Some(dir),
    system_prompt: Some(prompt),
    model: None,
    effort: None,
    chat_state: Some(state),
    persist: Some(opts),
});
queue.send("Do something".into())?;  // queues if busy, processes in order
```

### AgentSessionMap

Per-agent session state with disk persistence. Loads/saves `.claude_session_id`.

```rust
let session_map: AgentSessionMap = Default::default();
let state = session_map.get_for_agent("project-1", &app_state).await;
// After session: persist to disk
session_map.persist("project-1", &app_state).await;
```

### ChannelManager

Starts/stops channel adapters, routes messages into one receiver.

```rust
let (manager, mut message_rx) = ChannelManager::new();
manager.start_channel("tg-main".into(), config).await?;
while let Some((registry_id, msg)) = message_rx.recv().await {
    // Route to agent session, emit events
}
```

### workspace_store

File-backed CRUD for `.keel/` workspace data. 23 Tauri commands.

**Types** (all derive `Serialize + Deserialize`):

```rust
struct Task { id, title, description, status, claude_session_id: Option<String> }
struct TaskUpdate { title?, description?, status?, claude_session_id? }
struct Routine { id, name, description, trigger_type, trigger_config: Value, status, approval_mode, claude_session_id? }
struct RoutineUpdate { name?, description?, trigger_type?, trigger_config?, status?, approval_mode?, claude_session_id? }
struct NewRoutine { name, description, trigger_type, trigger_config: Value, approval_mode }
struct Goal { id, title, status }
struct GoalUpdate { title?, status? }
struct ChannelEntry { id, channel_type, name, token }
struct NewChannel { channel_type, name, token }
struct Skill { name, instructions, learnings }
struct LogEntry { session_id, task_id?, status, duration_ms?, cost_usd?, timestamp }
struct ProjectConfig { name, claude_model?, claude_effort? }
```

Task statuses: `"queue"`, `"running"`, `"needs_you"`, `"done"`, `"cancelled"`.

**Usage:**

```rust
let store = WorkspaceStore::new(&project_folder);
store.ensure_keel_dir()?;
let tasks = store.list_tasks()?;
let task = store.create_task("Title", "Description")?;
store.update_task(&task.id, TaskUpdate { status: Some("done".into()), ..Default::default() })?;
store.delete_task(&task.id)?;
// Same CRUD for routines, goals, channels, skills, log, config
```

**Tauri commands (23 total):**

| Group | Commands |
|-------|----------|
| Tasks | `list_tasks`, `create_task`, `update_task`, `delete_task` |
| Routines | `list_routines`, `create_routine`, `update_routine`, `delete_routine` |
| Goals | `list_goals`, `create_goal`, `update_goal`, `delete_goal` |
| Channels | `list_channels_config`, `add_channel_config`, `remove_channel_config` |
| Skills | `list_skills`, `read_skill`, `write_skill`, `delete_skill` |
| Log | `append_log`, `read_log` |
| Config | `read_config`, `write_config` |

All operations use atomic temp-file + rename to prevent corruption.

### Workspace Helpers

```rust
seed_file(dir, name, content)          // write once, never overwrite
build_system_prompt(dir, base, name, files)  // assemble from workspace files
list_files(dir, known)                 // UI-safe file enumeration
read_file(dir, name, allowed)          // safe file read
```

### Workspace Commands (pre-built Tauri commands)

`list_project_files`, `open_file`, `reveal_file`, `delete_file`, `import_files`, `create_workspace_folder`, `reveal_workspace`, `write_file_bytes`, `read_project_file`, `load_chat_feed`, `load_session_feed`.

`load_session_feed(claude_session_id)` — loads conversation from SQLite for UI replay.

---

## keel-sessions

Claude CLI session management. Spawns `claude -p --output-format stream-json`, parses NDJSON.

| Export | What it does |
|--------|-------------|
| `SessionManager` | Spawns Claude CLI sessions |
| `StreamAccumulator` | Accumulates NDJSON deltas into FeedItems |
| `FeedItem` | Chat feed item enum (AssistantText, Thinking, ToolCall, etc.) |
| `claude_path` | PATH resolution for macOS .app bundles (shell, nvm, common dirs) |
| Concurrency | Global semaphore limits concurrent Claude processes |

`claude_path::init()` is called automatically by `spawn_and_monitor()`.

---

## keel-db

Minimal SQLite layer (libsql). Two tables only.

### chat_feed

Conversation replay on app restart. Keyed by `claude_session_id`.

```rust
db.add_chat_feed_item_by_session(&claude_session_id, &feed_type, &data_json, "desktop").await?;
let rows = db.list_chat_feed_by_session(&claude_session_id).await?;
db.clear_chat_feed_by_session(&claude_session_id).await?;
```

### preferences

Key-value app settings.

```rust
db.set_preference("last_project_id", "abc-123").await?;
let val = db.get_preference("last_project_id").await?;
```

---

## keel-channels

Channel adapters for messaging platforms.

### Channel trait

```rust
trait Channel: Send + Sync {
    async fn connect(&self) -> Result<()>;
    async fn disconnect(&self) -> Result<()>;
    async fn send_message(&self, channel_id: &str, text: &str) -> Result<()>;
    async fn send_typing(&self, channel_id: &str) -> Result<()> { Ok(()) }  // default no-op
    fn status(&self) -> ChannelStatus;
    fn channel_type(&self) -> &str;
    fn message_receiver(&self) -> &mpsc::UnboundedReceiver<ChannelMessage>;
}
```

### Adapters

- **`TelegramChannel`** — long-polling via `getUpdates`, supports `send_typing`
- **`SlackChannel`** — Socket Mode WebSocket, `chat.postMessage`

Also: `ChannelRegistry`, `ChannelConfig`, `ChannelMessage`, `ChannelStatus`.

---

## keel-events

Event queue for hooks, webhooks, and lifecycle events.

```rust
let (event_queue, queue_handle) = EventQueue::new();
// Use queue_handle in AppState
```

---

## keel-scheduler

Cron jobs and heartbeat timer scheduling.

```rust
let scheduler = Scheduler::new(queue_handle);
scheduler.set_heartbeat(HeartbeatConfig { enabled: true, interval_minutes: 30, prompt: "Check in".into(), .. });
scheduler.add_cron_job(CronJobConfig { id: "daily".into(), name: "Daily digest".into(), cron: "0 9 * * *".into(), prompt: "Summarize".into() });
```

---

## .keel/ Workspace Convention

Every keel app stores agent-visible data in `.keel/`:

```
~/Documents/{AppName}/{ProjectName}/
  .keel/
    tasks.json          # Task[]
    routines.json       # Routine[]
    goals.json          # Goal[]
    channels.json       # ChannelEntry[]
    skills/             # One .md per skill
    log.jsonl           # Append-only audit trail
    config.json         # ProjectConfig
  .claude_session_id    # Persisted session ID for --resume
  CLAUDE.md             # Agent instructions
```

**Design rules:**
- Agents read/write files directly — no CLI intermediary
- All writes use atomic temp-file + rename
- Runtime state (channel connection status) stays in memory, not in files
- SQLite is only for chat_feed (conversation replay) and preferences (app settings)
