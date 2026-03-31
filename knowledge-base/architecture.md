# Keel & Deck — Architecture

## What This Is

A framework for building AI agent desktop apps. Two halves of one ship:
- **Keel** (Rust crates) — session management, database, CLI tools, Tauri integration
- **Deck** (React packages) — UI components for chat, kanban boards, layouts, and design system

## Origin

Extracted from [Houston](https://github.com/ja-818/houston), a Tauri 2 desktop app for AI work delegation. Components were genericized: Zustand store dependencies replaced with props, Houston-specific logic removed, all visual styling preserved identically.

---

## Monorepo Structure

```
keel-and-deck/
├── crates/
│   ├── keel-channels/  keel-channels     — Channel adapters (Telegram, Slack), Channel trait, registry
│   ├── keel-cli/       keel CLI          — Board management via bash commands
│   ├── keel-db/        keel-db           — Database models, repos, migrations (libsql)
│   ├── keel-events/    keel-events       — Event queue for hooks, webhooks, lifecycle events
│   ├── keel-memory/    keel-memory       — Agent memory store (vector search, persistence)
│   ├── keel-scheduler/ keel-scheduler    — Cron jobs and heartbeat timer scheduling
│   ├── keel-sessions/  keel-sessions     — Claude CLI session management, parser, streaming
│   └── keel-tauri/     keel-tauri        — Tauri integration: state, events, session runner, channel manager, workspace helpers
├── packages/
│   ├── core/           @deck-ui/core     — Design system, shadcn/ui, utilities
│   ├── chat/           @deck-ui/chat     — Chat panel, AI Elements, streaming, channel avatars
│   ├── board/          @deck-ui/board    — Kanban board, cards, animations
│   └── layout/         @deck-ui/layout   — Sidebar, tab bar, split view
├── Cargo.toml          Rust workspace root
├── package.json        pnpm workspace root
├── pnpm-workspace.yaml
└── tsconfig.json       Base TypeScript config
```

---

## Package Details

### @deck-ui/core
The foundation. Design tokens, animations, and all shadcn/ui components.

| Contents | Count |
|----------|-------|
| shadcn/ui components | 36 (button, card, dialog, etc.) |
| Utilities | `cn()` (clsx + tailwind-merge) |
| CSS | `globals.css` — color tokens, animations, scrollbar styles |
| Hooks | `useIsMobile()` |

**Key animations defined in globals.css:**
- `glow-spin` — rotating conic-gradient for card running state
- `typing-bounce` — 3-dot typing indicator
- `tool-pulse` — pulsing dot for active tools

**Design tokens (CSS custom properties):**
- Primary: `#0d0d0d` (near-black)
- Background: `#ffffff`
- Secondary/Sidebar: `#f9f9f9`
- Muted foreground: `#5d5d5d`
- shadcn New York style, Stone base color

### @deck-ui/chat
The hero package. Drop-in chat experience for Claude Code / Codex sessions.

| Component | What it does |
|-----------|-------------|
| `ChatPanel` | Full chat: messages, streaming, thinking, tools, input — one component |
| `ChatInput` | Input with send/stop/mic states, auto-expand textarea |
| `ToolActivity` | Collapsing tool call list with spinners and elapsed time |
| `feedItemsToMessages()` | Converts Claude CLI stream-json FeedItems → ChatMessages (auto-extracts `[Channel]` prefix into `ChatMessage.source`) |
| `mergeFeedItem()` | Pure function for smart-merging a new FeedItem into an existing array (handles streaming replacement logic) |
| `ChannelAvatar` | Circular branded avatar for channel sources — Telegram (blue, paper plane SVG) and Slack (purple, multi-color SVG) logos |
| `Conversation` | Auto-scrolling message container (stick-to-bottom) |
| `Message` | Role-aware message bubble with branching support |
| `Reasoning` | Collapsible thinking block, auto-open while streaming |
| `Shimmer` | Animated gradient text for loading states |
| `Suggestion` | Horizontal scrollable suggestion pills |
| `PromptInput` | Complex input system with file upload, screenshots, attachments |

**ChatPanel is fully props-driven:**
```tsx
<ChatPanel
  sessionKey="session-1"
  feedItems={items}
  onSend={(text) => sendToAgent(text)}
  isLoading={isStreaming}
  status="streaming"
  renderMessageAvatar={(msg) =>
    msg.source ? <ChannelAvatar source={msg.source} /> : undefined
  }
/>
```

**Channel-aware messaging:** `ChatMessage.source` is auto-extracted from `[ChannelName]` prefixes in user messages (e.g., `[Telegram] hello` → `source: "telegram"`, text: `"hello"`). The `renderMessageAvatar` callback lets apps render channel logos on message bubbles. `ChannelAvatar` supports `"telegram"`, `"slack"`, and any custom string source.

### @deck-ui/board
Kanban board with animated cards that glow when AI agents are running.

| Component | What it does |
|-----------|-------------|
| `Board` | Configurable kanban — accepts columns + items, filters by status |
| `Column` | Animated card list with Framer Motion enter/exit transitions |
| `Card` | Status-aware card with running glow animation (conic gradient) |
| `DetailPanel` | Right panel with header + children slot for chat |

**Board is fully props-driven:**
```tsx
<Board
  columns={[
    { id: "running", label: "Running", statuses: ["running"] },
    { id: "review", label: "Needs You", statuses: ["needs_you"] },
    { id: "done", label: "Done", statuses: ["done"] },
  ]}
  items={tasks}
  onSelect={(item) => openDetail(item)}
/>
```

**The running glow:** `card-running-glow` CSS animation — rotating conic-gradient border (blue → indigo → orange), 2.5s infinite. Applied when card status matches `runningStatuses` prop.

### @deck-ui/layout
App shell components.

| Component | What it does |
|-----------|-------------|
| `AppSidebar` | Item switcher (projects, workspaces, etc.) with add/delete |
| `TabBar` | Configurable tabs with badges and action/menu slots |
| `SplitView` | Resizable two-panel layout (default 55/45 split) |
| `Resizable` | Low-level resizable panel primitives |

---

## Crate Details

### keel-cli
CLI tool for managing AI agent tasks and routines. Replaces MCP servers with direct bash commands that any Claude agent can invoke.

**Commands:**
- `keel task create/list/update/delete` — Kanban board task management
- `keel routine create/list/update/delete/pause/resume/history/run` — Recurring routine management
- `keel schema [command]` — JSON schema introspection for runtime tool discovery

**Global flags:** `--db-path PATH --project-id ID [--exclude-issue ID] [--pretty]`

**SKILL.md pattern:** Ships with `crates/keel-cli/skills/SKILL.md` — a self-describing document that any Claude agent can read to learn all available commands, flags, and output formats. The planning agent's system prompt references this skill so it knows how to construct keel commands.

**Key design decisions:**
- Stateless: each invocation opens DB, performs operation, exits
- JSON output: stdout for success, stderr `{"error": "..."}` for failures
- No process management needed — always available via bash

### keel-db
Database layer. Models, repositories, and migrations for libsql/SQLite.

**What it provides:** `Database`, `Issue`, `IssueStatus`, `Project`, `Session`, `SessionEvent`, `Routine`, `RoutineRun`, migration runner.

**Chat feed persistence** (`repo_chat_feed.rs`): `chat_feed` table for persistent conversation history. Stores feed items with `(project_id, feed_key, feed_type, data_json, source, timestamp)`. Methods: `add_chat_feed_item()`, `list_chat_feed()`, `clear_chat_feed()`. Used by `session_runner.rs` via `PersistOptions` for auto-persisting, and by apps for loading conversation history on restart.

### keel-sessions
Claude CLI session management. Spawns `claude -p --output-format stream-json`, parses NDJSON output, manages concurrency.

**What it provides:** `SessionManager`, `ClaudeEvent`, `FeedItem`, `StreamAccumulator`, `claude_path`, concurrency semaphores.

### keel-tauri
Tauri-specific helpers for apps built on Keel & Deck. The largest crate — provides session lifecycle, channel management, workspace utilities, and app state.

**Modules:**

| Module | What it provides |
|--------|-----------------|
| `state.rs` | Generic `AppState` (db, event_queue, scheduler) |
| `events.rs` | `KeelEvent` enum for Tauri event emission |
| `supervisor.rs` | Session supervisor for concurrent Claude sessions |
| `paths.rs` | `expand_tilde()` — resolves `~` in user-facing paths (Rust doesn't do shell expansion) |
| `chat_session.rs` | `ChatSessionState` — `Arc<Mutex<Option<String>>>` for tracking a single Claude session ID across sends. Enables `--resume` for conversation continuity. For single-conversation apps (DesktopClaw); multi-conversation apps (Houston) use the DB instead. |
| `workspace.rs` | `seed_file()` — write a template file if it doesn't exist (never overwrites). `build_system_prompt()` — assemble system prompt from workspace directory files with optional bootstrap detection. `list_files()` / `read_file()` — enumerate and read known workspace files for UI display. |
| `session_runner.rs` | `spawn_and_monitor()` — generic session lifecycle: spawn Claude CLI, emit `KeelEvent::FeedItem` and `KeelEvent::SessionStatus`, track session ID via `ChatSessionState`, optionally persist feed items to DB via `PersistOptions`. Returns `JoinHandle<SessionResult>`. Replaces the duplicated spawn+monitor pattern. |
| `channel_manager.rs` | `ChannelManager` — starts/stops real keel-channels adapters (Telegram, Slack), routes all incoming messages into a single `mpsc::UnboundedReceiver<RoutedMessage>` where `RoutedMessage = (registry_id, ChannelMessage)`. Methods: `start_channel()`, `stop_channel()`, `send_message()`, `send_typing()`, `list()`. |

**Re-exports:** `keel_db`, `keel_sessions`, `keel_events`, `keel_scheduler`, `keel_channels`, `keel_memory` — apps can import everything through `keel_tauri`.

### keel-channels
Channel adapters for messaging platforms. Each adapter implements the `Channel` trait.

**Channel trait methods:** `connect()`, `disconnect()`, `send_message(channel_id, text)`, `send_typing(channel_id)` (default no-op), `status()`, `channel_type()`, `message_receiver()` (take-once mpsc receiver for incoming messages).

**Adapters:**
- `TelegramChannel` — long-polling via `getUpdates`, `sendMessage`, `sendChatAction` (typing indicator)
- `SlackChannel` — Socket Mode WebSocket connection, `chat.postMessage` API

**Also provides:** `ChannelRegistry` (register/unregister/get/list adapters), `ChannelConfig`, `ChannelMessage`, `ChannelStatus`.

---

## Dependencies

| Package | Key Dependencies |
|---------|-----------------|
| core | radix-ui, class-variance-authority, tailwind-merge, lucide-react, framer-motion, sonner, cmdk |
| chat | streamdown + plugins, use-stick-to-bottom, motion, marked, shiki, nanoid |
| board | framer-motion, lucide-react |
| layout | lucide-react, react-resizable-panels |

All packages peer-depend on `react@^19` and `@deck-ui/core`.

---

## Key Patterns

### Props over stores
Every component accepts data and callbacks via props. No Zustand, no context providers (except internal component state). This makes components usable in any React app.

### Visual fidelity from Houston
All CSS classes, Tailwind tokens, Framer Motion configs, and animations are identical to Houston. If Houston changes its design, updates should flow back here.

### Generic types
- `BoardItem` — id, title, subtitle, status, updatedAt, icon, metadata
- `FeedItem` — Claude CLI stream-json event types (user_message, assistant_text_streaming, thinking, tool_call, tool_result, etc.)
- `ChatMessage` — grouped feed items ready for rendering

---

## Running

```bash
pnpm install               # Install all workspace dependencies
pnpm typecheck             # TypeScript check all packages
npx tsc --noEmit -p packages/core/tsconfig.json   # Check one package
```
