---
name: deck-ui
description: "Deck UI (@deck-ui/*) React components for AI agent desktop apps. 10 packages: core (shadcn/ui, KeelEvent, useSessionEvents), chat (ChatPanel, ProgressPanel, streaming), board (KanbanBoard), layout (TabBar, SplitView, AppSidebar), connections, events, routines, skills, review, workspace (FilesBrowser, InstructionsPanel). Props-driven, no store dependencies. Tailwind CSS 4."
---

# Deck UI — Component Reference

10 React packages for building AI agent desktop apps. All components are props-driven with no store dependencies.

## Install

```bash
pnpm add @deck-ui/core @deck-ui/chat @deck-ui/board @deck-ui/layout
pnpm add @deck-ui/connections @deck-ui/events @deck-ui/routines
pnpm add @deck-ui/skills @deck-ui/review @deck-ui/workspace
```

CSS setup (in your main.tsx or App.tsx):
```tsx
import "@deck-ui/core/src/globals.css"
import "streamdown/styles.css"  // required if using ChatPanel
```

## Rules

1. **Props over stores** — never import Zustand/Redux inside @deck-ui. Data via props, actions via callbacks.
2. **Generic types** — `KanbanItem`, `FeedItem`, `ChatMessage`. Apps map domain types at the app level.
3. **No `@/` path aliases** — relative imports within packages, package imports between packages.
4. **Tailwind CSS 4** — no config file. Tokens are CSS variables in `globals.css`. Uses `@tailwindcss/vite`.
5. **Monochrome** — near-black primary (`#0d0d0d`), white bg. Override `--color-primary` for brand color.

---

## @deck-ui/core

Foundation: 38 shadcn/ui components, design tokens, event hooks, utilities.

### Key Components

**Button** — `variant`: default | destructive | outline | secondary | ghost | link. `size`: default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg.

**Card** — Compound: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

**Dialog** — Radix-based modal: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`. `showCloseButton` on DialogContent.

**Empty** — Empty state: `Empty`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`.

**ConfirmDialog** — One-shot: `open`, `onOpenChange`, `title`, `description`, `onConfirm`.

**Other shadcn/ui:** Accordion, Alert, AlertDialog, Avatar, Badge, Collapsible, Command, DropdownMenu, HoverCard, Input, Popover, Progress, ScrollArea, Select, Separator, Sheet, Skeleton, Spinner, Stepper, Switch, Tabs, Textarea, Toast, ToastContainer, Tooltip.

### Utilities and Hooks

```tsx
import { cn } from "@deck-ui/core"                    // clsx + tailwind-merge
import { useIsMobile } from "@deck-ui/core"            // viewport < 768px
import { useKeelEvent } from "@deck-ui/core"           // single Tauri event subscription
import { useSessionEvents } from "@deck-ui/core"       // session event subscription (preferred)
import type { KeelEvent } from "@deck-ui/core"          // TypeScript event union
import type { TauriListenFn, SessionEventsHandlers } from "@deck-ui/core"
```

### KeelEvent Type

Discriminated union matching the Rust `KeelEvent` enum. Variants:

| Variant | Data |
|---------|------|
| `FeedItem` | `{ session_key, item: { feed_type, data } }` |
| `SessionStatus` | `{ session_key, status, error }` |
| `Toast` | `{ message, variant }` |
| `AuthRequired` | `{ message }` |
| `CompletionToast` | `{ title, issue_id }` |
| `EventReceived` | `{ event_id, event_type, source_channel, source_identifier, summary }` |
| `EventProcessed` | `{ event_id, status }` |
| `HeartbeatFired` | `{ prompt, project_id }` |
| `CronFired` | `{ job_id, job_name, prompt }` |
| `ChannelMessageReceived` | `{ channel_type, channel_id, sender_name, text }` |
| `ChannelStatusChanged` | `{ channel_id, channel_type, status, error }` |
| `RoutineRunChanged` | `{ routine_id, run_id, status }` |
| `RoutinesChanged` | `{ project_id }` |

### useSessionEvents

Preferred hook for session events. Dependency-injected `listen` — no build-time Tauri dependency. Ref-based handlers avoid listener teardown race conditions.

```tsx
import { useSessionEvents } from "@deck-ui/core"
import { listen } from "@tauri-apps/api/event"

useSessionEvents({
  listen,
  onFeedItem: (feedKey, item) => store.addFeedItem(item),
  getActiveSessionId: () => store.activeSessionId,
  onEvent: (event) => {
    if (event.type === "ChannelStatusChanged") { /* ... */ }
  },
})
```

Core handling: FeedItem (with desktop-duplicate filtering), SessionStatus (auto-surfaces errors as system_message), Toast. All other events forwarded to `onEvent`.

---

## @deck-ui/chat

Drop-in chat experience for Claude sessions.

### ChatPanel

Full chat: messages + streaming + thinking + tools + input.

| Prop | Type | Description |
|------|------|-------------|
| `sessionKey` | `string` | Unique session identifier |
| `feedItems` | `FeedItem[]` | Feed events from the backend |
| `onSend` | `(text: string) => void` | Send message callback |
| `onStop` | `() => void` | Stop generation callback |
| `isLoading` | `boolean` | Whether session is active |
| `emptyState` | `ReactNode` | Shown when no messages |
| `renderMessageAvatar` | `(msg: ChatMessage) => ReactNode` | Custom avatar per message |
| `renderToolResult` | `(tool: ToolCall) => ReactNode` | Custom tool result renderer |
| `isSpecialTool` | `(name: string) => boolean` | Mark tools for special rendering |
| `toolLabels` | `Record<string, string>` | Custom labels for tool names |

```tsx
import { ChatPanel, ChannelAvatar } from "@deck-ui/chat"

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

### ProgressPanel + useProgressSteps

Multi-step progress display. Agents call `update_progress` tool to communicate steps.

```tsx
import { ProgressPanel } from "@deck-ui/chat"
import { useProgressSteps } from "@deck-ui/chat"

const steps = useProgressSteps(feedItems)
// steps: ProgressStep[] — { title, status: "pending" | "active" | "done" }

<ProgressPanel steps={steps} />
```

### Other Chat Components

| Component | What it does |
|-----------|-------------|
| `ChatInput` | Input with send/stop/mic states, auto-expand textarea |
| `ToolActivity` | Collapsing tool call list with spinners and elapsed time |
| `ChannelAvatar` | Branded circular avatar: telegram (blue), slack (purple), or custom |
| `Conversation` | Auto-scrolling message container |
| `Message` | Role-aware message bubble with branching |
| `Reasoning` | Collapsible thinking block |
| `PromptInput` | Complex input with file upload, screenshots, tabs |
| `Shimmer` | Animated gradient loading text |
| `Suggestion` | Horizontal scrollable suggestion pills |

### Feed Utilities

```tsx
import { feedItemsToMessages, mergeFeedItem } from "@deck-ui/chat"

// Convert FeedItem[] to ChatMessage[] (extracts [ChannelName] prefix into source)
const messages = feedItemsToMessages(feedItems)

// Smart-merge streaming feed items in Zustand store
addFeedItem: (item) => set((s) => ({ items: mergeFeedItem(s.items, item) }))
```

### Chat Types

```typescript
interface FeedItem {
  feed_type: "user_message" | "assistant_text" | "assistant_text_streaming"
    | "thinking" | "thinking_streaming" | "tool_call" | "tool_result"
    | "system_message" | "final_result"
  data: string | object
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  source?: string  // auto-extracted from [ChannelName] prefix
  tools?: ToolEntry[]
}
```

---

## @deck-ui/board

Kanban board with animated cards that glow when agents are running.

### KanbanBoard

| Prop | Type | Description |
|------|------|-------------|
| `columns` | `KanbanColumnConfig[]` | Column definitions |
| `items` | `KanbanItem[]` | Items to display |
| `selectedId` | `string \| null` | Currently selected item |
| `onSelect` | `(item: KanbanItem) => void` | Card click callback |
| `onDelete` | `(item: KanbanItem) => void` | Delete callback |
| `onApprove` | `(item: KanbanItem) => void` | Approve callback |
| `runningStatuses` | `string[]` | Statuses that trigger glow (default: `["running"]`) |
| `approveStatuses` | `string[]` | Statuses that show approve button |
| `emptyState` | `ReactNode` | Empty state content |

```tsx
import { KanbanBoard } from "@deck-ui/board"
import type { KanbanItem, KanbanColumnConfig } from "@deck-ui/board"

const columns: KanbanColumnConfig[] = [
  { id: "active", label: "Active", statuses: ["running"] },
  { id: "review", label: "Review", statuses: ["needs_you"] },
  { id: "done", label: "Done", statuses: ["done"] },
]

<KanbanBoard columns={columns} items={items} onSelect={setSelected} />
```

### KanbanDetailPanel

Side panel with header + children slot. Props: `title`, `subtitle`, `status`, `onClose`, `children`, `actions`, `runningStatuses`, `statusLabels`.

### Board Types

```typescript
interface KanbanItem {
  id: string; title: string; subtitle?: string;
  status: string; updatedAt: string; icon?: ReactNode;
}
interface KanbanColumnConfig { id: string; label: string; statuses: string[] }
```

---

## @deck-ui/layout

### TabBar

| Prop | Type | Description |
|------|------|-------------|
| `tabs` | `Tab[]` | `{ id, label, badge? }` |
| `activeTab` | `string` | Active tab ID |
| `onTabChange` | `(id: string) => void` | Tab click callback |
| `actions` | `ReactNode` | Right-side action buttons |
| `menu` | `ReactNode` | Settings dropdown |

```tsx
import { TabBar } from "@deck-ui/layout"

<TabBar
  tabs={[
    { id: "board", label: "Board" },
    { id: "chat", label: "Chat", badge: 3 },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  actions={<Button size="sm">New Task</Button>}
/>
```

### AppSidebar

Props: `items` (`{ id, name }[]`), `selectedId`, `onSelect`, `onAdd`, `onDelete`, `sectionLabel`, `children`.

### SplitView

Resizable two-panel layout. Props: `left`, `right`, `defaultLeftSize` (55), `defaultRightSize` (45), `minLeftSize` (30), `minRightSize` (25).

---

## @deck-ui/connections

| Component | What it does |
|-----------|-------------|
| `ConnectionsView` | Full view: service connections + channels section |
| `ChannelConnectionCard` | Channel row with status dot, connect/disconnect/configure/delete |
| `ChannelSetupForm` | Config form for Slack (bot + app token) or Telegram (bot token) |
| `ChannelsSection` | Channel list with "Add Channel" dropdown |

Types: `ChannelType` ("slack" | "telegram"), `ChannelStatus` ("disconnected" | "connecting" | "connected" | "error"), `ChannelConnection` (id, type, name, status, config, lastActiveAt, messageCount, error).

---

## @deck-ui/events

| Component | What it does |
|-----------|-------------|
| `EventFeed` | Filterable event log with type icons and status |
| `EventItem` | Individual event row |
| `EventFilter` | Event type filter |

Types: `EventType` ("message" | "heartbeat" | "cron" | "hook" | "webhook" | "agent_message"), `EventStatus` ("pending" | "processing" | "completed" | "suppressed" | "error").

---

## @deck-ui/routines

| Component | What it does |
|-----------|-------------|
| `RoutinesGrid` | Grid of routine cards sorted by status |
| `RoutineDetailPage` | Detail view with edit form |
| `RoutineRunPage` | Execution view with feed |
| `RunHistory` | Past run list with status, cost, duration |
| `ScheduleBuilder` | Visual cron schedule builder |
| `HeartbeatConfig` | Heartbeat interval picker |

---

## @deck-ui/skills

| Component | What it does |
|-----------|-------------|
| `SkillsGrid` | Grid of installed skills |
| `SkillDetailPage` | Detail view with instructions + learnings |
| `CommunitySkillsSection` | Browse and install from skills.sh |

---

## @deck-ui/review

| Component | What it does |
|-----------|-------------|
| `ReviewSplit` | Split layout: sidebar list + detail panel |
| `ReviewDetail` | Deliverables, output summary, feedback |
| `DeliverableCard` | File deliverable with open/reveal actions |

---

## @deck-ui/workspace

### InstructionsPanel

Editable workspace files with auto-save on blur. Props: `files` (`InstructionFile[]`), `onSave` (`(name, content) => Promise<void>`).

```tsx
import { InstructionsPanel } from "@deck-ui/workspace"

<InstructionsPanel
  files={[{ name: "CLAUDE.md", label: "CLAUDE.md", content: claudeMd }]}
  onSave={async (name, content) => invoke("write_file_bytes", { path: name, content })}
/>
```

### FilesBrowser

File browser with folder grouping, type icons, drag-and-drop. Props: `files` (`FileEntry[]`), `onOpen`, `onReveal`, `onDelete`, `onFilesDropped`, `onCreateFolder`.

Types: `FileEntry` (path, name, extension, size), `InstructionFile` (name, label, content).

---

## Common Patterns

### Thin Wrapper (connecting stores to components)

```tsx
import { KanbanBoard } from "@deck-ui/board"
import { useTaskStore } from "@/stores/tasks"

export function TaskBoard() {
  const tasks = useTaskStore((s) => s.tasks)

  const items = tasks.map((t) => ({
    id: t.id, title: t.title, subtitle: t.description,
    status: t.status, updatedAt: new Date().toISOString(),
  }))

  return <KanbanBoard columns={columns} items={items} onSelect={setSelected} />
}
```

### Channel Messages in Chat

```tsx
<ChatPanel
  sessionKey="main"
  feedItems={feed}
  onSend={send}
  isLoading={loading}
  renderMessageAvatar={(msg) =>
    msg.source ? <ChannelAvatar source={msg.source} /> : undefined
  }
/>
```

### Brand Override

```css
@import "@deck-ui/core/src/globals.css";
@theme {
  --color-primary: #c0392b;
  --color-primary-foreground: #ffffff;
  --color-ring: #c0392b;
}
```

### Tailwind 4 Source Directives

```css
@import "tailwindcss";
@import "@deck-ui/core/src/globals.css";
@source "../node_modules/@deck-ui/core/src";
@source "../node_modules/@deck-ui/chat/src";
@source "../node_modules/@deck-ui/board/src";
@source "../node_modules/@deck-ui/layout/src";
```
