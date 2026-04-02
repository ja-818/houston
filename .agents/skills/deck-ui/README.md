<p align="center">
  <strong>Keel & Deck</strong>
</p>

<p align="center">
  The framework for building AI agent desktop apps.
</p>

<p align="center">
  <a href="https://www.npmjs.com/org/deck-ui"><img src="https://img.shields.io/npm/v/@deck-ui/core?label=npm&color=0d0d0d" alt="npm"></a>
  <a href="https://crates.io/crates/keel-sessions"><img src="https://img.shields.io/crates/v/keel-sessions?color=0d0d0d" alt="crates.io"></a>
  <a href="https://github.com/ja-818/keel-and-deck/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-0d0d0d" alt="MIT License"></a>
  <a href="https://github.com/ja-818/keel-and-deck/stargazers"><img src="https://img.shields.io/github/stars/ja-818/keel-and-deck?color=0d0d0d" alt="Stars"></a>
  <a href="https://skills.sh"><img src="https://img.shields.io/badge/skills.sh-deck--ui-0d0d0d" alt="AI Skill"></a>
</p>

---

<!-- screenshot: full app with board + chat side by side -->

## What is this?

Keel & Deck is a complete toolkit for building desktop apps that orchestrate AI coding agents like Claude Code, Codex, and others. **Deck** gives you 8 React packages with 70+ production-ready components. **Keel** gives you 3 Rust crates for session management, SQLite persistence, and Tauri integration. Wire them together and you have a full agent management app in an afternoon.

Built with Tauri 2, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, and Framer Motion.

---

## Components

### KanbanBoard

The centerpiece. A status-driven board that groups items into columns. When an agent is running, its card gets a rotating conic-gradient glow -- blue to indigo to orange -- animated via `@property` and pure CSS.

<!-- screenshot: kanban board with one card glowing -->

```tsx
import { KanbanBoard } from "@deck-ui/board"

const columns = [
  { id: "todo",    label: "To Do",    statuses: ["todo"] },
  { id: "running", label: "Running",  statuses: ["running"] },
  { id: "done",    label: "Done",     statuses: ["completed", "approved"] },
]

<KanbanBoard
  columns={columns}
  items={tasks}
  onSelect={(item) => openDetail(item.id)}
  onApprove={(item) => approve(item.id)}
  runningStatuses={["running"]}
/>
```

### ChatPanel

One component. Streaming markdown, thinking blocks, tool activity, auto-scroll, input with stop button. Feed it an array of `FeedItem` objects and a send callback. That's it.

<!-- screenshot: chat panel with streaming response and tool activity -->

```tsx
import { ChatPanel } from "@deck-ui/chat"

<ChatPanel
  sessionKey={session.id}
  feedItems={feedItems}
  onSend={(text) => sendMessage(text)}
  onStop={() => stopSession()}
  isLoading={isStreaming}
  placeholder="Ask the agent..."
/>
```

### SkillsGrid

Installed skills with an optional community marketplace. Search [skills.sh](https://skills.sh), install with one click.

<!-- screenshot: skills grid with installed and community sections -->

```tsx
import { SkillsGrid } from "@deck-ui/skills"

<SkillsGrid
  skills={installedSkills}
  loading={false}
  onSkillClick={(skill) => navigate(`/skills/${skill.id}`)}
  community={{
    onSearch: (q) => searchCommunitySkills(q),
    onInstall: (skill) => installSkill(skill),
  }}
/>
```

### Sidebar + TabBar

App-level navigation. The sidebar handles project/chat lists with add/delete. The tab bar handles view switching with optional badges and actions.

<!-- screenshot: sidebar with tab bar -->

```tsx
import { AppSidebar, TabBar } from "@deck-ui/layout"

<AppSidebar
  logo={<Logo />}
  items={projects}
  selectedId={activeProject}
  onSelect={setActiveProject}
  onAdd={createProject}
/>

<TabBar
  title="Houston"
  tabs={[
    { id: "board", label: "Board" },
    { id: "chat", label: "Chat", badge: unreadCount },
    { id: "skills", label: "Skills" },
  ]}
  activeTab={currentTab}
  onTabChange={setCurrentTab}
/>
```

---

## Quick Start

```bash
# Deck (React components)
pnpm add @deck-ui/core @deck-ui/board @deck-ui/chat

# Keel (Rust crates) -- add to your Cargo.toml
cargo add keel-sessions keel-db keel-tauri
```

Import the base styles in your app entry:

```tsx
import "@deck-ui/core/src/globals.css"
import "@deck-ui/board/src/styles.css"
import "@deck-ui/chat/src/styles.css"
```

---

## AI Skill

Teach your coding agent (Claude Code, Codex, etc.) how to use every Deck UI component with correct props, types, and patterns:

```bash
npx skills add ja-818/keel-and-deck
```

This installs the [SKILL.md](./SKILL.md) into your project — a comprehensive reference covering all 10 packages, 70+ components, TypeScript interfaces, and real-world wiring examples. Your agent will know exactly what exists and how to use it.

Browse it on [skills.sh](https://skills.sh).

---

## Packages

### Deck (React)

| Package | Description |
|---|---|
| [`@deck-ui/core`](./packages/core) | 36 shadcn/ui components, design tokens, CSS animations |
| [`@deck-ui/chat`](./packages/chat) | ChatPanel, AI Elements, streaming markdown, tool activity |
| [`@deck-ui/board`](./packages/board) | KanbanBoard, KanbanCard, KanbanColumn, detail panel |
| [`@deck-ui/layout`](./packages/layout) | AppSidebar, TabBar, SplitView, ResizablePanel |
| [`@deck-ui/skills`](./packages/skills) | SkillsGrid, SkillDetailPage, community marketplace |
| [`@deck-ui/routines`](./packages/routines) | RoutinesGrid, RoutineDetailPage, RoutineRunPage |
| [`@deck-ui/connections`](./packages/connections) | ConnectionsView, ConnectionRow |
| [`@deck-ui/review`](./packages/review) | ReviewSplit, ReviewDetail, DeliverableCard |

### Keel (Rust)

| Crate | Description |
|---|---|
| [`keel-sessions`](./crates/keel-sessions) | Claude/Codex CLI process management, NDJSON parsing, event pumping |
| [`keel-db`](./crates/keel-db) | SQLite database layer via libsql -- projects, issues, sessions, feed |
| [`keel-tauri`](./crates/keel-tauri) | Tauri 2 plugin wrapping sessions + database |

---

## Theming

Everything is controlled by CSS variables. Override them to make it yours.

```css
@theme {
  --color-background: #ffffff;
  --color-foreground: #0d0d0d;
  --color-primary: #0d0d0d;
  --color-primary-foreground: #ffffff;
  --color-secondary: #f9f9f9;
  --color-muted: #f9f9f9;
  --color-muted-foreground: #5d5d5d;
  --color-accent: #ececec;
  --color-border: rgba(0, 0, 0, 0.08);
  --color-destructive: #e02e2a;
  --color-success: #00a240;
  --color-warning: #e0ac00;
  --color-sidebar: #f9f9f9;
  --radius: 0.5rem;
}
```

The default theme follows a ChatGPT-inspired monochrome palette: near-black foreground, white backgrounds, subtle borders. Swap the variables for dark mode, brand colors, or anything else.

---

## Built with Keel & Deck

### [Houston](https://github.com/ja-818/houston)

An AI agent orchestrator for software teams. Manages Claude Code sessions from a Kanban board, streams agent output to a chat panel, and coordinates skills, routines, and code review -- all built on Keel & Deck.

<!-- screenshot: houston app -->

*Building something with Keel & Deck? Open a PR to add it here.*

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Your Tauri App                       │
├──────────────────────┬──────────────────────────────────┤
│                      │                                   │
│   Deck (React)       │   Keel (Rust)                     │
│                      │                                   │
│   @deck-ui/core      │   keel-tauri                      │
│   @deck-ui/board     │     ├── keel-sessions             │
│   @deck-ui/chat      │     │     ├── SessionManager      │
│   @deck-ui/layout    │     │     ├── NDJSON Parser        │
│   @deck-ui/skills    │     │     └── Event Pump           │
│   @deck-ui/routines  │     └── keel-db                   │
│   @deck-ui/connectns │           ├── Database (libsql)    │
│   @deck-ui/review    │           ├── Migrations           │
│                      │           └── Repositories         │
│                      │                                   │
├──────────────────────┴──────────────────────────────────┤
│                    Tauri 2 IPC Bridge                     │
├─────────────────────────────────────────────────────────┤
│              Claude Code / Codex / Other CLIs             │
└─────────────────────────────────────────────────────────┘
```

**Deck** components are props-driven with no store lock-in. Use Zustand, Redux, Jotai, signals -- whatever you want. Pass data down, get callbacks up.

**Keel** crates handle the heavy lifting: spawning CLI processes, parsing streaming NDJSON output, managing concurrency, and persisting everything to SQLite via libsql.

**Tauri IPC** connects the two layers. `keel-tauri` wraps both crates into a Tauri plugin with typed commands and event emission.

---

## Contributing

Contributions welcome. If you find a bug or want to add a feature:

1. Fork the repo
2. Create a branch (`git checkout -b feat/my-feature`)
3. Make your changes
4. Run `pnpm build && cargo test --workspace`
5. Open a PR

---

## License

MIT
