<p align="center">
  <a href="https://gethouston.ai">
    <strong>Houston</strong>
  </a>
</p>

<p align="center">
  <strong>OpenClaw for non-technical founders.</strong><br>
  One desktop app. A workspace of pre-built AI agents that generate value from day one.<br>
  Real tools. 1000+ integrations. Trained on real tasks. Free forever.
</p>

<p align="center">
  <a href="https://gethouston.ai">gethouston.ai</a> ·
  <a href="https://gethouston.ai/vision/">Vision</a> ·
  <a href="https://gethouston.ai/learn/">Learn</a> ·
  <a href="https://forms.gle/ac24qrKSufYvfudt8">Join the waiting list</a> ·
  <a href="https://x.com/ja818_">@ja818_</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/org/houston-ai"><img src="https://img.shields.io/npm/v/@houston-ai/core?label=npm&color=0d0d0d" alt="npm"></a>
  <a href="https://crates.io/crates/houston-sessions"><img src="https://img.shields.io/crates/v/houston-sessions?color=0d0d0d" alt="crates.io"></a>
  <a href="https://github.com/ja-818/houston/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-0d0d0d" alt="MIT License"></a>
  <a href="https://github.com/ja-818/houston/stargazers"><img src="https://img.shields.io/github/stars/ja-818/houston?color=0d0d0d" alt="Stars"></a>
</p>

---

## Houston is three things at once

**For non-technical users —** a free Mac app you download. Install a workspace built by someone else (a fundraising co-pilot, a sales outreach engine, a customer-support triage system) and you get real AI agents working for you on day one. No terminal. No prompt engineering. No 40-hour learning curve.

**For developers —** an open-source framework for building AI agent experiences. React packages for the UI, Rust crates for the engine. Your agent is a manifest + optional custom React. Publish it once, anyone can install it in one click.

**For founders —** the foundation of your vertical AI product. Fork Houston, rename it, ship a workspace specialized for your industry. Your code, your customers, your moat. Skip six months of plumbing and focus on the part that's actually different. We make money by hosting it for you 24/7 — the framework itself is free forever.

> **Read the full vision:** [Why AI-native workspaces](https://gethouston.ai/vision/) — an essay on how every app is CRUD, why AI-as-a-feature has a ceiling, and what changes when humans and AI share all the operations on the same data.

---

## Real agents, not chatbots

Most AI products bolt a chat sidebar onto a SaaS app and call it AI. Houston agents are different.

- **Real tools** — agents read files, run code, send messages, hit APIs, edit documents. The same kind of operations a human teammate would do — not text snippets pretending to be actions.
- **1000+ integrations** — Slack, Notion, Linear, Stripe, Gmail, HubSpot, Google Drive, GitHub, and a thousand more. Connect once, the agent works across all of them.
- **Trained on real tasks** — every agent in the store ships pre-configured for a specific job: outbound sequences, fundraising memos, ICP analysis, support triage. Real, tested playbooks — not generic prompting.
- **Files-first architecture** — agent-visible data lives in `.houston/` files, not in a database. Agents read and write naturally; you can open the same files yourself in any text editor.
- **Symmetric participation** — both you and the AI can take any action. Click a button or ask in chat — same outcome, same data.

---

## Quick start

### Run the Houston app

```bash
git clone https://github.com/ja-818/houston.git
cd houston
pnpm install
cd app && pnpm tauri dev
```

On first launch, create a workspace and an agent. Pick an agent definition (Project Manager, Research Agent, Code Reviewer, etc.) and start chatting with Claude.

### Build your own agent

```bash
npx create-houston-agent my-app
cd my-app
pnpm install
pnpm tauri dev
```

You get a working app with Chat + CLAUDE.md editor out of the box. Add `@houston-ai` components as you need them. The [Learn guide](https://gethouston.ai/learn/) walks through the full mental model in eight short chapters — written for developers who've built with AI before.

### Fork it (for founders building a vertical)

```bash
git clone https://github.com/ja-818/houston.git my-vertical-app
cd my-vertical-app
# Rename, rebrand, build on top
```

Your code, your customers, your moat. Free under MIT. If you hit something missing in the base framework, send it back as a PR. [Get in touch](mailto:hello@gethouston.ai) when you're ready to scale.

---

## How the app works

Houston organizes work into **Workspaces** and **Agents**:

- **Workspace** — top-level container (like a team or project group). Each workspace has its own connections and agents.
- **Agent** — an AI agent instance powered by an agent definition. Each agent has a chat, optional kanban board, skills, files, and more.
- **Agent Definition** — defines what tabs and capabilities an agent has. Pick from built-in definitions or build your own.

```
Workspace ("My Startup")
  +-- Agent ("Growth Agent")          <- definition: Growth Agent
  |     Activity | Chat | Skills | Routines | Files
  +-- Agent ("Investor Relations")    <- definition: Investor Relations
  |     Activity | Chat | Context | Skills
  +-- Agent ("Sales Outreach")        <- definition: Sales Outreach
        Activity | Chat | Files | Skills
```

Each kanban card on the **Activity** tab is a Claude conversation. Click a card to see its full chat history. The agent's progress shows as a step-by-step checklist alongside the chat. Connect Slack and the same conversation becomes a thread — reply from your phone, the agent responds there too.

---

## Agent Definition System

Agent definitions are JSON manifests that define what an AI agent looks like. Three tiers:

| Tier | What you write | What you get |
|------|---------------|-------------|
| **JSON-only** | `manifest.json` | Tabs, prompt, colors, icon — uses built-in components |
| **Custom React** | `manifest.json` + `bundle.js` | Custom React components (import @houston-ai as peer deps) |
| **Custom Rust** | PR a new crate | Declare `features: ["capability"]` in manifest |

### Manifest example

```json
{
  "id": "growth-agent",
  "name": "Growth Agent",
  "description": "Competitor teardowns, outbound sequences, ICP analysis",
  "icon": "Zap",
  "tabs": [
    { "id": "activity", "label": "Activity", "builtIn": "board" },
    { "id": "chat", "label": "Chat", "builtIn": "chat" },
    { "id": "skills", "label": "Skills", "builtIn": "skills" },
    { "id": "routines", "label": "Routines", "builtIn": "routines" },
    { "id": "files", "label": "Files", "builtIn": "files" }
  ],
  "defaultTab": "activity",
  "systemPrompt": "You are a growth marketing expert...",
  "claudeMd": "# Growth Agent\n..."
}
```

**Built-in tab types:** `chat`, `board`, `skills`, `files`, `connections`, `context`, `routines`, `channels`, `events`, `learnings`

**9 built-in agent definitions:** Default, Project Manager, Meeting Assistant, Research Agent, Data Analyst, Code Reviewer, DevOps, Content Writer, Customer Support.

**Installed agent definitions** load from `~/.houston/agents/{id}/manifest.json`.

---

## Agent Convention

Every Houston agent stores agent-visible data in a `.houston/` folder:

```
~/Documents/Houston/{WorkspaceName}/{AgentName}/
  .houston/
    agent.json          # Agent metadata (id, manifest, timestamps)
    activity.json       # Kanban board items
    routines.json       # Recurring schedules
    goals.json          # High-level objectives
    channels.json       # Messaging integrations (Telegram, Slack)
    skills/             # Agent skill instructions
      research.md       #   ## Instructions + ## Learnings
    prompts/            # Editable system prompt components
      system.md         #   Base system prompt
      self-improvement.md
    log.jsonl           # Session audit trail
    config.json         # Project settings (model, effort)
  CLAUDE.md             # Agent instructions
```

**The rule:** if `@houston-ai` has a component that renders it, the data lives in `.houston/`. App-specific files go in their own folder.

Agents interact with these files directly — no CLI intermediary, no SQL queries. The `agent_store` module provides typed CRUD with atomic writes. Because everything lives in plain files, **you can read and edit the same data yourself in any text editor**, and the agent sees it instantly via the file watcher.

---

## Houston UI (React Packages)

11 packages on `@houston-ai/*`. Generic, props-driven, no store lock-in. Use Zustand, Redux, Jotai — whatever you want.

### @houston-ai/core

The foundation. 38 shadcn/ui components, design tokens, animations, and base hooks.

| Export | What it does |
|--------|-------------|
| **38 components** | Button, Card, Dialog, Empty, Badge, ScrollArea, DropdownMenu, Tabs, Sheet, Tooltip, Spinner, Stepper, ConfirmDialog, ErrorBoundary, and 24 more |
| `cn()` | Tailwind class merge utility |
| `useSessionEvents()` | Base hook for Tauri event subscription (dependency-injected `listen`) |
| `useHoustonEvent()` | Low-level Tauri event hook (dynamic import) |
| `HoustonEvent` | TypeScript type matching the Rust `HoustonEvent` enum |

### @houston-ai/chat

Drop-in chat experience for Claude sessions. One component does streaming markdown, thinking blocks, tool activity, auto-scroll, and input.

| Export | What it does |
|--------|-------------|
| `ChatPanel` | Full chat — messages + streaming + thinking + tools + input |
| `ChatInput` | Input with send/stop/mic states, auto-expand textarea |
| `ToolActivity` | Collapsing tool call list with spinners and elapsed time |
| `ProgressPanel` | Step checklist (pending/active/done states) |
| `useProgressSteps()` | Parses `update_progress` tool calls from feed |
| `feedItemsToMessages()` | Converts FeedItems to ChatMessages (extracts `[Channel]` prefix) |
| `mergeFeedItem()` | Smart-merges streaming feed items |
| `ChannelAvatar` | Branded avatar for Telegram/Slack |
| `Conversation` | Auto-scrolling message container |
| `Message` | Role-aware message bubble with branching |
| `Reasoning` | Collapsible thinking block |
| `PromptInput` | Complex input system with file upload, screenshots, tabs, commands |
| `ChatSidebar` | Progress tracking sidebar with step checklist + channels list |
| `Shimmer` | Animated gradient loading text |
| `Suggestion` | Horizontal scrollable suggestion pills |

### @houston-ai/board

Kanban board with animated cards that glow when agents are running.

| Export | What it does |
|--------|-------------|
| `KanbanBoard` | Status-driven board, configurable columns |
| `KanbanColumn` | Animated card list with Framer Motion transitions |
| `KanbanCard` | Status-aware card with conic-gradient glow animation |
| `KanbanDetailPanel` | Right panel with header + children slot |
| `AIBoard` | Higher-level: KanbanBoard + KanbanDetailPanel + ChatPanel wired together |

### @houston-ai/layout

App shell components.

| Export | What it does |
|--------|-------------|
| `AppSidebar` | Workspace/agent switcher with add/delete |
| `TabBar` | Tab navigation with optional badges and actions |
| `SplitView` | Resizable two-panel layout (default 55/45) |

### @houston-ai/connections

Channel and service connection management.

| Export | What it does |
|--------|-------------|
| `ConnectionsView` | Full view: service connections + channels section |
| `ChannelConnectionCard` | Channel row with status, connect/disconnect actions |
| `ChannelSetupForm` | Config form for Slack/Telegram tokens |
| `ChannelsSection` | Channel list with "Add Channel" dropdown |

### @houston-ai/events

Event feed for heartbeats, cron jobs, channel messages.

| Export | What it does |
|--------|-------------|
| `EventFeed` | Event list with type icons and status |
| `EventItem` | Individual event row |
| `EventFilter` | Event type filter |

### @houston-ai/routines

Recurring automated task management.

| Export | What it does |
|--------|-------------|
| `RoutinesGrid` | Grid of routine cards |
| `RoutineDetailPage` | Detail view with edit form |
| `RoutineRunPage` | Execution view with feed |
| `RunHistory` | History list |
| `ScheduleBuilder` | Visual schedule configuration |
| `HeartbeatConfig` | Heartbeat interval picker |

### @houston-ai/skills

Agent skill management with community marketplace.

| Export | What it does |
|--------|-------------|
| `SkillsGrid` | Grid of installed skills |
| `SkillDetailPage` | Detail view with instructions + learnings |
| `CommunitySkillsSection` | Browse and install from skills.sh |

### @houston-ai/review

Review queue for completed agent work.

| Export | What it does |
|--------|-------------|
| `ReviewSplit` | Split layout: sidebar list + detail panel |
| `ReviewDetail` | Deliverables, output summary, feedback |
| `DeliverableCard` | File deliverable with open/reveal actions |

### @houston-ai/agent

Agent file management.

| Export | What it does |
|--------|-------------|
| `FilesBrowser` | File browser with folder grouping, type icons, drag-and-drop |
| `InstructionsPanel` | Editable instruction files with auto-save on blur |

### @houston-ai/memory

Agent memory and learnings store.

| Export | What it does |
|--------|-------------|
| `MemoryBrowser` | Browse and edit agent learnings |

---

## Houston Engine (Rust Crates)

8 crates on `houston-*`. The runtime your agent needs to actually do work.

### houston-sessions

Claude CLI session management. Spawns `claude -p --output-format stream-json`, parses NDJSON output, manages concurrency.

| Export | What it does |
|--------|-------------|
| `SessionManager` | Spawns Claude sessions |
| `StreamAccumulator` | Accumulates NDJSON deltas into FeedItems |
| `FeedItem` | Chat feed item enum (AssistantText, Thinking, ToolCall, etc.) |
| `claude_path` | PATH resolution for macOS .app bundles (shell, nvm, common dirs) |
| Concurrency | Global semaphore limits concurrent Claude processes |

### houston-db

Minimal SQLite layer. Two tables: `chat_feed` and `preferences`. That's it — agent-visible data lives in files, not in the DB.

| Export | What it does |
|--------|-------------|
| `Database` | SQLite connection wrapper (libsql) |
| `add_chat_feed_item_by_session()` | Persist feed item keyed by `claude_session_id` |
| `list_chat_feed_by_session()` | Load conversation by `claude_session_id` |
| `get_preference()` / `set_preference()` | Key-value app settings |

### houston-tauri

The integration layer. Wraps everything into Tauri 2 commands and state.

| Module | What it provides |
|--------|-----------------|
| `agent_store` | Typed CRUD for `.houston/` files — 23 Tauri commands for activities, routines, goals, channels, skills, log, config |
| `session_runner` | `spawn_and_monitor()` — spawn Claude, emit events, persist feed, track session ID to disk |
| `session_queue` | Sequential message queue with automatic `--resume` |
| `agent_sessions` | Per-agent session state with `.claude_session_id` disk persistence |
| `channel_manager` | Start/stop channel adapters, route messages, auto-reconnect |
| `events` | `HoustonEvent` enum for Rust→JS event emission |
| `agent` | Seed files, build system prompts, file operations |
| `tray` | System tray with show/quit menu |
| `paths` | `expand_tilde()` for user-facing paths |

### houston-channels

Channel adapters for messaging platforms.

| Export | What it does |
|--------|-------------|
| `TelegramChannel` | Long-polling via `getUpdates`, typing indicators |
| `SlackChannel` | Socket Mode WebSocket, `chat.postMessage`, threading per conversation |
| `Channel` trait | `connect()`, `disconnect()`, `send_message()`, `send_typing()` |

### houston-events

Event queue for hooks, webhooks, and lifecycle events.

### houston-scheduler

Cron jobs and heartbeat timer scheduling.

### houston-memory

Agent memory store (evaluating for removal — most learnings now live in `.houston/memory/`).

---

## Architecture

```
+-------------------------------------------------------------+
|                Houston App / Your Tauri App                  |
|   Workspaces > Agents > Agent Definitions                   |
+------------------------+------------------------------------+
|                        |                                    |
|   Houston UI (React)   |   Houston Engine (Rust)            |
|                        |                                    |
|   @houston-ai/core     |   houston-tauri                    |
|   @houston-ai/chat     |     +-- agent_store (.houston/)    |
|   @houston-ai/board    |     +-- session_runner/queue       |
|   @houston-ai/layout   |     +-- channel_manager            |
|   @houston-ai/skills   |     +-- houston-sessions           |
|   @houston-ai/routines |     |     +-- Claude CLI process   |
|   @houston-ai/...      |     +-- houston-db                 |
|                        |           +-- chat_feed (SQLite)   |
|                        |                                    |
+------------------------+------------------------------------+
|                    Tauri 2 IPC Bridge                        |
+------------------------+------------------------------------+
|   .houston/ files      |   Claude Code / Codex / Other      |
|   (agent data)         |   (AI agent processes)             |
+------------------------+------------------------------------+
```

**Houston UI** components are props-driven with no store lock-in. Use Zustand, Redux, Jotai — whatever you want.

**Houston Engine** handles session lifecycle, agent file management, and channel routing. Agent-visible data lives in `.houston/` files. SQLite is only for chat conversation replay.

**Built on Claude Code** — and on anything shaped like it. Claude Code is the default local agent runtime, but Houston works with Codex or any other coding agent that can read files, write files, and run commands inside a working directory.

---

## Theming

Everything is controlled by CSS variables:

```css
@theme {
  --color-primary: #0d0d0d;           /* Near-black (default) */
  --color-primary-foreground: #ffffff;
  --color-secondary: #f9f9f9;
  --color-muted-foreground: #5d5d5d;
  --color-border: rgba(0, 0, 0, 0.08);
}
```

Override `--color-primary` for brand theming. All components pick it up automatically.

---

## Monorepo layout

```
houston/
├── app/                Houston app (Tauri 2) — the flagship desktop app
│   ├── src/            React frontend
│   └── src-tauri/      Rust backend
├── packages/           @houston-ai/* — 11 React packages
│   ├── core/
│   ├── chat/
│   ├── board/
│   ├── layout/
│   ├── connections/
│   ├── events/
│   ├── memory/
│   ├── routines/
│   ├── skills/
│   ├── review/
│   └── agent/
├── crates/             houston-* — 8 Rust crates
│   ├── houston-sessions/
│   ├── houston-db/
│   ├── houston-tauri/
│   ├── houston-channels/
│   ├── houston-events/
│   ├── houston-scheduler/
│   └── houston-memory/
├── create-app/         create-houston-agent — scaffolding template
├── showcase/           Component showcase — live demos for all @houston-ai components
└── redirect-page/      gethouston.ai — landing + vision essay + learn guide
```

---

## Resources

- **[gethouston.ai](https://gethouston.ai)** — landing page
- **[Vision essay](https://gethouston.ai/vision/)** — Why AI-native workspaces (the *why* behind Houston)
- **[Learn guide](https://gethouston.ai/learn/)** — Eight chapters on building Houston apps (the *how*)
- **[Join the waiting list](https://forms.gle/ac24qrKSufYvfudt8)** — Get notified when the app ships
- **[skills.sh](https://skills.sh)** — Community AI skills marketplace
- **[@ja818_ on X](https://x.com/ja818_)** — Updates and announcements

---

## AI Skills

Teach your coding agent how to build with Houston:

```bash
npx skills add ja-818/houston
```

Browse on [skills.sh](https://skills.sh).

---

## Built with Houston

Building something on Houston? Open a PR to add it here.

---

## Contributing

Houston is open source under MIT. Issues and PRs welcome — for big architectural changes, open an issue first to discuss the direction.

---

## License

MIT
