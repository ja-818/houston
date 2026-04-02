import type { PropDef } from "../../components/props-table";
import type { EventEntry } from "@deck-ui/events";

/* -- Sample data --------------------------------------------------------- */

export const SAMPLE_EVENTS: EventEntry[] = [
  {
    id: "1",
    type: "heartbeat",
    source: { channel: "system", identifier: "heartbeat" },
    summary: "Checked inbox -- nothing urgent",
    status: "suppressed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    type: "message",
    source: { channel: "slack", identifier: "#general" },
    summary: "Alice: Can you review the PR?",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    type: "cron",
    source: { channel: "system", identifier: "morning-briefing" },
    summary: "Morning briefing: 3 tasks pending",
    status: "completed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    type: "webhook",
    source: { channel: "webhook", identifier: "github" },
    summary: "New PR opened: feat/auth-refactor",
    status: "processing",
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    type: "agent_message",
    source: { channel: "agent", identifier: "deploy-bot" },
    summary: "Deployment to staging complete",
    status: "completed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    type: "hook",
    source: { channel: "system", identifier: "ci-pipeline" },
    summary: "Build failed: tests timeout on auth module",
    status: "error",
    createdAt: new Date().toISOString(),
  },
];

/* -- Code examples -------------------------------------------------------- */

export const QUICK_START_CODE = `import { useState } from "react"
import { EventFeed } from "@deck-ui/events"
import type { EventEntry, EventType } from "@deck-ui/events"

function MyEventStream({ events }: { events: EventEntry[] }) {
  const [filter, setFilter] = useState<EventType | null>(null)

  return (
    <EventFeed
      events={events}
      filter={filter}
      onFilterChange={setFilter}
      onEventClick={(e) => console.log(e.id)}
      maxHeight="400px"
    />
  )
}`;

export const EVENT_ITEM_CODE = `import { EventItem } from "@deck-ui/events"

<EventItem
  event={event}
  onClick={(e) => openDetail(e.id)}
/>`;

export const EVENT_FILTER_CODE = `import { EventFilter } from "@deck-ui/events"

<EventFilter
  value={currentFilter}
  onChange={setFilter}
  counts={{ message: 3, cron: 1, webhook: 2 }}
/>`;

export const EVENT_EMPTY_CODE = `import { EventEmpty } from "@deck-ui/events"

<EventEmpty message="No events match this filter." />`;

export const TYPES_CODE = `type EventType =
  | "message"
  | "heartbeat"
  | "cron"
  | "hook"
  | "webhook"
  | "agent_message"

type EventStatus =
  | "pending"
  | "processing"
  | "completed"
  | "suppressed"
  | "error"

interface EventSource {
  channel: string   // "slack", "system", "webhook", etc.
  identifier: string // channel ID, cron name, etc.
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
  createdAt: string   // ISO 8601
  processedAt?: string
}`;

/* -- Props definitions ---------------------------------------------------- */

export const EVENT_FEED_PROPS: PropDef[] = [
  { name: "events", type: "EventEntry[]", description: "Array of events to display" },
  { name: "loading", type: "boolean", default: "false", description: "Shows a loading indicator at the bottom" },
  { name: "filter", type: "EventType | null", default: "null", description: "Active type filter -- events not matching are hidden" },
  { name: "onFilterChange", type: "(type: EventType | null) => void", description: "Called when a filter pill is clicked. Omit to hide the filter bar." },
  { name: "onEventClick", type: "(event: EventEntry) => void", description: "Called when an event row is clicked" },
  { name: "maxHeight", type: "string", default: '"100%"', description: "CSS max-height for the scrollable area" },
  { name: "emptyMessage", type: "string", description: "Custom message shown when no events match" },
];

export const EVENT_ITEM_PROPS: PropDef[] = [
  { name: "event", type: "EventEntry", description: "The event data to render" },
  { name: "onClick", type: "(event: EventEntry) => void", description: "Called when the row is clicked" },
];

export const EVENT_FILTER_PROPS: PropDef[] = [
  { name: "value", type: "EventType | null", description: "Currently active filter (null = all)" },
  { name: "onChange", type: "(type: EventType | null) => void", description: "Called when a filter pill is toggled" },
  { name: "counts", type: "Partial<Record<EventType, number>>", description: "Badge counts per event type" },
];

export const EVENT_EMPTY_PROPS: PropDef[] = [
  { name: "message", type: "string", default: '"Heartbeats, cron jobs..."', description: "Custom empty state message" },
];
