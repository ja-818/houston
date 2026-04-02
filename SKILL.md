---
name: deck-ui
description: Deck UI (@deck-ui/*) — React component library for AI agent desktop apps. Teaches your coding agent how to use kanban boards, chat panels, event feeds, memory browsers, channel management, skills, review, and 40+ components with correct props, patterns, and code examples.
---

# Deck UI — Component Skill

> Install with `npx skills add` or drop this file into your project to teach any coding agent how to use Deck UI.

## What This Is

Deck UI (`@deck-ui/*`) is a React component library for building AI agent desktop apps. It provides chat panels, kanban boards, event feeds, memory browsers, routine management, channel integrations, skills, review workflows, and a full design system — all props-driven, no store dependencies.

## Install

```bash
pnpm add @deck-ui/core @deck-ui/board @deck-ui/chat @deck-ui/layout
pnpm add @deck-ui/connections @deck-ui/events @deck-ui/memory @deck-ui/routines
pnpm add @deck-ui/skills @deck-ui/review
```

Apps must import the CSS:
```tsx
import "@deck-ui/core/src/globals.css"
// If using ChatPanel with markdown rendering:
import "streamdown/styles.css"
```

## Key Rules

1. **Props over stores** — Components accept data and callbacks via props. Never import Zustand, Redux, or any state library inside Deck UI components.
2. **Generic types** — Use `KanbanItem`, `FeedItem`, `ChatMessage`, etc. Map your app's domain types at the app level.
3. **No `@/` path aliases** — Use relative imports within packages, package imports (`@deck-ui/core`) between packages.
4. **Tailwind CSS 4** — No config file. All tokens are CSS custom properties in `globals.css`. Uses `@tailwindcss/vite` plugin.
5. **Monochrome design** — Near-black primary (`#0d0d0d`), white background, color only for status indicators. Apps can override `--color-primary` in their CSS.

---

## @deck-ui/core

Design system foundation. shadcn/ui components (New York style, Stone base), utilities, and design tokens.

### Button

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"default" \| "destructive" \| "outline" \| "secondary" \| "ghost" \| "link"` | `"default"` | Visual style |
| size | `"default" \| "xs" \| "sm" \| "lg" \| "icon" \| "icon-xs" \| "icon-sm" \| "icon-lg"` | `"default"` | Size preset |
| asChild | `boolean` | `false` | Render as child element via Radix Slot |

```tsx
import { Button } from "@deck-ui/core"

<Button variant="secondary" size="sm" onClick={handleClick}>
  Save Changes
</Button>
```

### Badge

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"default" \| "secondary" \| "destructive" \| "outline"` | `"default"` | Visual style |

```tsx
import { Badge } from "@deck-ui/core"

<Badge variant="secondary">Active</Badge>
```

### Card

Compound container for grouped content.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@deck-ui/core"

<Card>
  <CardHeader>
    <CardTitle>Project Settings</CardTitle>
    <CardDescription>Configure your project</CardDescription>
  </CardHeader>
  <CardContent>{/* form fields */}</CardContent>
  <CardFooter><Button>Save</Button></CardFooter>
</Card>
```

### Dialog

Modal dialog built on Radix UI.

| Prop (Dialog) | Type | Default | Description |
|------|------|---------|-------------|
| open | `boolean` | — | Controlled open state |
| onOpenChange | `(open: boolean) => void` | — | Called when open state changes |

| Prop (DialogContent) | Type | Default | Description |
|------|------|---------|-------------|
| showCloseButton | `boolean` | `true` | Show X close button |

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@deck-ui/core"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm</DialogTitle>
      <DialogDescription>Are you sure?</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Empty

Empty state placeholder. Compound component.

```tsx
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@deck-ui/core"

<Empty>
  <EmptyHeader>
    <EmptyTitle>No messages</EmptyTitle>
    <EmptyDescription>Your inbox is empty.</EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button>Get started</Button>
  </EmptyContent>
</Empty>
```

### Input

```tsx
import { Input } from "@deck-ui/core"

<Input placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} />
```

### DropdownMenu

```tsx
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@deck-ui/core"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon-sm"><MoreIcon /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
    <DropdownMenuItem variant="destructive" onClick={handleDelete}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### ConfirmDialog

One-shot confirmation dialog.

```tsx
import { ConfirmDialog } from "@deck-ui/core"

<ConfirmDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  title="Delete item?"
  description="This action cannot be undone."
  onConfirm={handleDelete}
/>
```

### Other Core Components

All shadcn/ui components are available: `Accordion`, `Alert`, `AlertDialog`, `Avatar`, `Collapsible`, `Command`, `HoverCard`, `Popover`, `Progress`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Skeleton`, `Spinner`, `Stepper`, `Switch`, `Tabs`, `Textarea`, `Toast`, `ToastContainer`, `Tooltip`.

Import from `@deck-ui/core`. All follow standard shadcn/ui APIs.

### Utilities and Hooks

```tsx
import { cn } from "@deck-ui/core"           // clsx + tailwind-merge
import { useIsMobile } from "@deck-ui/core"   // viewport < 768px hook
import { useKeelEvent } from "@deck-ui/core"  // subscribe to Tauri events (safe in non-Tauri)
```

`useKeelEvent` subscribes to Tauri events with auto-cleanup. Gracefully no-ops in non-Tauri environments:
```tsx
useKeelEvent<FeedItem>("keel-event", (payload) => {
  store.addFeedItem(payload)
})
```

---

## @deck-ui/board

Kanban board with animated cards that glow when AI agents are running.

### KanbanBoard

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | `KanbanColumnConfig[]` | — | Column definitions mapping statuses to visual columns |
| items | `KanbanItem[]` | — | Items to display across columns |
| selectedId | `string \| null` | `null` | ID of currently selected item |
| onSelect | `(item: KanbanItem) => void` | — | Called when a card is clicked |
| onDelete | `(item: KanbanItem) => void` | — | Called when delete is confirmed |
| onApprove | `(item: KanbanItem) => void` | — | Called when approve button is clicked |
| emptyState | `ReactNode` | — | Shown when items is empty |
| renderCard | `(item: KanbanItem) => ReactNode` | — | Custom card renderer |
| runningStatuses | `string[]` | `["running"]` | Statuses that trigger running glow |
| approveStatuses | `string[]` | `["needs_you"]` | Statuses that show approve button |
| actions | `(item: KanbanItem) => ReactNode` | — | Custom action buttons per card |
| avatar | `ReactNode` | — | Avatar shown on all cards |

```tsx
import { KanbanBoard } from "@deck-ui/board"
import type { KanbanItem, KanbanColumnConfig } from "@deck-ui/board"

const columns: KanbanColumnConfig[] = [
  { id: "active", label: "Active", statuses: ["running"] },
  { id: "review", label: "Review", statuses: ["needs_you"] },
  { id: "done", label: "Done", statuses: ["done"] },
]

<KanbanBoard
  columns={columns}
  items={items}
  selectedId={selectedId}
  onSelect={(item) => setSelectedId(item.id)}
  onApprove={(item) => approveItem(item.id)}
  runningStatuses={["running"]}
  approveStatuses={["needs_you"]}
/>
```

### KanbanDetailPanel

Side panel for displaying selected item details.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | `string` | — | Primary text in header |
| subtitle | `string` | — | Secondary text |
| status | `string` | — | Looked up in statusLabels |
| onClose | `() => void` | — | Back button callback |
| children | `ReactNode` | — | Panel body content |
| actions | `ReactNode` | — | Header action buttons |
| runningStatuses | `string[]` | `["running"]` | Statuses that show spinner |
| statusLabels | `Record<string, string>` | built-in map | Maps status to display text |

```tsx
import { KanbanDetailPanel } from "@deck-ui/board"

<KanbanDetailPanel
  title="Deploy v2.0"
  subtitle="Production deployment"
  status="running"
  onClose={() => setSelectedId(null)}
>
  <ChatPanel sessionKey={selectedId} ... />
</KanbanDetailPanel>
```

### Board Types

```typescript
interface KanbanItem {
  id: string
  title: string
  subtitle?: string
  status: string
  updatedAt: string
  icon?: React.ReactNode
  metadata?: Record<string, unknown>
}

interface KanbanColumnConfig {
  id: string
  label: string
  statuses: string[]
}
```

---

## @deck-ui/chat

Chat experience for AI agent sessions. Renders messages, tool calls, thinking blocks, streaming markdown, and input.

### ChatPanel

Top-level entry point. Pass FeedItems and callbacks.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| sessionKey | `string` | — | Unique key for the session |
| feedItems | `FeedItem[]` | — | Flat array of feed events |
| onSend | `(text: string) => void` | — | Called when user sends a message |
| onStop | `() => void` | — | Called when user clicks stop |
| onBack | `() => void` | — | Shows back button if provided |
| isLoading | `boolean` | — | Whether the session is loading |
| placeholder | `string` | `"Type a message..."` | Input placeholder |
| emptyState | `ReactNode` | — | Shown when no messages |
| status | `"ready" \| "streaming" \| "submitted"` | auto-derived | Override status |
| loadingIndicator | `ReactNode` | Shimmer "Thinking..." | Custom loading indicator |
| renderMessageAvatar | `(msg: ChatMessage) => ReactNode` | — | Custom avatar per message |
| renderActions | `(item: FeedItem) => ReactNode` | — | Custom action buttons per item |
| toolLabels | `Record<string, string>` | — | Custom labels for tool names |
| isSpecialTool | `(name: string) => boolean` | — | Mark tools for special rendering |
| renderToolResult | `(tool: ToolCall) => ReactNode` | — | Custom tool result renderer |

```tsx
import { ChatPanel } from "@deck-ui/chat"
import type { FeedItem } from "@deck-ui/chat"

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

### ChannelAvatar

Circular branded badge for messaging channel sources. Shows platform logo.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| source | `"telegram" \| "slack" \| "desktop" \| string` | — | Channel source identifier |
| size | `"sm" \| "md"` | `"sm"` | Badge size (sm=24px, md=32px) |
| className | `string` | — | Additional CSS classes |

```tsx
import { ChannelAvatar } from "@deck-ui/chat"

<ChannelAvatar source="telegram" size="sm" />
// Blue circle with Telegram paper plane icon

<ChannelAvatar source="slack" size="md" />
// Purple circle with Slack multicolor logo
```

### ChatInput

Standalone input bar with send/stop states.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onSend | `(text: string) => void` | — | Called on submit |
| onStop | `() => void` | — | Called when stop clicked |
| status | `"ready" \| "streaming" \| "submitted"` | — | Controls send/stop button |
| placeholder | `string` | — | Input placeholder |

### ToolActivity

Collapsing tool call list with spinners and elapsed time.

```tsx
import { ToolActivity } from "@deck-ui/chat"

<ToolActivity
  tools={[
    { name: "Read", input: { path: "src/index.ts" } },
    { name: "Bash", input: { command: "npm test" }, result: { content: "OK", is_error: false } },
  ]}
  isStreaming={true}
  toolLabels={{ custom_tool: "Running custom tool" }}
/>
```

### Feed Utilities

```tsx
import { feedItemsToMessages, mergeFeedItem } from "@deck-ui/chat"

// Convert flat FeedItem[] to grouped ChatMessage[]
// Auto-extracts [ChannelName] prefix into ChatMessage.source
const messages = feedItemsToMessages(feedItems)

// Smart-merge a streaming FeedItem into an existing array
// thinking_streaming replaces previous thinking_streaming
// assistant_text_streaming replaces previous assistant_text_streaming
// Final variants replace their streaming predecessors
const updated = mergeFeedItem(existingItems, newItem)
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

## @deck-ui/layout

App shell components: sidebar, tabs, split view.

### AppSidebar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| logo | `ReactNode` | — | Logo/header content |
| items | `{ id: string; name: string }[]` | — | Navigation items |
| selectedId | `string \| null` | — | Active item ID |
| onSelect | `(id: string) => void` | — | Called when item clicked |
| onAdd | `() => void` | — | Shows add button if provided |
| onDelete | `(id: string) => void` | — | Shows delete on items if provided |
| sectionLabel | `string` | — | Label above item list |
| children | `ReactNode` | — | Additional sidebar content |

```tsx
import { AppSidebar } from "@deck-ui/layout"

<AppSidebar
  items={projects}
  selectedId={activeProject}
  onSelect={(id) => setActiveProject(id)}
  onAdd={() => createProject()}
  onDelete={(id) => deleteProject(id)}
/>
```

### TabBar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tabs | `Tab[]` | — | Tab definitions `{ id, label, badge? }` |
| activeTab | `string` | — | Active tab ID |
| onTabChange | `(id: string) => void` | — | Called when tab clicked |
| actions | `ReactNode` | — | Right-side action buttons |
| menu | `ReactNode` | — | Settings dropdown |

```tsx
import { TabBar } from "@deck-ui/layout"

<TabBar
  tabs={[
    { id: "board", label: "Board" },
    { id: "chat", label: "Chat", badge: 3 },
    { id: "events", label: "Events" },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  actions={<Button size="sm">New Task</Button>}
/>
```

### SplitView

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| left | `ReactNode` | — | Left panel content |
| right | `ReactNode` | — | Right panel content |
| defaultLeftSize | `number` | `55` | Left panel default % |
| defaultRightSize | `number` | `45` | Right panel default % |
| minLeftSize | `number` | `30` | Minimum left panel % |
| minRightSize | `number` | `25` | Minimum right panel % |

```tsx
import { SplitView } from "@deck-ui/layout"

<SplitView
  left={<KanbanBoard ... />}
  right={<ChatPanel ... />}
  defaultLeftSize={55}
/>
```

---

## @deck-ui/connections

Integration and channel connection management.

### ConnectionsView

Full-page view for connected apps and channels. Handles five states: loading, not_configured, needs_auth, error, and ok.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| result | `ConnectionsResult \| null` | — | Connection status and data |
| loading | `boolean` | — | Show loading state |
| onRetry | `() => void` | — | Retry failed connection check |
| onManage | `() => void` | — | Open connection management (e.g., Composio dashboard) |
| channels | `ChannelConnection[]` | — | Optional channel connections to show below apps |
| onChannelConnect | `(channel: ChannelConnection) => void` | — | Connect a channel |
| onChannelDisconnect | `(channel: ChannelConnection) => void` | — | Disconnect a channel |
| onChannelConfigure | `(channel: ChannelConnection) => void` | — | Configure a channel |
| onChannelDelete | `(channel: ChannelConnection) => void` | — | Delete a channel |
| onAddChannel | `(type: ChannelType) => void` | — | Add a new channel |

```tsx
import { ConnectionsView } from "@deck-ui/connections"
import type { ConnectionsResult, ChannelConnection } from "@deck-ui/connections"

<ConnectionsView
  result={{ status: "ok", connections: myConnections }}
  loading={false}
  onRetry={() => refetch()}
  onManage={() => openComposio()}
  channels={channels}
  onChannelConnect={(ch) => connectChannel(ch.id)}
  onChannelDisconnect={(ch) => disconnectChannel(ch.id)}
  onAddChannel={(type) => openSetupForm(type)}
/>
```

### ChannelConnectionCard

Individual channel card with status dot, message count, last active date, and action buttons.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| connection | `ChannelConnection` | — | Channel data |
| onConnect | `(connection: ChannelConnection) => void` | — | Connect callback |
| onDisconnect | `(connection: ChannelConnection) => void` | — | Disconnect callback |
| onConfigure | `(connection: ChannelConnection) => void` | — | Configure callback |
| onDelete | `(connection: ChannelConnection) => void` | — | Delete callback |

```tsx
import { ChannelConnectionCard } from "@deck-ui/connections"

<ChannelConnectionCard
  connection={channel}
  onConnect={(ch) => connectChannel(ch.id)}
  onDisconnect={(ch) => disconnectChannel(ch.id)}
  onDelete={(ch) => deleteChannel(ch.id)}
/>
```

### ChannelsSection

Container listing channels with header, "Add Channel" dropdown, and empty state.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| channels | `ChannelConnection[]` | — | Channel connections to display |
| onConnect | `(channel: ChannelConnection) => void` | — | Connect callback |
| onDisconnect | `(channel: ChannelConnection) => void` | — | Disconnect callback |
| onConfigure | `(channel: ChannelConnection) => void` | — | Configure callback |
| onDelete | `(channel: ChannelConnection) => void` | — | Delete callback |
| onAddChannel | `(type: ChannelType) => void` | — | Add channel callback (shows dropdown if provided) |

```tsx
import { ChannelsSection } from "@deck-ui/connections"

<ChannelsSection
  channels={channels}
  onConnect={(ch) => connect(ch.id)}
  onDisconnect={(ch) => disconnect(ch.id)}
  onDelete={(ch) => remove(ch.id)}
  onAddChannel={(type) => openSetup(type)}
/>
```

### ChannelSetupForm

Configuration form for Slack or Telegram channel setup.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | `"slack" \| "telegram"` | — | Channel type (determines fields) |
| onSubmit | `(config: Record<string, string>) => void` | — | Called with form config on submit |
| onCancel | `() => void` | — | Cancel callback (button hidden if omitted) |
| loading | `boolean` | `false` | Disables submit, shows spinner |
| error | `string \| null` | `null` | Error message shown above buttons |

```tsx
import { ChannelSetupForm } from "@deck-ui/connections"

<ChannelSetupForm
  type="telegram"
  onSubmit={(config) => saveChannel(config)}
  onCancel={() => closeForm()}
  loading={isSaving}
  error={saveError}
/>
```

### ConnectionRow

Single connected app row with logo and connected badge.

```tsx
import { ConnectionRow } from "@deck-ui/connections"

<ConnectionRow connection={{ toolkit: "gmail", display_name: "Gmail", ... }} />
```

### Connection Types

```typescript
type ChannelType = "slack" | "telegram"
type ChannelStatus = "disconnected" | "connecting" | "connected" | "error"

interface ChannelConnection {
  id: string
  type: ChannelType
  name: string
  status: ChannelStatus
  config: Record<string, string>
  lastActiveAt: string | null
  messageCount: number
  error?: string
}

type ConnectionsResult =
  | { status: "not_configured" }
  | { status: "needs_auth" }
  | { status: "error"; message: string }
  | { status: "ok"; connections: Connection[] }

interface Connection {
  toolkit: string
  display_name: string
  description: string
  email: string | null
  logo_url: string
  connected_at: string | null
}

const CHANNEL_LABELS: Record<ChannelType, string>
```

---

## @deck-ui/events

Event feed and timeline for agent activity.

### EventFeed

Filterable event log with type indicators, status dots, and animated transitions.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| events | `EventEntry[]` | — | Events to display |
| loading | `boolean` | `false` | Show loading state |
| filter | `EventType \| null` | `null` | Active type filter (null = all) |
| onFilterChange | `(type: EventType \| null) => void` | — | Filter change callback |
| onEventClick | `(event: EventEntry) => void` | — | Event click callback |
| maxHeight | `string` | — | Max height CSS value |
| emptyMessage | `string` | — | Custom empty state message |

```tsx
import { EventFeed } from "@deck-ui/events"
import type { EventEntry, EventType } from "@deck-ui/events"

<EventFeed
  events={events}
  filter={activeFilter}
  onFilterChange={setActiveFilter}
  onEventClick={(event) => openDetail(event)}
  emptyMessage="Events will appear here as they happen."
/>
```

### Event Types

```typescript
type EventType = "message" | "heartbeat" | "cron" | "hook" | "webhook" | "agent_message"
type EventStatus = "pending" | "processing" | "completed" | "suppressed" | "error"

interface EventSource {
  channel: string      // "slack", "telegram", "desktop", "system", "webhook", "agent"
  identifier: string
}

interface EventEntry {
  id: string
  type: EventType
  source: EventSource
  summary: string
  status: EventStatus
  payload?: Record<string, unknown>
  sessionKey?: string
  projectId?: string
  createdAt: string
  processedAt?: string
}
```

---

## @deck-ui/memory

Memory/knowledge base browser for agent memory.

### MemoryBrowser

Full memory browser with search, category filter, and card grid.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| memories | `Memory[]` | — | Memory items |
| loading | `boolean` | `false` | Show loading state |
| onSearch | `(query: string) => void` | — | Search callback |
| onCategoryFilter | `(category: MemoryCategory \| null) => void` | — | Category filter callback |
| onMemoryClick | `(memory: Memory) => void` | — | Memory click callback |
| onMemoryDelete | `(memory: Memory) => void` | — | Delete callback |
| onMemoryCreate | `() => void` | — | Shows create button |
| selectedCategory | `MemoryCategory \| null` | — | Active category filter |
| searchQuery | `string` | — | Current search query |
| emptyMessage | `string` | — | Custom empty state message |

```tsx
import { MemoryBrowser } from "@deck-ui/memory"
import type { Memory, MemoryCategory } from "@deck-ui/memory"

<MemoryBrowser
  memories={memories}
  loading={isLoading}
  onSearch={(query) => searchMemories(query)}
  onCategoryFilter={(cat) => setCategory(cat)}
  onMemoryClick={(m) => openDetail(m)}
  onMemoryDelete={(m) => deleteMemory(m.id)}
  emptyMessage="Memories will appear as your agent learns."
/>
```

### Memory Types

```typescript
type MemoryCategory = "conversation" | "preference" | "context" | "skill" | "fact"

interface Memory {
  id: string
  projectId: string
  content: string
  category: MemoryCategory
  source: string
  tags: string[]
  createdAt: string
  updatedAt: string
}
```

---

## @deck-ui/routines

Routine management — grids, scheduling, heartbeat configuration, run history, and editing.

### RoutinesGrid

Grid of routine cards sorted by status (active first, then needs_setup, error, paused).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| routines | `Routine[]` | — | Routines to display |
| loading | `boolean` | `false` | Show loading state |
| onSelectRoutine | `(routineId: string) => void` | — | Card click callback |

```tsx
import { RoutinesGrid } from "@deck-ui/routines"

<RoutinesGrid
  routines={routines}
  onSelectRoutine={(id) => openRoutine(id)}
/>
```

### RoutineEditForm

Form for creating or editing a routine.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| initial | `RoutineFormState` | — | Initial form values |
| skills | `Skill[]` | — | Available skills for linking |
| onSave | `(state: RoutineFormState) => void` | — | Save callback |
| onCancel | `() => void` | — | Cancel callback |

### RoutineDetailActions

Action buttons for a routine detail page (run, edit, delete, pause/resume).

### RunHistory

List of past routine runs with status, cost, and duration.

### HeartbeatConfigPanel

Configure agent heartbeat check-ins.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| config | `HeartbeatConfig` | — | Current configuration |
| onChange | `(config: HeartbeatConfig) => void` | — | Config change callback |

```tsx
import { HeartbeatConfigPanel } from "@deck-ui/routines"

<HeartbeatConfigPanel config={heartbeat} onChange={setHeartbeat} />
```

### ScheduleBuilder

Visual cron schedule builder with preset buttons.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | — | Cron expression |
| onChange | `(cron: string) => void` | — | Cron change callback |
| presets | `SchedulePreset[]` | built-in | Schedule presets to show |

```tsx
import { ScheduleBuilder } from "@deck-ui/routines"

<ScheduleBuilder value={cron} onChange={setCron} />
```

### Routine Types

```typescript
type TriggerType = "on_approval" | "scheduled" | "periodic" | "manual"
type RoutineStatus = "active" | "paused" | "needs_setup" | "error"
type ApprovalMode = "manual" | "auto_approve"
type RunStatus = "running" | "completed" | "failed" | "approved" | "needs_you" | "done" | "error"

interface Routine {
  id: string
  project_id: string
  goal_id: string | null
  skill_id: string | null
  name: string
  description: string
  trigger_type: TriggerType
  trigger_config: string
  status: RoutineStatus
  approval_mode: ApprovalMode
  context: string
  run_count: number
  last_run_at: string | null
  created_at: string
  updated_at: string
}

interface HeartbeatConfig {
  enabled: boolean
  intervalMinutes: number
  prompt: string
  activeHoursStart?: string
  activeHoursEnd?: string
  suppressionToken: string
}

type SchedulePreset = "every_30min" | "hourly" | "daily" | "weekdays" | "weekly" | "monthly" | "custom"
```

---

## @deck-ui/skills

Skill management grid with community marketplace.

### SkillsGrid

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| skills | `Skill[]` | — | Skills to display |
| loading | `boolean` | — | Show loading state |
| onSkillClick | `(skill: Skill) => void` | — | Skill click callback |
| community | `{ onSearch, onInstall }` | — | Community marketplace callbacks (omit to hide) |

```tsx
import { SkillsGrid } from "@deck-ui/skills"

<SkillsGrid
  skills={skills}
  loading={isLoading}
  onSkillClick={(skill) => openSkill(skill)}
  community={{
    onSearch: (query) => searchCommunity(query),
    onInstall: (skill) => installSkill(skill),
  }}
/>
```

### SkillDetailPage

Full detail view for a skill showing instructions and learnings.

### CommunitySkillsSection

Browsable community marketplace section with search.

### Skill Types

```typescript
interface Skill {
  id: string
  name: string
  description: string
  instructions: string
  learnings: string
  file_path: string
}

interface CommunitySkill {
  id: string
  skillId: string
  name: string
  installs: number
  source: string
}

type LearningCategory = "pattern" | "pitfall" | "preference" | "procedure"

interface SkillLearning {
  id: string
  skill_id: string
  project_id: string
  content: string
  rationale: string
  category: LearningCategory
  source_issue_id: string | null
  source_issue_title: string | null
  created_at: string
}
```

---

## @deck-ui/review

Review workflow for approving agent work output.

### ReviewSplit

Split-view layout with item sidebar and detail panel.

### ReviewSidebar

Scrollable list of review items with status indicators.

### ReviewDetailPanel

Detail panel showing deliverables and feedback form.

### ReviewItem

Single review item row.

### ReviewEmpty

Empty state for review queue.

### DeliverableCard

Card displaying an agent work output (file, content, etc.).

### UserFeedback

Feedback input form for approving/rejecting work.

### Review Types

```typescript
type RunStatus = "running" | "completed" | "failed" | "approved" | "needs_you" | "done" | "error"

interface ReviewItemData {
  id: string
  title: string
  subtitle: string
  status: RunStatus
  createdAt: string
  sessionId: string | null
  routineId: string | null
}
```

---

## Common Patterns

### App Shell

```tsx
import { AppSidebar } from "@deck-ui/layout"
import { TabBar } from "@deck-ui/layout"
import { SplitView } from "@deck-ui/layout"
import { KanbanBoard } from "@deck-ui/board"
import { ChatPanel } from "@deck-ui/chat"

function App() {
  return (
    <div className="flex h-screen">
      <AppSidebar items={projects} selectedId={activeId} onSelect={setActiveId} />
      <div className="flex-1 flex flex-col">
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <SplitView
          left={<KanbanBoard columns={columns} items={items} onSelect={setSelected} />}
          right={<ChatPanel sessionKey={selectedId} feedItems={feed} onSend={send} isLoading={loading} />}
        />
      </div>
    </div>
  )
}
```

### Connecting Stores to Components (Thin Wrapper Pattern)

Components are props-driven. Connect your state at the app level:

```tsx
// Your app's wrapper reads from Zustand and passes props to @deck-ui
import { KanbanBoard } from "@deck-ui/board"
import { useIssueStore } from "@/stores/issues"

export function ActivityBoard() {
  const issues = useIssueStore((s) => s.issues)

  const kanbanItems = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    subtitle: issue.description,
    status: issue.status,
    updatedAt: issue.updated_at,
  }))

  return <KanbanBoard columns={columns} items={kanbanItems} ... />
}
```

### Channel Messages in Chat

Incoming channel messages are prefixed with `[ChannelName]` before sending to the agent. `feedItemsToMessages()` auto-extracts this into `ChatMessage.source` for avatar rendering:

```tsx
import { ChatPanel, ChannelAvatar } from "@deck-ui/chat"

<ChatPanel
  sessionKey="main"
  feedItems={feed}
  onSend={send}
  isLoading={loading}
  renderMessageAvatar={(msg) =>
    msg.source ? <ChannelAvatar source={msg.source} size="sm" /> : undefined
  }
/>
```

### Feed Merging in Stores

Use the pure `mergeFeedItem()` function in your Zustand store to handle streaming replacement:

```tsx
import { mergeFeedItem } from "@deck-ui/chat"

// In Zustand store:
addFeedItem: (item) => set((s) => ({
  items: mergeFeedItem(s.items, item),
}))
```

### CSS Setup

```tsx
// main.tsx or App.tsx
import "@deck-ui/core/src/globals.css"
import "streamdown/styles.css"  // if using ChatPanel
```

### Brand Override

Override the primary color for your app:

```css
@import "@deck-ui/core/src/globals.css";

@theme {
  --color-primary: #c0392b;           /* your brand color */
  --color-primary-foreground: #ffffff;
  --color-ring: #c0392b;
}
```

### Tailwind 4 Configuration

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

In your CSS, add `@source` directives for Deck UI packages:

```css
@import "tailwindcss";
@import "@deck-ui/core/src/globals.css";

@source "../node_modules/@deck-ui/core/src";
@source "../node_modules/@deck-ui/board/src";
@source "../node_modules/@deck-ui/chat/src";
@source "../node_modules/@deck-ui/layout/src";
```
