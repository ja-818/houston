import type { PropDef } from "../../components/props-table";
import type { KanbanItem, KanbanColumnConfig } from "@deck-ui/board";

/* ── Sample data ─────────────────────────────────────────────── */

export const SAMPLE_COLUMNS: KanbanColumnConfig[] = [
  { id: "active", label: "Active", statuses: ["running"] },
  { id: "review", label: "Needs Review", statuses: ["needs_you"] },
  { id: "done", label: "Done", statuses: ["done"] },
];

export const SAMPLE_ITEMS: KanbanItem[] = [
  { id: "1", title: "Deploy v2.0", subtitle: "Production deployment", status: "running", updatedAt: new Date().toISOString() },
  { id: "2", title: "Review PR #42", subtitle: "Auth refactor", status: "needs_you", updatedAt: new Date().toISOString() },
  { id: "3", title: "Fix login bug", subtitle: "Users can't reset password", status: "done", updatedAt: new Date().toISOString() },
  { id: "4", title: "Update docs", subtitle: "API reference", status: "running", updatedAt: new Date().toISOString() },
];

/* ── Code examples ───────────────────────────────────────────── */

export const QUICK_START_CODE = `import { useState } from "react"
import { KanbanBoard } from "@deck-ui/board"
import type { KanbanItem, KanbanColumnConfig } from "@deck-ui/board"

const columns: KanbanColumnConfig[] = [
  { id: "active", label: "Active", statuses: ["running"] },
  { id: "review", label: "Review", statuses: ["needs_you"] },
  { id: "done", label: "Done", statuses: ["done"] },
]

function MyBoard({ items }: { items: KanbanItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <KanbanBoard
      columns={columns}
      items={items}
      selectedId={selectedId}
      onSelect={(item) => setSelectedId(item.id)}
      runningStatuses={["running"]}
    />
  )
}`;

export const BOARD_CALLBACKS_CODE = `<KanbanBoard
  columns={columns}
  items={items}
  selectedId={selectedId}
  onSelect={(item) => setSelectedId(item.id)}
  onDelete={(item) => removeItem(item.id)}
  onApprove={(item) => approveItem(item.id)}
  runningStatuses={["running"]}
  approveStatuses={["needs_you"]}
/>`;

export const CUSTOM_CARD_CODE = `<KanbanBoard
  columns={columns}
  items={items}
  onSelect={(item) => setSelectedId(item.id)}
  renderCard={(item) => (
    <div className="p-3 rounded-lg border">
      <span className="font-medium">{item.title}</span>
      <span className="text-xs text-muted-foreground">
        {item.subtitle}
      </span>
    </div>
  )}
/>`;

export const DETAIL_PANEL_CODE = `import { KanbanDetailPanel } from "@deck-ui/board"

<KanbanDetailPanel
  title="Deploy v2.0"
  subtitle="Production deployment"
  status="running"
  onClose={() => setSelectedId(null)}
  runningStatuses={["running"]}
  statusLabels={{
    running: "Running",
    needs_you: "Needs You",
    done: "Done",
  }}
>
  {/* Your detail content — chat panel, logs, etc. */}
  <ChatPanel sessionKey={selectedId} />
</KanbanDetailPanel>`;

export const TYPES_CODE = `interface KanbanItem {
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
  statuses: string[]   // items with matching status appear in this column
}`;

/* ── Props definitions ───────────────────────────────────────── */

export const BOARD_PROPS: PropDef[] = [
  { name: "columns", type: "KanbanColumnConfig[]", description: "Column definitions mapping statuses to visual columns" },
  { name: "items", type: "KanbanItem[]", description: "Items to display across columns" },
  { name: "selectedId", type: "string | null", default: "null", description: "ID of the currently selected item" },
  { name: "onSelect", type: "(item) => void", description: "Called when a card is clicked" },
  { name: "onDelete", type: "(item) => void", description: "Called when delete is confirmed on a card" },
  { name: "onApprove", type: "(item) => void", description: "Called when the approve button is clicked" },
  { name: "emptyState", type: "ReactNode", description: "Shown in place of the board when items is empty" },
  { name: "renderCard", type: "(item) => ReactNode", description: "Custom card renderer — replaces default KanbanCard" },
  { name: "runningStatuses", type: "string[]", default: '["running"]', description: "Statuses that trigger the running glow animation" },
  { name: "approveStatuses", type: "string[]", default: '["needs_you"]', description: "Statuses that show the approve action on cards" },
  { name: "actions", type: "(item) => ReactNode", description: "Custom action buttons rendered on each card" },
  { name: "avatar", type: "ReactNode", description: "Avatar or icon shown on all cards" },
];

export const COLUMN_PROPS: PropDef[] = [
  { name: "label", type: "string", description: "Column header text" },
  { name: "items", type: "KanbanItem[]", description: "Items to render in this column" },
  { name: "onSelect", type: "(item) => void", description: "Called when a card is clicked" },
  { name: "onDelete", type: "(item) => void", description: "Called on delete confirmation" },
  { name: "onApprove", type: "(item) => void", description: "Called on approve" },
  { name: "runningStatuses", type: "string[]", description: "Passed through to KanbanCard" },
  { name: "approveStatuses", type: "string[]", description: "Passed through to KanbanCard" },
  { name: "renderCard", type: "(item) => ReactNode", description: "Custom card renderer" },
  { name: "actions", type: "(item) => ReactNode", description: "Custom action buttons per card" },
  { name: "avatar", type: "ReactNode", description: "Avatar shown on all cards in column" },
];

export const CARD_PROPS: PropDef[] = [
  { name: "item", type: "KanbanItem", description: "The item data to display" },
  { name: "onSelect", type: "() => void", description: "Called when the card is clicked" },
  { name: "onDelete", type: "() => void", description: "Called when delete is confirmed via dialog" },
  { name: "onApprove", type: "() => void", description: "Called when approve is clicked" },
  { name: "runningStatuses", type: "string[]", default: '["running"]', description: "Statuses that trigger the glow animation" },
  { name: "approveStatuses", type: "string[]", default: '["needs_you"]', description: "Statuses that show the approve button" },
  { name: "actions", type: "ReactNode", description: "Custom actions — replaces the default approve button" },
  { name: "avatar", type: "ReactNode", description: "Takes precedence over item.icon" },
];

export const DETAIL_PANEL_PROPS: PropDef[] = [
  { name: "title", type: "string", description: "Primary text in the panel header" },
  { name: "subtitle", type: "string", description: "Secondary text below the title" },
  { name: "status", type: "string", description: "Current status — looked up in statusLabels for display" },
  { name: "onClose", type: "() => void", description: "Called when the back button is clicked" },
  { name: "children", type: "ReactNode", description: "Panel body content" },
  { name: "actions", type: "ReactNode", description: "Action buttons rendered in the header" },
  { name: "runningStatuses", type: "string[]", default: '["running"]', description: "Statuses that show a spinning indicator" },
  { name: "statusLabels", type: "Record<string, string>", default: "built-in map", description: "Maps status values to display labels" },
];
