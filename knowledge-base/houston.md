# Houston — Platform Knowledge Base

## What This Is

An open source platform for AI-native products. Three layers:
- **Houston App** (`app/`) — the platform's desktop client (Tauri 2). Individual users use it directly; founders build agents that run on it.
- **Houston Engine** (Rust crates in `crates/`) — session management, database, agent persistence, Tauri integration
- **Houston UI** (React packages in `packages/`) — internal React components powering the platform UI

**Architecture:** Library components are genericized and props-driven. No Zustand store dependencies, no app-specific logic in the library. All visual styling follows the Houston design system. The app wires stores to library component props.

**Platform model:** External developers don't import Houston packages. They define agents with `houston.json` + `CLAUDE.md` and optionally add custom React bundles (`bundle.js`). Workspace templates bundle multiple agents from one GitHub repo.

---

## Monorepo Structure

```
houston/
+-- app/                Houston app (Tauri 2) -- AI work delegation desktop app
|   +-- src/            React frontend
|   |   +-- components/
|   |   |   +-- shell/      App shell: sidebar.tsx, workspace-switcher.tsx
|   |   |   +-- tabs/       Built-in tab components (chat, board, context, etc.)
|   |   +-- agents/
|   |   |   +-- builtin/    Built-in agent manifests (9 agents)
|   |   |   +-- loader.ts   Agent resolution (built-in + installed)
|   |   +-- stores/         Zustand stores (workspaces, agents, feeds, ui, agent-catalog)
|   |   +-- hooks/          App-level hooks (useSessionEvents, etc.)
|   |   +-- lib/            Types, utilities, constants
|   +-- src-tauri/      Rust backend
|   |   +-- src/commands/   Tauri commands (workspaces, agents, sessions, preferences)
+-- crates/
|   +-- houston-channels/  houston-channels     -- Channel adapters (Telegram, Slack), Channel trait, registry
|   +-- houston-db/        houston-db           -- Database: chat_feed persistence + v1 compat models (libsql)
|   +-- houston-events/    houston-events       -- Event queue for hooks, webhooks, lifecycle events
|   +-- houston-memory/    houston-memory       -- Agent memory store (evaluating for removal)
|   +-- houston-scheduler/ houston-scheduler    -- Cron jobs and heartbeat timer scheduling
|   +-- houston-sessions/  houston-sessions     -- Claude CLI session management, parser, streaming
|   +-- houston-tauri/     houston-tauri        -- Tauri integration: state, events, session runner, agent_store, channel manager
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
|   +-- agent/          @houston-ai/agent    -- FilesBrowser, InstructionsPanel
+-- create-app/         create-houston-agent -- Scaffolding template for new agents
+-- showcase/           Component showcase -- live docs & demos for all @houston-ai components
+-- Cargo.toml          Rust workspace root
+-- package.json        pnpm workspace root
+-- pnpm-workspace.yaml
+-- tsconfig.json       Base TypeScript config
```

---

## Houston App Concepts

### Workspaces

Workspaces are the top-level organizational container (replaced "Space" / "Organization" in earlier versions). Each workspace is an isolated group of agents with its own connections.

```typescript
interface Workspace {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}
```

- **Storage:** `~/.houston/workspaces.json` (index) + one directory per workspace (`~/.houston/workspaces/{WorkspaceName}/`)
- **First launch:** welcome screen prompts user to create their first workspace
- **Hierarchy:** Workspace > Agent (many agents per workspace)
- **Rust commands:** `list_workspaces`, `create_workspace`, `rename_workspace`, `delete_workspace` (in `app/src-tauri/src/commands/workspaces.rs`)
- **Store:** `useWorkspaceStore` — `loadWorkspaces()`, `setCurrent()`, `create()`, `rename()`, `delete()`

### Sidebar Structure

The app sidebar (`app/src/components/shell/sidebar.tsx`) has two tiers:

```
+---------------------------+
| [WorkspaceSwitcher] [Settings]|  -- select/create Workspaces
|---------------------------|
| > Dashboard               |  -- all agents overview
| > Connections             |  -- workspace-wide integrations
|---------------------------|
| Your AI Agents            |
|   > Research Agent        |  -- agent items (sorted by lastOpenedAt)
|   > Project Manager       |
|   > Code Reviewer         |
|   + New Agent             |  -- create agent (pick agent definition)
+---------------------------+
```

- **WorkspaceSwitcher:** dropdown to select/create workspaces
- **Dashboard:** shows all agents in current workspace as a grid
- **Connections:** workspace-scoped channel/service management
- **Agent items:** sorted by `lastOpenedAt`, support rename/delete via context menu

### Agent Definition System

Agent definitions define what an AI agent looks like — which tabs are available, what system prompt the agent uses, and what files are seeded on creation. This is the primary developer surface of the platform.

**Three tiers:**

1. **JSON-only:** `houston.json` + `CLAUDE.md` defines tabs, prompt, colors, icon. Uses built-in tab components.
2. **Custom React:** `houston.json` + `bundle.js` with custom React components. Components import @houston-ai as peer deps.
3. **Workspace template:** `workspace.json` + `agents/` folder bundles multiple agents from one GitHub repo.

**Import flow:** Users import agents from GitHub by pasting `owner/repo` in the "New Agent > GitHub" dialog. Houston downloads `houston.json`, `CLAUDE.md`, `icon.png`, and `bundle.js` to `~/.houston/agents/{id}/`.

**Manifest structure:**
```typescript
interface AgentManifest {
  id: string;
  name: string;
  description: string;
  version?: string;
  icon?: string;           // Lucide icon name
  color?: string;          // Brand color override
  category?: AgentCategory;
  author?: string;
  tags?: string[];
  tabs: AgentTab[];
  defaultTab?: string;
  claudeMd?: string;       // CLAUDE.md template content
  systemPrompt?: string;
  agentSeeds?: Record<string, string>;
  features?: string[];     // Rust feature flags needed
}

interface AgentTab {
  id: string;
  label: string;
  builtIn?: string;        // "chat" | "board" | "skills" | "files" | "connections" | "context" | "routines" | "channels" | "events" | "learnings"
  customComponent?: string;
  badge?: "activity" | "none";
}
```

**Built-in agents** (9): Default, Project Manager, Meeting Assistant, Research Agent, Data Analyst, Code Reviewer, DevOps, Content Writer, Customer Support. Located in `app/src/agents/builtin/`.

**Installed agent definitions:** loaded from `~/.houston/agents/{id}/houston.json`. Installed definitions with the same ID as a builtin override the builtin (deduplication in `loader.ts`).

**Agent creation** seeds CLAUDE.md from the agent definition's `claudeMd` field, or from the definition's `CLAUDE.md` file. If neither is set, a generic template is used.

### Workspace Templates

Workspace templates bundle multiple agents into one GitHub repo. Import creates a workspace with all agents ready to use.

**Repo structure:**
```
my-workspace/
├── workspace.json
└── agents/
    ├── agent-one/
    │   ├── houston.json
    │   └── CLAUDE.md
    └── agent-two/
        ├── houston.json
        └── CLAUDE.md
```

**workspace.json:**
```json
{
  "name": "Workspace Name",
  "description": "Optional description.",
  "agents": ["agent-one", "agent-two"]
}
```

**Import flow:** "New Workspace > Import from GitHub" dialog. Paste `owner/repo`. Houston downloads workspace.json, installs all agent definitions, creates the workspace, and creates agent instances with CLAUDE.md + seed files. All agents are ready to chat immediately.

**Rust command:** `install_workspace_from_github` in `app/src-tauri/src/commands/store.rs`.

### Activity / Board Tab

The "Activity" tab uses `@houston-ai/board`'s `AIBoard` — a higher-level component that combines `KanbanBoard` + `KanbanDetailPanel` + `ChatPanel`. Each card represents an activity backed by `.houston/activity.json`, and clicking a card opens a chat panel with that conversation's history. The app's `board-tab.tsx` is a thin store wrapper (~140 lines) connecting TanStack Query hooks and Tauri commands to `AIBoard` props.

**`AIBoard` props:** `items`, `feedItems` (keyed by session key), `isLoading`, `onCreateConversation` (returns activity ID), `onSendMessage`, `onLoadHistory`, `onDelete`, `onApprove`, `onSelect`, `selectedId`.

**Status transitions:** When a session completes, the `useSessionEvents` hook updates the activity to `"needs_you"`. The `ActivityChanged` event emitted by the Rust update command auto-invalidates TanStack Query caches, so the board refreshes automatically.

Columns can include an `onAdd` callback, rendering a "+" button in the column header to create activities directly from the board.

### ChatSidebar (Progress Tracking)

`ChatSidebar` from `@houston-ai/chat` is a props-driven panel that displays:
- **Progress steps** — extracted from `update_progress` tool calls in the feed, or explicitly passed via `progressSteps` prop
- **Channels list** — connected messaging channels with status dots

Used alongside `ChatPanel` in the app's chat tab layout.

### `.houston/prompts/` Convention

Agent prompts are stored in `.houston/prompts/` and assembled at runtime into the system prompt:

```
.houston/prompts/
  system.md              -- Base system prompt (editable in Context tab)
  self-improvement.md    -- Self-improvement guidance (editable)
```

**System prompt assembly order** (in `agent.rs`):
1. `.houston/prompts/system.md` — base prompt
2. `.houston/prompts/self-improvement.md` — learning directives
3. `.houston/memory/` — learnings snapshot
4. `.agents/skills/` — skills index (skill.sh / Claude Code convention)
5. `CLAUDE.md` — agent instructions

Both prompt files are seeded on agent creation via `seed_file()` (write-once, never overwrite).

---

## Agent Convention (`.houston/` folder)

Every Houston app project stores agent-visible data in a `.houston/` folder alongside the project root. Agent-visible data lives in files, not SQLite.

**The rule:** If @houston-ai has a component that renders it, the data goes in `.houston/`.
**App-specific data** goes in `.houston/`.

### File structure

Data types live in per-type folders, each with a co-located JSON Schema so agents
can discover the expected shape without consulting external docs.

```
~/Documents/Houston/{WorkspaceName}/{AgentName}/
  .houston/
    agent.json                     -- AgentMeta (id, manifest_id, created_at, last_opened_at)
    activity/
      activity.json                -- Activity[]
      activity.schema.json         -- JSON Schema for Activity[]
    routines/
      routines.json                -- Routine[]
      routines.schema.json
    routine_runs/
      routine_runs.json            -- RoutineRun[]
      routine_runs.schema.json
    config/
      config.json                  -- ProjectConfig
      config.schema.json
    learnings/
      learnings.json               -- Learning[] ({ id, text, created_at })
      learnings.schema.json
    prompts/                       -- Editable system prompt components
      system.md
      self-improvement.md
    sessions/
      {session_key}.sid            -- One file per conversation (Claude session id for --resume)
  .agents/
    skills/                        -- One directory per skill (skill.sh / Claude Code convention)
      <name>/SKILL.md              -- YAML frontmatter + body
  .claude/
    skills/<name>                  -- Symlink into ../../.agents/skills/<name>
  CLAUDE.md                        -- Agent instructions (agent root)
```

**The two commands.** All agent file I/O from the frontend goes through two
generic Tauri commands:

- `read_agent_file(agent_path, rel_path) -> string` — atomic read, returns `""` if missing
- `write_agent_file(agent_path, rel_path, content) -> ()` — atomic temp+rename, emits the matching `HoustonEvent`

Schemas are authoritative. The `houston-agent-files` crate embeds the five
JSON Schemas from `packages/agent-schemas/src/*.schema.json` via `include_str!`
and seeds them into every agent's `.houston/<type>/<type>.schema.json` on
first launch. Agent prompts instruct the model to read the schema before
writing the matching data file.

**Migration from the legacy flat layout** (`.houston/activity.json` etc.) is
handled by `houston_agent_files::migrate_agent_data()`, which runs on every
`seed_agent()` call. It's idempotent and leaves the old files in place as a
rollback safety net.

**Skills format & discovery:** Skills live at `.agents/skills/<name>/SKILL.md` — the skill.sh convention, also what Claude Code looks for. Houston mirrors each skill as a symlink under `.claude/skills/<name>` so Claude Code picks them up natively. Flat `.md` files dropped directly under `.agents/skills/` are auto-migrated into `<name>/SKILL.md` directory layout on the next `list_skills` call.

### Activity statuses
`"queue"`, `"running"`, `"needs_you"`, `"done"`, `"cancelled"`

### Key design decisions
- **Two generic commands, not typed CRUD.** The frontend calls `read_agent_file`/`write_agent_file` with a relative path. Per-type folder + schema handles type safety in TS.
- **JSON Schema, not Zod.** Schemas are agent-readable (a plain `.schema.json` file the model can open) and embedded into the Rust binary via `include_str!`.
- **Agents read/write files directly** — no CLI intermediary. Same path, same schema, same atomic writes as the app.
- **All writes are atomic** (temp-file + rename) and path-traversal-safe (guarded by `houston-agent-files::safe_relative`).
- **SQLite is minimal** — only `chat_feed` (conversation replay) and `preferences` (app settings) remain as permanent tables.

### AI-Native Reactivity

Houston is an AI-native workspace. **Users and LLMs are equal participants** — both can read and write all workspace data, and all changes from either must be immediately visible to both.

**Two writers to agent files:**
1. **The frontend** (via Tauri commands) — user clicks "Create Activity" -> Tauri command -> Rust writes file
2. **Claude CLI agents** (direct file writes) — agent decides to install a skill -> writes directly to `.agents/skills/<name>/SKILL.md`

**Three-layer reactivity stack:**
1. **TanStack Query (frontend)** — all `.houston/` data fetching uses `useQuery` with query keys like `["activity", agentPath]`. Automatic dedup, background refresh, stale-while-revalidate.
2. **Event emission on Tauri command writes (Rust)** — `write_skill()` emits `SkillsChanged`, `create_activity()` emits `ActivityChanged`, etc. A global listener invalidates the matching query key.
3. **File watcher on `.houston/` (Rust, `notify` crate)** — catches agent writes that bypass Tauri commands. Emits the same events as layer 2. Debounced to avoid noise.

**The rule:** Never build a feature where the agent can change data but the UI won't reflect it until manual refresh. If it's in `.houston/`, it must be reactive.

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
| `ChatPanel` | Full chat: messages, streaming, thinking, tools, input — one component. Forwards composer controlled props through to `ChatInput`. |
| `ChatInput` | Composer with send/stop/mic states, auto-expand textarea, file attachments via the + button **and** drag-and-drop (drop target is the whole `ChatPanel`). Text and attachments can be controlled via `value`/`onValueChange` and `attachments`/`onAttachmentsChange`, or left uncontrolled. Duplicate files (same name+size+mtime) are silently deduped; the library surfaces a `"File already in chat"` message via the optional `onNotice` callback so the app can show a toast. |
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
  onSend={(text, files) => sendToAgent(text, files)}
  isLoading={isStreaming}
  renderMessageAvatar={(msg) =>
    msg.source ? <ChannelAvatar source={msg.source} /> : undefined
  }
/>
```

**Composer attachments — controlled mode:**
When the parent owns composer state (e.g. to scope file uploads to a
specific conversation id), pass `value`/`onValueChange` and
`attachments`/`onAttachmentsChange`. The Houston app does this in
`chat-tab.tsx` so that uploaded files can be persisted under
`<app cache>/houston/attachments/agent-<id>/` before sending.

```tsx
const [text, setText] = useState("")
const [files, setFiles] = useState<File[]>([])

<ChatPanel
  value={text} onValueChange={setText}
  attachments={files} onAttachmentsChange={setFiles}
  onSend={async () => {
    const paths = await tauriAttachments.save(`agent-${id}`, files)
    sendToAgent(withAttachmentPaths(text, paths))
    setText(""); setFiles([])
  }}
  ...
/>
```

**Drop zone is panel-wide, not composer-only:**
The drag-and-drop target is `ChatPanel`'s root container, not just the
composer. An `Empty`-style overlay (`bg-white/80 backdrop-blur-sm`) with a
`FilesIcon`, "Add anything" title, and "Drop your files in here to add it
to the conversation" description is rendered while a file drag is over the
panel. Implementation uses a depth-counted `useFileDropZone` hook so the
overlay only disappears when the drag actually leaves the outer container.
Dropped files flow through the same controlled-attachments path as the +
button, including dedupe.

**Tauri gotcha — window-level drag-drop must be disabled:**
Tauri 2's webview intercepts OS drag-drop at the window level by default
and never forwards it to the DOM, so HTML `ondrop` handlers never fire.
The fix is `"dragDropEnabled": false` in `app/src-tauri/tauri.conf.json`
under `app.windows[0]`. This has to be set at the window config level,
not per-component. Without it drag-and-drop silently does nothing.

**Chat composer attachments cache (app convention):**
- Files attached in the composer are persisted by Rust under
  `<app cache dir>/houston/attachments/<scope_id>/<filename>`
  via the `save_attachments` Tauri command (base64 over IPC).
- `scope_id` is `agent-<agent-id>` for the main chat tab and
  `activity-<activity-id>` for board/AIBoard conversations.
- The absolute paths returned by `save_attachments` are appended to the
  prompt sent to Claude as `[User attached these files. Read them with
  the Read tool if needed: ...]`. Claude consumes them via its built-in
  `Read` tool — there is no Claude CLI flag for direct file attachment.
- Files survive app restarts so the user can attach, walk away, come
  back, and Claude can still read the original paths via `--resume`.
- Cleanup: `useDeleteActivity`, `handleDelete` (board), and
  `useAgentStore.delete` all call `tauriAttachments.delete(scope_id)`
  so attachments die with their owning conversation/agent.

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

Types: `KanbanItem` (id, title, subtitle, group, status, updatedAt, icon, metadata), `ConversationEntry` (id, title, status, type, sessionKey, updatedAt, agentPath, agentName), `KanbanColumn`.

### @houston-ai/layout
App shell components.

| Component | What it does |
|-----------|-------------|
| `AppSidebar` | Item switcher (projects, agents) with add/delete |
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

### @houston-ai/agent
macOS Finder-style file management components.

| Component | What it does |
|-----------|-------------|
| `FilesBrowser` | Finder list-view clone: sortable columns (Name, Date Modified, Size, Kind), disclosure chevrons, macOS file icons, alternating row stripes, selection highlight, right-click context menu, internal drag-and-drop (move files between folders), external file import from OS, status bar |
| `InstructionsPanel` | Editable agent files as labeled textareas with auto-save on blur |
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
Database layer (libsql/SQLite). Minimal — most persistence lives in file-based `.houston/` agent storage.

**Modules:**
- `repo_chat_feed` — the chat_feed table. Session-keyed by `claude_session_id` only. No legacy v1 `project_id`/`feed_key` columns.
- `repo_search` — FTS5 search over chat_feed by session id.

**Chat feed persistence** (`repo_chat_feed.rs`):
- `add_chat_feed_item_by_session(claude_session_id, feed_type, data_json, source)`
- `list_chat_feed_by_session(claude_session_id)`
- `clear_chat_feed_by_session(claude_session_id)`

**Re-exports:** `Database`, `ChatFeedRow`, `SearchResult`, `SessionMetadata`, `SessionSearchResult`, `sanitize_fts_query`.

### houston-sessions
Claude CLI session management. Spawns `claude -p --output-format stream-json`, parses NDJSON output, manages concurrency.

**Provides:** `SessionManager`, `ClaudeEvent`, `FeedItem`, `StreamAccumulator`, `claude_path`, concurrency semaphores.

### houston-tauri
Tauri-specific helpers. The largest crate — provides session lifecycle, agent persistence, channel management, and app state.

| Module | What it provides |
|--------|-----------------|
| `state.rs` | Generic `AppState` (db, event_queue, scheduler) |
| `events.rs` | `HoustonEvent` enum for Tauri event emission |
| `supervisor.rs` | Session supervisor for concurrent Claude sessions |
| `paths.rs` | `expand_tilde()` — resolves `~` in user-facing paths |
| `chat_session.rs` | `ChatSessionState` — `Arc<Mutex<Option<String>>>` for session ID tracking. Enables `--resume` for conversation continuity. |
| `agent_sessions.rs` | `AgentSessionMap` — per-`(agent_path, session_key)` session state with disk persistence. Loads/saves `.houston/sessions/{session_key}.sid` under the agent folder. Every conversation is independently scoped — there is no shared "main" file. |
| `agent.rs` | `seed_file()` (write-once templates), `build_system_prompt()` (assemble from agent files), `list_files()` / `read_file()` |
| `agent_commands.rs` | Pre-built Tauri commands for file operations: `list_project_files`, `open_file`, `reveal_file`, `delete_file`, `import_files`, `create_agent_folder`, `reveal_agent`, `write_file_bytes`, `read_project_file`, `load_chat_feed`, `load_session_feed` |
| `agent_store/` | File-backed CRUD for `.houston/` agent data. `AgentStore` struct + 23 Tauri commands. Sub-modules: activity, routines, goals, channels, skills, log, config, types, helpers, commands/ |
| `session_runner.rs` | `spawn_and_monitor()` — generic session lifecycle: spawn Claude CLI, emit `HoustonEvent::FeedItem { agent_path, session_key, item }` and `HoustonEvent::SessionStatus { agent_path, session_key, ... }`, persist feed items by `claude_session_id`, write `.houston/sessions/{session_key}.sid` to disk. Auto-calls `claude_path::init()`. Returns `JoinHandle<SessionResult>`. |
| `channel_manager.rs` | `ChannelManager` — starts/stops channel adapters, routes all incoming messages into one `mpsc::UnboundedReceiver<RoutedMessage>`. |
| `tray.rs` | System tray integration utilities |
| `agent_watcher.rs` | File watcher on `.houston/` directory for agent file changes |

**agent_store Tauri commands (25 total):**
Conversations: `list_conversations`, `list_all_conversations` (cross-agent aggregation)
Activity: `list_activity`, `create_activity`, `update_activity`, `delete_activity`
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
    &app_handle, agent_path, session_key, prompt, resume_id,
    working_dir, system_prompt,
    Some(chat_state),   // ChatSessionState for session ID tracking
    Some(PersistOptions {
        db,
        source,
        user_message: Some(prompt.clone()),   // persisted by runner on SessionId arrival
        claude_session_id: None,              // set automatically on SessionId update
    }),
    Some(pid_map),
);
```
Auto-calls `claude_path::init()` (idempotent via `OnceLock`). Emits `HoustonEvent::FeedItem { agent_path, session_key, item }` and `HoustonEvent::SessionStatus { agent_path, session_key, ... }` — events carry `agent_path` so the frontend feed store can scope buckets per agent, making cross-agent message bleeding structurally impossible. Persists feed items to DB keyed by `claude_session_id` once the session ID arrives; the initial user message is buffered in `PersistOptions.user_message` and written at the same moment. Writes `.houston/sessions/{session_key}.sid` under the agent folder for `--resume` on restart. Returns `SessionResult { response_text, claude_session_id, error }`.

### Agent Session Map
```rust
let session_map: AgentSessionMap = Default::default();
let state = session_map
    .get_for_session(&format!("{agent_path}:{session_key}"), &agent_path, &session_key)
    .await;
// On first access, loads .houston/sessions/{session_key}.sid from disk
```
One `ChatSessionState` per `(agent_path, session_key)` pair. No shared "main" file — every conversation is independently scoped. `remove_agent(&format!("{agent_path}:"))` drops all in-memory state for a deleted agent.

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

### Agent Helpers
- `seed_file(dir, name, content)` — write once, never overwrite user edits
- `build_system_prompt(dir, base, bootstrap_name, files)` — assemble prompt from agent files
- `list_files(dir, known)` / `read_file(dir, name, allowed)` — UI-safe file enumeration

### AgentStore
```rust
let store = AgentStore::new(&project_folder);
store.ensure_houston_dir()?;            // creates .houston/ if missing
let items = store.list_activity()?;     // reads .houston/activity.json
let item = store.create_activity("Title", "Desc")?;
store.update_activity(&item.id, ActivityUpdate { status: Some("done".into()), ..Default::default() })?;
store.delete_activity(&item.id)?;
// Same CRUD pattern for routines, goals, channels, skills, log, config
```
All operations use atomic temp-file + rename to prevent corruption. Types defined in `agent_store::types` — all derive `Serialize + Deserialize`.

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

## Logging & Debugging

All logging writes to files at `~/.houston/logs/`:

| File | Source | What |
|------|--------|------|
| `backend.log` | `tracing` (Rust) | Session I/O, agent store, channels, watcher, scheduler, Composio |
| `frontend.log` | `logger.ts` (TS) | console.error/warn, React crashes, Tauri command errors |

**Rust:** Uses `tracing` macros (`tracing::info!`, `tracing::error!`, etc.) everywhere. Initialized in `app/src-tauri/src/logging.rs` with `tracing-subscriber` + daily rolling file appender. Default filter: `info` globally, `debug` for `houston_sessions` and `houston_tauri`. Override with `RUST_LOG` env var.

**Frontend:** `logger` from `app/src/lib/logger.ts` — `logger.error()`, `logger.warn()`, `logger.info()`, `logger.debug()`. `console.error` and `console.warn` are monkey-patched at startup to also write to `frontend.log`.

**Bug reports:** "Report bug" on error toasts attaches the last 50 lines from both log files via the `read_recent_logs` Tauri command.

**Tauri commands:** `write_frontend_log(level, message, context)`, `read_recent_logs(lines?)`.

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
9. **Session ID persists per conversation.** `spawn_and_monitor` writes `.houston/sessions/{session_key}.sid` under the agent folder for every session. There is no shared "main" `.claude_session_id` file — every session_key is independently scoped. `AgentSessionMap` loads the per-session file on first access for `--resume`.
10. **Agents read/write `.houston/` files directly.** Apps use `agent_store` Tauri commands. There is no CLI intermediary for agent data.
11. **Session key → (agent_path, session_key) scoping.** `HoustonEvent::FeedItem` and `SessionStatus` events carry both `agent_path` and `session_key`. The frontend feed store is nested `Record<agentPath, Record<sessionKey, FeedItem[]>>` so cross-agent bleeding is structurally impossible. Never use a bare session_key (like the old `"main"`) as a global namespace.
12. **`useSessionEvents` vs `useHoustonEvent`:** Prefer `useSessionEvents` for session-related events (FeedItem, SessionStatus, Toast). It uses ref-based handlers to avoid the race condition where handler recreation tears down and re-registers the listener, causing missed events. `useHoustonEvent` is lower-level for one-off event subscriptions.

---

## Running

```bash
pnpm install               # Install all workspace dependencies
pnpm typecheck             # TypeScript check all packages
cargo test --workspace     # Rust tests
npx tsc --noEmit -p packages/core/tsconfig.json  # Check one package
```
