---
name: keel-and-deck
description: "Build AI agent desktop apps with Keel & Deck framework. Tauri 2, React 19, Rust. Scaffold with create-keel-and-deck-app. Files-first architecture (.keel/ workspace). Wire @deck-ui components to keel-tauri Rust commands. workspace_store, session_runner, SessionQueue, ChatPanel, KanbanBoard. Claude Code/Codex session management."
---

# Keel & Deck — Build AI Agent Desktop Apps

Framework for building desktop apps that orchestrate Claude Code, Codex, and other AI agents. **Deck** provides React UI components. **Keel** provides Rust backend crates. **Tauri 2** connects them.

## Quick Start

```bash
npx create-keel-and-deck-app my-app
cd my-app
pnpm install
pnpm tauri dev
```

You get a working app with Chat + CLAUDE.md editor. Add components as needed.

### Prerequisites

- Rust (stable), Node.js 20+, pnpm 9+, Claude CLI (`claude` on PATH)

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Your Tauri App                      │
├────────────────────┬─────────────────────────────────┤
│  Deck (React)      │  Keel (Rust)                     │
│  @deck-ui/core     │  keel-tauri                      │
│  @deck-ui/chat     │    ├── workspace_store (.keel/)  │
│  @deck-ui/board    │    ├── session_runner/queue       │
│  @deck-ui/layout   │    ├── channel_manager           │
│  @deck-ui/...      │    ├── keel-sessions (Claude CLI) │
│                    │    └── keel-db (chat_feed SQLite) │
├────────────────────┴─────────────────────────────────┤
│                  Tauri 2 IPC Bridge                    │
├────────────────────┬─────────────────────────────────┤
│  .keel/ files      │  Claude Code / Codex / Other     │
│  (workspace data)  │  (AI agent processes)            │
└────────────────────┴─────────────────────────────────┘
```

Four layers:
1. **Frontend** — React + Zustand + @deck-ui components (props-driven, no store lock-in)
2. **Backend** — Rust + keel-tauri (re-exports all sub-crates). Session lifecycle, workspace persistence, channels.
3. **IPC** — Tauri `invoke` for request/response, `emit("keel-event", KeelEvent)` for streaming
4. **Agent** — Claude CLI spawned by `spawn_and_monitor()`, streams NDJSON output

## Files-First Architecture

Agent-visible data lives in `.keel/` workspace files (JSON + markdown), not in a database. Agents read and write files naturally. SQLite is only for chat conversation replay.

### .keel/ Workspace Convention

```
~/Documents/MyApp/MyProject/
  .keel/
    tasks.json          # Task[] — kanban board items
    routines.json       # Routine[] — recurring schedules
    goals.json          # Goal[] — high-level objectives
    channels.json       # ChannelEntry[] — messaging integrations
    skills/             # Agent skill instructions (one .md per skill)
    log.jsonl           # Session audit trail
    config.json         # ProjectConfig (name, model, effort)
  .claude_session_id    # Persisted session ID for --resume
  CLAUDE.md             # Agent instructions
```

**The rule:** If @deck-ui has a component that renders it, the data lives in `.keel/`. App-specific files go in `.houston/`, `.desktopclaw/`, etc.

### workspace_store Types

```typescript
// Task statuses: "queue" | "running" | "needs_you" | "done" | "cancelled"
interface Task { id: string; title: string; description: string; status: string; claude_session_id?: string }
interface Routine { id: string; name: string; description: string; trigger_type: string; trigger_config: object; status: string; approval_mode: string; claude_session_id?: string }
interface Goal { id: string; title: string; status: string }
interface ChannelEntry { id: string; channel_type: string; name: string; token: string }
interface Skill { name: string; instructions: string; learnings: string }
interface LogEntry { session_id: string; task_id?: string; status: string; duration_ms?: number; cost_usd?: number; timestamp: string }
interface ProjectConfig { name: string; claude_model?: string; claude_effort?: string }
```

## The Wiring Pattern

**workspace_store (Rust) → Zustand store (JS) → @deck-ui component (React)**

### Step 1: Backend reads/writes .keel/ files

```rust
// keel-tauri provides 23 Tauri commands for workspace CRUD
// Tasks: list_tasks, create_task, update_task, delete_task
// Routines: list_routines, create_routine, update_routine, delete_routine
// Goals: list_goals, create_goal, update_goal, delete_goal
// Channels: list_channels_config, add_channel_config, remove_channel_config
// Skills: list_skills, read_skill, write_skill, delete_skill
// Log: append_log, read_log
// Config: read_config, write_config
```

### Step 2: Zustand store calls Tauri commands

```tsx
import { create } from "zustand"
import { invoke } from "@tauri-apps/api/core"

interface TaskStore {
  tasks: Task[]
  fetch: (projectId: string) => Promise<void>
  create: (projectId: string, title: string, desc: string) => Promise<void>
  update: (projectId: string, id: string, updates: Partial<Task>) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  fetch: async (projectId) => {
    const tasks = await invoke<Task[]>("list_tasks", { projectId })
    set({ tasks })
  },
  create: async (projectId, title, description) => {
    await invoke("create_task", { projectId, title, description })
    get().fetch(projectId)
  },
  update: async (projectId, taskId, updates) => {
    await invoke("update_task", { projectId, taskId, updates })
    get().fetch(projectId)
  },
}))
```

### Step 3: Thin wrapper maps to @deck-ui props

```tsx
import { KanbanBoard } from "@deck-ui/board"
import { useTaskStore } from "@/stores/tasks"

export function TaskBoard() {
  const tasks = useTaskStore((s) => s.tasks)

  const items = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: t.description,
    status: t.status,
    updatedAt: new Date().toISOString(),
  }))

  return <KanbanBoard columns={columns} items={items} onSelect={setSelected} />
}
```

The wrapper is the only place where Zustand meets @deck-ui. The library never imports your stores. Your stores never import the library.

## Starting Claude Sessions

### spawn_and_monitor (one-shot)

For tasks or actions that send one prompt and wait for completion:

```rust
use keel_tauri::session_runner::{spawn_and_monitor, PersistOptions};
use keel_tauri::chat_session::ChatSessionState;

let handle = spawn_and_monitor(
    &app_handle,
    "task-123".into(),           // session_key for events
    user_prompt,                  // the message
    resume_id,                    // Some(id) for --resume, None for new
    Some(working_dir.clone()),    // Claude process cwd
    Some(system_prompt),          // system instructions
    Some(chat_state),             // tracks session ID
    Some(PersistOptions {         // saves feed to SQLite
        db, project_id, feed_key: "main".into(),
        source: "desktop".into(), claude_session_id: None,
    }),
);
let result = handle.await.unwrap();
// result.claude_session_id — save for --resume next time
```

### SessionQueue (conversational)

For chat-style interactions where messages queue while Claude is busy:

```rust
use keel_tauri::session_queue::{SessionQueue, SessionQueueConfig};

let queue = SessionQueue::new(app_handle, SessionQueueConfig {
    session_key: "main".into(),
    working_dir: Some(dir),
    system_prompt: Some(prompt),
    model: None,
    effort: None,
    chat_state: Some(state),
    persist: Some(opts),
});

// Messages queue up and process sequentially with automatic --resume
queue.send("Build the login page".into())?;
queue.send("Now add tests".into())?;  // waits for first to finish
```

## Loading Conversations

On app restart, load persisted feed from SQLite:

```tsx
const feed = await invoke<FeedItem[]>("load_session_feed", { claudeSessionId })
// Pass to ChatPanel as feedItems
```

## Subscribing to Events

Use `useSessionEvents` from `@deck-ui/core` for real-time streaming:

```tsx
import { useSessionEvents } from "@deck-ui/core"
import { listen } from "@tauri-apps/api/event"

useSessionEvents({
  listen,
  onFeedItem: (feedKey, item) => store.addFeedItem(item),
  getActiveSessionId: () => store.activeSessionId,
  onEvent: (event) => {
    switch (event.type) {
      case "ChannelMessageReceived": /* route to agent */ break
      case "RoutinesChanged": /* refresh routines */ break
    }
  },
})
```

## Adding Features

### Kanban Board

Components: `KanbanBoard`, `KanbanDetailPanel` from `@deck-ui/board`
Backend: `list_tasks`, `create_task`, `update_task`, `delete_task` from workspace_store

### Telegram/Slack Channels

Components: `ChannelConnectionCard`, `ChannelSetupForm`, `ChannelsSection` from `@deck-ui/connections`
Backend: `ChannelManager` from keel-tauri, `TelegramChannel`/`SlackChannel` from keel-channels

```rust
let (manager, mut message_rx) = ChannelManager::new();
manager.start_channel("tg-main".into(), config).await?;
while let Some((registry_id, msg)) = message_rx.recv().await {
    // Prefix with [ChannelName] and send to agent
    queue.send(format!("[{}] {}", msg.sender_name, msg.text).into())?;
}
```

### Routines

Components: `RoutinesGrid`, `ScheduleBuilder`, `HeartbeatConfig` from `@deck-ui/routines`
Backend: `Scheduler` from keel-scheduler, routine workspace_store commands

### Brand Theming

Override `--color-primary` in your CSS:

```css
@import "@deck-ui/core/src/globals.css";
@theme {
  --color-primary: #c0392b;
  --color-primary-foreground: #ffffff;
  --color-ring: #c0392b;
}
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Components | shadcn/ui (New York, Stone), Framer Motion 12 |
| State | Zustand (app-level, not in library) |
| Icons | Lucide React |
| Backend | Rust, Tauri 2, tokio |
| Database | SQLite via libsql (chat_feed + preferences only) |
| Build | pnpm workspaces (JS), Cargo workspace (Rust) |

## Key Rules

1. **Props over stores** — @deck-ui components never import state libraries. All data via props, all actions via callbacks.
2. **Files-first** — agent-visible data in `.keel/` files. SQLite only for chat replay.
3. **No `@/` aliases in library** — relative imports within packages, package imports between.
4. **Tailwind CSS 4** — no config file, use `@theme` blocks in CSS. `@tailwindcss/vite` plugin.
5. **`streamdown/styles.css`** — must be imported by the app if using ChatPanel.
6. **`expand_tilde()`** — required for user-facing paths in Rust.
7. **`claude_path::init()`** — called automatically by `spawn_and_monitor()`.
8. **Session ID persists to disk** — `.claude_session_id` written by session_runner and session_queue for `--resume`.

## Deeper Skill References

```bash
npx skills add ja-818/keel-and-deck
```

| Skill | What it teaches |
|-------|----------------|
| `deck-ui` | All 10 React packages with component props and code examples |
| `keel-backend` | All Rust crates with types, functions, and integration patterns |
