# Houston — Library Knowledge Base

## What This Is

A framework for building AI agent desktop apps. Three layers:
- **Houston App** (`app/`) — the flagship AI work delegation desktop app (Tauri 2). Consumes the library and serves as living documentation.
- **Houston** (Rust crates in `crates/`) — session management, database, workspace persistence, Tauri integration
- **Houston UI** (React packages in `packages/`) — UI components for chat, kanban boards, layouts, and design system

**Architecture:** Library components are genericized and props-driven. No Zustand store dependencies, no app-specific logic in the library. All visual styling follows the Houston design system. The app wires stores to library component props.

---

## Monorepo Structure

```
houston/
+-- app/                Houston app (Tauri 2) -- AI work delegation desktop app
|   +-- src/            React frontend
|   |   +-- components/
|   |   |   +-- shell/      App shell: sidebar.tsx, space-switcher.tsx
|   |   |   +-- tabs/       Built-in tab components (chat, board, context, etc.)
|   |   +-- experiences/
|   |   |   +-- builtin/    Built-in experience manifests (9 experiences)
|   |   |   +-- loader.ts   Experience resolution (built-in + installed)
|   |   +-- stores/         Zustand stores (spaces, workspaces, feeds, ui, experiences)
|   |   +-- hooks/          App-level hooks (useSessionEvents, etc.)
|   |   +-- lib/            Types, utilities, constants
|   +-- src-tauri/      Rust backend
|   |   +-- src/commands/   Tauri commands (spaces, workspaces, sessions, preferences)
+-- crates/
|   +-- houston-channels/  houston-channels     -- Channel adapters (Telegram, Slack), Channel trait, registry
|   +-- houston-db/        houston-db           -- Database: chat_feed persistence + v1 compat models (libsql)
|   +-- houston-events/    houston-events       -- Event queue for hooks, webhooks, lifecycle events
|   +-- houston-memory/    houston-memory       -- Agent memory store (evaluating for removal)
|   +-- houston-scheduler/ houston-scheduler    -- Cron jobs and heartbeat timer scheduling
|   +-- houston-sessions/  houston-sessions     -- Claude CLI session management, parser, streaming
|   +-- houston-tauri/     houston-tauri        -- Tauri integration: state, events, session runner, workspace_store, channel manager
+-- packages/
|   +-- core/           @houston-ai/core     -- Design system, shadcn/ui, event hooks, utilities
|   +-- chat/           @houston-ai/chat     -- Chat panel, AI Elements, streaming, progress, channel avatars
|   +-- board/          @houston-ai/board    -- Kanban board, cards, animations
|   +-- layout/         @houston-ai/layout   -- Sidebar, tab bar, split view
|   +-- connections/    @houston-ai/connections -- ConnectionsView, ChannelSetupForm, ChannelConnectionCard
|   +-- events/         @houston-ai/events   -- EventFeed
|   +-- memory/         @houston-ai/memory   -- MemoryBrowser
|   +-- routines/       @houston-ai/routines -- RoutinesGrid, HeartbeatConfig, ScheduleBuilder
|   +-- skills/         @houston-ai/skills   -- SkillsGrid, SkillDetailPage, CommunitySkillsSection
|   +-- review/         @houston-ai/review   -- ReviewItem, ReviewEmpty, DeliverableCard
|   +-- workspace/      @houston-ai/workspace -- FilesBrowser, InstructionsPanel
+-- create-app/         create-houston-experience -- Scaffolding template for new experiences
+-- showcase/           Component showcase -- live docs & demos for all @houston-ai components
+-- Cargo.toml          Rust workspace root
+-- package.json        pnpm workspace root
+-- pnpm-workspace.yaml
+-- tsconfig.json       Base TypeScript config
```

---

## Houston App Concepts

### Spaces

Spaces are the top-level organizational container (replaced "Organization" in v0.2.0). Each space is an isolated group of workspaces with its own connections.

```typescript
interface Space {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}
```

- **Storage:** `~/Documents/Houston/spaces.json` (index) + one directory per space (`~/Documents/Houston/{SpaceName}/`)
- **First launch:** welcome screen prompts user to create their first space
- **Hierarchy:** Space > Workspace (many workspaces per space)
- **Rust commands:** `list_spaces`, `create_space`, `rename_space`, `delete_space` (in `app/src-tauri/src/commands/spaces.rs`)
- **Store:** `useSpaceStore` — `loadSpaces()`, `setCurrent()`, `create()`, `rename()`, `delete()`

### Sidebar Structure

The app sidebar (`app/src/components/shell/sidebar.tsx`) has two tiers:

```
+---------------------------+
| [SpaceSwitcher] [Settings]|  -- select/create Spaces
|---------------------------|
| > Dashboard               |  -- all workspaces overview
| > Connections             |  -- space-wide integrations
|---------------------------|
| Your AI Workspaces        |
|   > Research Agent        |  -- workspace items (sorted by lastOpenedAt)
|   > Project Manager       |
|   > Code Reviewer         |
|   + New Workspace         |  -- create workspace (pick experience)
+---------------------------+
```

- **SpaceSwitcher:** dropdown to select/create spaces
- **Dashboard:** shows all workspaces in current space as a grid
- **Connections:** space-scoped channel/service management
- **Workspace items:** sorted by `lastOpenedAt`, support rename/delete via context menu

### Experience System

Experiences define what an AI workspace looks like — which tabs are available, what system prompt the agent uses, and what files are seeded on creation.

**Three tiers:**

1. **JSON-only:** `manifest.json` defines tabs, prompt, colors, icon. Uses built-in @houston-ai tab components.
2. **Custom React:** `manifest.json` + `bundle.js` with custom React components. Components import @houston-ai as peer deps.
3. **Custom Rust:** PR a new crate to this repo. Experience declares `features: ["capability"]` in manifest.

**Manifest structure:**
```typescript
interface ExperienceManifest {
  id: string;
  name: string;
  description: string;
  version?: string;
  icon?: string;           // Lucide icon name
  color?: string;          // Brand color override
  category?: ExperienceCategory;
  author?: string;
  tags?: string[];
  tabs: ExperienceTab[];
  defaultTab?: string;
  claudeMd?: string;       // CLAUDE.md template content
  systemPrompt?: string;
  workspaceSeeds?: Record<string, string>;
  features?: string[];     // Rust feature flags needed
}

interface ExperienceTab {
  id: string;
  label: string;
  builtIn?: string;        // "chat" | "board" | "skills" | "files" | "connections" | "context" | "routines" | "channels" | "events" | "learnings"
  customComponent?: string;
  badge?: "tasks" | "none";
}
```

**Built-in experiences** (9): Default, Project Manager, Meeting Assistant, Research Agent, Data Analyst, Code Reviewer, DevOps, Content Writer, Customer Support. Located in `app/src/experiences/builtin/`.

**Installed experiences:** loaded from `~/.houston/experiences/{id}/manifest.json`. Installed experiences with the same ID as a builtin override the builtin (deduplication in `loader.ts`).

**Workspace creation** seeds CLAUDE.md from the experience's `claudeMd` field. If `claudeMd` is not set, a generic template is used.

### Tasks / Board Tab

The "Tasks" tab uses `@houston-ai/board`'s `AIBoard` — a higher-level component that combines `KanbanBoard` + `KanbanDetailPanel` + `ChatPanel`. Each card represents a task backed by `.houston/tasks.json`, and clicking a card opens a chat panel with that conversation's history. The app's `board-tab.tsx` is a thin store wrapper (~140 lines) connecting Zustand stores and Tauri commands to `AIBoard` props.

**`AIBoard` props:** `items`, `feedItems` (keyed by session key), `isLoading`, `onCreateConversation` (returns task ID), `onSendMessage`, `onLoadHistory`, `onDelete`, `onApprove`, `onSelect`, `selectedId`.

**Status transitions:** When a session completes, the global `useSessionEvents` hook updates the task to `"needs_you"` and bumps `sessionStatusVersion` in the UI store. The board-tab subscribes to `sessionStatusVersion` via Zustand to reload tasks. This avoids the unreliable `useHoustonEvent` hook (which tears down/re-registers on callback changes, causing missed events).

Columns can include an `onAdd` callback, rendering a "+" button in the column header to create tasks directly from the board.

### ChatSidebar (Progress Tracking)

`ChatSidebar` from `@houston-ai/chat` is a props-driven panel that displays:
- **Progress steps** — extracted from `update_progress` tool calls in the feed, or explicitly passed via `progressSteps` prop
- **Channels list** — connected messaging channels with status dots

Used alongside `ChatPanel` in the app's chat tab layout.

### `.houston/prompts/` Convention

Workspace prompts are stored in `.houston/prompts/` and assembled at runtime into the system prompt:

```
.houston/prompts/
  system.md              -- Base system prompt (editable in Context tab)
  self-improvement.md    -- Self-improvement guidance (editable)
```

**System prompt assembly order** (in `workspace.rs`):
1. `.houston/prompts/system.md` — base prompt
2. `.houston/prompts/self-improvement.md` — learning directives
3. `.houston/memory/` — learnings snapshot
4. `.houston/skills/` — skills index
5. `CLAUDE.md` — workspace instructions

Both prompt files are seeded on workspace creation via `seed_file()` (write-once, never overwrite).

---

## Workspace Convention (`.houston/` folder)

Every Houston app project stores agent-visible data in a `.houston/` folder alongside the project root. Agent-visible data lives in files, not SQLite.

**The rule:** If @houston-ai has a component that renders it, the data goes in `.houston/`.
**App-specific data** goes in `.houston/`.

### File structure

```
~/Documents/Houston/{SpaceName}/{WorkspaceName}/
  .houston/
    workspace.json      -- WorkspaceMeta (id, experience_id, created_at, last_opened_at)
    tasks.json          -- Task[] (id, title, description, status, claude_session_id, updated_at?)
    routines.json       -- Routine[] (id, name, description, trigger_type, trigger_config, status, approval_mode, claude_session_id)
    channels.json       -- ChannelEntry[] (id, channel_type, name, token)
    goals.json          -- Goal[] (id, title, status)
    skills/             -- One .md file per skill (instructions + learnings sections)
      research.md
      writing.md
    prompts/            -- Editable system prompt components
      system.md         -- Base system prompt
      self-improvement.md -- Self-improvement guidance
    log.jsonl           -- Append-only session audit trail (session_id, task_id, status, duration_ms, cost_usd, timestamp)
    config.json         -- ProjectConfig (name, claude_model, claude_effort)
  CLAUDE.md             -- Agent instructions (workspace root)
  .claude_session_id    -- Persisted session ID for --resume across app restarts
```

### Task statuses
`"queue"`, `"running"`, `"needs_you"`, `"done"`, `"cancelled"`

### Key design decisions
- **Agents read/write files directly** — no CLI intermediary. Apps use `workspace_store` Tauri commands.
- **Runtime state stays in memory** — channel connection status, message counts are not persisted to `.houston/`.
- **All write operations use atomic temp-file + rename** to prevent corruption.
- **SQLite is minimal** — only `chat_feed` (conversation replay) and `preferences` (app settings) remain as permanent tables.

---

## React Packages

### @houston-ai/core
The foundation. Design tokens, animations, event hooks, and all shadcn/ui components.

| Contents | Details |
|----------|---------|
| shadcn/ui components | 38 (Button, Card, Dialog, Empty, Badge, ScrollArea, Stepper, Spinner, etc.) |
| Utilities | `cn()` (clsx + tailwind-merge) |
| CSS | `globals.css` — color tokens, animations, scrollbar styles |
| Hooks | `useIsMobile()`, `useHoustonEvent()`, `useSessionEvents()` |
| Types | `HoustonEvent` (discriminated union mirroring Rust `HoustonEvent` enum) |
| Event types | `TauriListenFn`, `SessionEventsHandlers` |

**`useSessionEvents(handlers)`** — Base hook for subscribing to houston-tauri backend events. Dependency-injected: the app passes its own Tauri `listen` function so @houston-ai/core has no build-time Tauri dependency. Handles FeedItem (with desktop-duplicate filtering), SessionStatus (auto-surfaces errors as system_message), Toast. Forwards unhandled events to `onEvent` callback. Uses ref-based handler pattern to avoid listener teardown race conditions.

**`useHoustonEvent(eventName, handler)`** — Lower-level hook for subscribing to a single Tauri event by name. Uses dynamic import of `@tauri-apps/api/event`.

**`HoustonEvent`** — TypeScript discriminated union matching the Rust `HoustonEvent` enum. Variants: `FeedItem`, `SessionStatus`, `IssueStatusChanged`, `IssueOutputFilesChanged`, `IssueTitleChanged`, `IssuesChanged`, `Toast`, `AuthRequired`, `CompletionToast`, `EventReceived`, `EventProcessed`, `HeartbeatFired`, `CronFired`, `ChannelMessageReceived`, `ChannelStatusChanged`, `MemoryChanged`, `MemoryDeleted`, `RoutineRunChanged`, `RoutinesChanged`, `ConversationsChanged`.

Key animations: `glow-spin` (card running state), `typing-bounce` (typing indicator), `tool-pulse` (active tools).

### @houston-ai/chat
The hero package. Drop-in chat experience for Claude Code / Codex sessions.

| Component | What it does |
|-----------|-------------|
| `ChatPanel` | Full chat: messages, streaming, thinking, tools, input — one component |
| `ChatInput` | Input with send/stop/mic states, auto-expand textarea |
| `ToolActivity` | Collapsing tool call list with spinners and elapsed time |
| `ProgressPanel` | Panel for displaying multi-step progress (pairs with `useProgressSteps`) |
| `feedItemsToMessages()` | Converts Claude CLI FeedItems -> ChatMessages (auto-extracts `[Channel]` prefix into `ChatMessage.source`) |
| `mergeFeedItem()` | Pure function for smart-merging streaming FeedItems |
| `ChannelAvatar` | Circular branded avatar: Telegram (blue #2AABEE, paper plane), Slack (purple #4A154B, multi-color logo) |
| `Conversation` | Auto-scrolling message container (stick-to-bottom) |
| `Message` | Role-aware message bubble with branching support |
| `Reasoning` | Collapsible thinking block, auto-open while streaming |
| `Shimmer` | Animated gradient text for loading states |
| `Suggestion` | Horizontal scrollable suggestion pills |
| `PromptInput` | Complex input system with file upload, screenshots, attachments |
| `Typewriter` | Character-by-character text reveal animation |
| `ChatSidebar` | Props-driven sidebar showing progress steps + channels list (pairs with ChatPanel) |

**Progress tracking:**
- `useProgressSteps()` hook — manages multi-step progress state. Returns `{ steps, addStep, updateStep, clearSteps }`.
- `ProgressPanel` component — renders progress steps with status icons. Types: `ProgressStep` (id, label, status, detail), `StepStatus` ("pending" | "running" | "done" | "error").

**ChatPanel is fully props-driven:**
```tsx
<ChatPanel
  sessionKey="session-1"
  feedItems={items}
  onSend={(text) => sendToAgent(text)}
  isLoading={isStreaming}
  renderMessageAvatar={(msg) =>
    msg.source ? <ChannelAvatar source={msg.source} /> : undefined
  }
/>
```

**ChatSidebar is fully props-driven:**
```tsx
<ChatSidebar
  feedItems={feedItems}
  channels={[{ id: "1", name: "Main", type: "telegram", status: "connected" }]}
  onAddChannel={() => openChannelDialog()}
/>
```
Types: `ChatSidebarChannel` (id, name, type, status?). Auto-extracts progress from feed items via `useProgressSteps` + tool-step fallback. Accepts optional `progressSteps` prop for explicit control.

**Channel-aware messaging:** `ChatMessage.source` is auto-extracted from `[ChannelName]` prefixes in user messages. `ChannelAvatar` supports `"telegram"`, `"slack"`, and any custom string source.

### @houston-ai/board
Kanban board with animated cards that glow when AI agents are running.

| Component | What it does |
|-----------|-------------|
| `KanbanBoard` | Configurable kanban — accepts columns + items, filters by status |
| `KanbanColumn` | Animated card list with Framer Motion enter/exit transitions |
| `KanbanCard` | Status-aware card with running glow, optional `group` label above title |
| `KanbanDetailPanel` | Right panel with header + children slot for chat |
| `AIBoard` | Opinionated board: kanban + split-view chat. Supports `onLoadHistory` for persisted chat hydration |
| `ConversationList` | Props-driven list of `ConversationEntry` items with status badges and relative timestamps |

Types: `KanbanItem` (id, title, subtitle, group, status, updatedAt, icon, metadata), `ConversationEntry` (id, title, status, type, sessionKey, updatedAt, workspacePath, workspaceName), `KanbanColumn`.

### @houston-ai/layout
App shell components.

| Component | What it does |
|-----------|-------------|
| `AppSidebar` | Item switcher (projects, workspaces) with add/delete |
| `TabBar` | Configurable tabs with badges and action/menu slots |
| `SplitView` | Resizable two-panel layout (default 55/45 split) |
| `Resizable` | Low-level resizable panel primitives |

### @houston-ai/connections
Channel and service connection management.

| Component | What it does |
|-----------|-------------|
| `ConnectionsView` | Full view: Composio connections grid + channels section |
| `ConnectionRow` | Individual service connection row |
| `ChannelConnectionCard` | Channel row with status dot, icon, connect/disconnect/configure/delete actions |
| `ChannelSetupForm` | Configuration form for Slack (bot token + app token) or Telegram (bot token) |
| `ChannelsSection` | Container listing channels with "Add Channel" dropdown |

Types: `ChannelType` ("slack" | "telegram"), `ChannelStatus` ("disconnected" | "connecting" | "connected" | "error"), `ChannelConnection` (id, type, name, status, config, lastActiveAt, messageCount, error).

### @houston-ai/workspace
macOS Finder-style file management components.

| Component | What it does |
|-----------|-------------|
| `FilesBrowser` | Finder list-view clone: sortable columns (Name, Date Modified, Size, Kind), disclosure chevrons, macOS file icons, alternating row stripes, selection highlight, right-click context menu, internal drag-and-drop (move files between folders), external file import from OS, status bar |
| `InstructionsPanel` | Editable workspace files as labeled textareas with auto-save on blur |
| `NewFolderInput` | Inline folder creation row styled as a selected folder |
| `FileMenu` | Lightweight right-click context menu (Open, Show in Finder, Move to Trash) |

**FilesBrowser props:**
- `files`, `loading`, `selectedPath` — data & state
- `onSelect` (single click), `onOpen` (double click), `onReveal`, `onDelete` — actions
- `onFilesDropped` (external OS files), `onMove` (internal drag-and-drop between folders)
- `onCreateFolder`, `onBrowse` — creation actions
- Sorting is internal (click column headers)

Types: `FileEntry` (path, name, extension, size, dateModified?), `InstructionFile` (name, label, content), `SortKey`, `SortDirection`.

Utilities: `formatSize()`, `formatFinderDate()`, `getKind()` — Finder-style formatting.

---

## Rust Crates

### houston-db
Database layer (libsql/SQLite). Minimal — most persistence lives in file-based `.houston/` workspace storage.

**Permanent modules:**
- `repo_chat_feed` — the only data table. Unified conversation table for UI replay on app restart.

**Chat feed persistence** (`repo_chat_feed.rs`):
- v1 methods (project_id + feed_key keyed): `add_chat_feed_item()`, `list_chat_feed()`, `clear_chat_feed()`
- Session-keyed methods: `add_chat_feed_item_by_session()`, `list_chat_feed_by_session()`, `clear_chat_feed_by_session()`

**Legacy modules** (kept for backward compat):
- `repo_projects`, `repo_issues`, `repo_issue_deps`, `repo_issues_update`, `issue_types`, `models`
- Re-exports: `Database`, `IssueStatus`, `Issue`, `Project`, `Session`, `SessionEvent`, `ChatFeedRow`

**Deleted repos** (legacy): `repo_routines`, `repo_routine_runs`, `repo_session_events`, `repo_sessions`, `repo_issue_feed`

### houston-sessions
Claude CLI session management. Spawns `claude -p --output-format stream-json`, parses NDJSON output, manages concurrency.

**Provides:** `SessionManager`, `ClaudeEvent`, `FeedItem`, `StreamAccumulator`, `claude_path`, concurrency semaphores.

### houston-tauri
Tauri-specific helpers. The largest crate — provides session lifecycle, workspace persistence, channel management, and app state.

| Module | What it provides |
|--------|-----------------|
| `state.rs` | Generic `AppState` (db, event_queue, scheduler) |
| `events.rs` | `HoustonEvent` enum for Tauri event emission |
| `supervisor.rs` | Session supervisor for concurrent Claude sessions |
| `paths.rs` | `expand_tilde()` — resolves `~` in user-facing paths |
| `chat_session.rs` | `ChatSessionState` — `Arc<Mutex<Option<String>>>` for session ID tracking. Enables `--resume` for conversation continuity. |
| `agent_sessions.rs` | `AgentSessionMap` — per-agent session state with disk persistence. Loads/saves `.claude_session_id` from workspace folder. Conversations survive app restarts. |
| `workspace.rs` | `seed_file()` (write-once templates), `build_system_prompt()` (assemble from workspace files), `list_files()` / `read_file()` |
| `workspace_commands.rs` | Pre-built Tauri commands for file operations: `list_project_files`, `open_file`, `reveal_file`, `delete_file`, `import_files`, `create_workspace_folder`, `reveal_workspace`, `write_file_bytes`, `read_project_file`, `load_chat_feed`, `load_session_feed` |
| `workspace_store/` | File-backed CRUD for `.houston/` workspace data. `WorkspaceStore` struct + 23 Tauri commands. Sub-modules: tasks, routines, goals, channels, skills, log, config, types, helpers, commands/ |
| `session_runner.rs` | `spawn_and_monitor()` — generic session lifecycle: spawn Claude CLI, emit events, track session ID, persist feed items, write `.claude_session_id` to disk. Auto-calls `claude_path::init()`. Returns `JoinHandle<SessionResult>`. |
| `session_queue.rs` | `SessionQueue` — message queue for sequential Claude sessions with automatic `--resume`. Messages queue while Claude is busy and process in order. |
| `channel_manager.rs` | `ChannelManager` — starts/stops channel adapters, routes all incoming messages into one `mpsc::UnboundedReceiver<RoutedMessage>`. |
| `tray.rs` | System tray integration utilities |

**workspace_store Tauri commands (25 total):**
Conversations: `list_conversations`, `list_all_conversations` (cross-workspace aggregation)
Tasks: `list_tasks`, `create_task`, `update_task`, `delete_task`
Routines: `list_routines`, `create_routine`, `update_routine`, `delete_routine`
Goals: `list_goals`, `create_goal`, `update_goal`, `delete_goal`
Channels: `list_channels_config`, `add_channel_config`, `remove_channel_config`
Skills: `list_skills`, `read_skill`, `write_skill`, `delete_skill`
Log: `append_log`, `read_log`
Config: `read_config`, `write_config`

**Re-exports:** `houston_db`, `houston_sessions`, `houston_events`, `houston_scheduler`, `houston_channels`, `houston_memory` — apps can import everything through `houston_tauri`.

### houston-channels
Channel adapters for messaging platforms. Each adapter implements the `Channel` trait.

**Channel trait:** `connect()`, `disconnect()`, `send_message(channel_id, text)`, `send_typing(channel_id)` (default no-op), `status()`, `channel_type()`, `message_receiver()`.

**Adapters:**
- `TelegramChannel` — long-polling via `getUpdates`, supports `send_typing`
- `SlackChannel` — Socket Mode WebSocket, `chat.postMessage`

**Also:** `ChannelRegistry` (register/unregister/get/list), `ChannelConfig`, `ChannelMessage`, `ChannelStatus`.

### houston-memory (evaluating for removal)
Agent memory store with vector search and persistence. Still in the workspace (`Cargo.toml` member) and re-exported from houston-tauri. May be removed in a future cleanup.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | React | 19 |
| Language | TypeScript | 5+ |
| Styling | Tailwind CSS | 4 (Vite plugin, no PostCSS config) |
| Components | shadcn/ui (New York style, Stone base) | Latest |
| Animation | Framer Motion | 12 |
| Icons | Lucide React | Latest |
| Build | pnpm workspaces | — |

### Dependency Rules
- `@houston-ai/core` has NO internal package dependencies
- All other packages peer-depend on `@houston-ai/core`
- No package depends on another non-core package (exception: `@houston-ai/board` peer-depends on `@houston-ai/chat` and `@houston-ai/layout` for the `AIBoard` composition)
- React is always a peer dependency, never a direct dependency

### Key Dependencies
| Package | Key Deps |
|---------|----------|
| core | radix-ui, class-variance-authority, tailwind-merge, lucide-react, framer-motion, sonner, cmdk |
| chat | streamdown + plugins, use-stick-to-bottom, motion, marked, shiki, nanoid |
| board | framer-motion, lucide-react |
| layout | lucide-react, react-resizable-panels |

---

## Framework Patterns

### Import Patterns
Within a package, use **relative imports**: `import { cn } from "../utils"`
Between packages, use **package imports**: `import { cn, Button } from "@houston-ai/core"`
**Never use `@/` path aliases.** They break in published libraries.

### Component Patterns
- **Props over stores:** No Zustand, no global state. Components render what they're given.
- **Render props for extensibility:** `renderToolResult`, `renderMessageAvatar`, `isSpecialTool`
- **Slots for composition:** Named ReactNode props like `actions`, `menu`, `emptyState`

### shadcn/ui Patterns
- `data-slot` attributes on every element for CSS targeting
- `cn()` utility for class composition
- Radix UI primitives as headless base
- CVA (class-variance-authority) for variant management
- Adding new: check Houston first, then `npx shadcn@latest add <component>`, copy to `packages/core/src/components/`, fix imports, export from index

### Tailwind CSS 4
- Uses `@tailwindcss/vite` plugin, NOT PostCSS
- **No `tailwind.config.ts`**, no `postcss.config.js`
- Configuration in `globals.css` via `@theme` blocks
- Apps must import: `@import "@houston-ai/core/src/globals.css"`

### Framer Motion
- `layout` prop on items that reorder
- `AnimatePresence` with `mode="popLayout"` for lists
- Transitions under 0.3s — snappy, not slow
- Exit: y: -8 (upward), Enter: y: 8 (from below)

---

## Rust Patterns

### Session Runner (`spawn_and_monitor`)
```rust
let handle = spawn_and_monitor(
    &app_handle, session_key, prompt, resume_id,
    working_dir, system_prompt,
    Some(chat_state),   // ChatSessionState for session ID tracking
    Some(PersistOptions { db, project_id, feed_key, source,
        claude_session_id: None }),  // set automatically on SessionId update
);
```
Auto-calls `claude_path::init()` (idempotent via `OnceLock`). Auto-emits `HoustonEvent::FeedItem` and `HoustonEvent::SessionStatus`. Tracks session ID via `ChatSessionState`. Persists non-streaming feed items to DB using session-keyed persistence when `claude_session_id` is set, falls back to project-keyed. Writes `.claude_session_id` to the working directory for `--resume` on restart. Returns `SessionResult { response_text, claude_session_id, error }`.

### Session Queue
```rust
let queue = SessionQueue::new(app_handle, SessionQueueConfig {
    session_key, working_dir, system_prompt,
    model: None, effort: None,
    chat_state: Some(state), persist: Some(opts),
});
queue.send("Do something").await;  // queues if Claude is busy
```
Sequential message processing with automatic `--resume`. Messages queue up while Claude is running and process in order. Writes `.claude_session_id` to disk.

### Agent Session Map
```rust
let session_map: AgentSessionMap = Default::default();
let state = session_map.get_for_agent("project-1", &app_state).await;
// On first access, loads .claude_session_id from disk
// After session completes:
session_map.persist("project-1", &app_state).await;
```

### Channel Manager
```rust
let (manager, mut message_rx) = ChannelManager::new();
manager.start_channel("tg-main".into(), config).await?;
while let Some((registry_id, msg)) = message_rx.recv().await {
    // Route to agent, emit events
}
```
All channels feed into one receiver. App decides routing.

### Feed Merge (`mergeFeedItem`)
Pure function for smart-merging streaming FeedItems:
- `thinking_streaming` replaces previous `thinking_streaming`
- `assistant_text_streaming` replaces previous `assistant_text_streaming`
- Final variants replace their streaming predecessors
- Everything else appended

### Workspace Helpers
- `seed_file(dir, name, content)` — write once, never overwrite user edits
- `build_system_prompt(dir, base, bootstrap_name, files)` — assemble prompt from workspace files
- `list_files(dir, known)` / `read_file(dir, name, allowed)` — UI-safe file enumeration

### WorkspaceStore
```rust
let store = WorkspaceStore::new(&project_folder);
store.ensure_houston_dir()?;            // creates .houston/ if missing
let tasks = store.list_tasks()?;     // reads .houston/tasks.json
let task = store.create_task("Title", "Desc")?;
store.update_task(&task.id, TaskUpdate { status: Some("done".into()), ..Default::default() })?;
store.delete_task(&task.id)?;
// Same CRUD pattern for routines, goals, channels, skills, log, config
```
All operations use atomic temp-file + rename to prevent corruption. Types defined in `workspace_store::types` — all derive `Serialize + Deserialize`.

---

## Showcase App

`houston/showcase/` — Vite + React 19 app for component documentation.

- **21 components** across 8 packages
- **Navigation:** client-side state-based (no router), sidebar with search + collapsible groups
- **Page pattern:** live demo + quick start code + props table + code examples
- **Data separation:** code examples in `*-data.ts` files alongside pages
- **Theme switching:** Default, Red, Orange accent colors
- **Lazy loading:** all pages use `React.lazy()` with Suspense

---

## Gotchas

1. **Tailwind v4 has no config file.** Don't create `tailwind.config.ts`. All config is in CSS.
2. **No `@/` aliases in library code.** They work in apps but break in published packages.
3. **`motion` vs `framer-motion`:** Both exist in deps. Import from `motion` for `Motion.create()`, `framer-motion` for `AnimatePresence`, `motion.div`.
4. **streamdown CSS:** ChatPanel needs `streamdown/styles.css` imported by the consuming app, not by the library.
5. **Toast container is props-driven.** ToastContainer accepts `toasts` and `onDismiss` as props.
6. **`expand_tilde()` is required for user-facing paths.** Rust's `PathBuf` does not expand `~`.
7. **`send_typing()` is a default no-op on Channel trait.** Only Telegram implements it. Safe to call on any channel.
8. **`claude_path::init()` is automatic.** Called by `spawn_and_monitor()` (idempotent via `OnceLock`). Apps don't need to call it manually.
9. **Session ID persists to disk.** Both `spawn_and_monitor` and `session_queue` write `.claude_session_id` to the workspace folder. `AgentSessionMap` loads it on startup for `--resume`.
10. **Agents read/write `.houston/` files directly.** Apps use `workspace_store` Tauri commands. There is no CLI intermediary for workspace data.
11. **Legacy DB repos are deprecated.** `repo_projects` and `repo_issues` exist for backward compat. Do not add new features to them.
12. **`useSessionEvents` vs `useHoustonEvent`:** Prefer `useSessionEvents` for session-related events (FeedItem, SessionStatus, Toast). It uses ref-based handlers to avoid the race condition where handler recreation tears down and re-registers the listener, causing missed events. `useHoustonEvent` is lower-level for one-off event subscriptions.

---

## Running

```bash
pnpm install               # Install all workspace dependencies
pnpm typecheck             # TypeScript check all packages
cargo test --workspace     # Rust tests
npx tsc --noEmit -p packages/core/tsconfig.json  # Check one package
```
