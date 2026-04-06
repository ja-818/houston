import { useState, useCallback } from "react"
import type { ReactNode } from "react"
import { SplitView } from "@houston-ai/layout"
import { ChatPanel } from "@houston-ai/chat"
import type { FeedItem } from "@houston-ai/chat"
import { KanbanBoard } from "./kanban-board"
import { KanbanDetailPanel } from "./kanban-detail-panel"
import type { KanbanItem, KanbanColumn } from "./types"

export interface AIBoardProps {
  items: KanbanItem[]
  columns?: KanbanColumn[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onDelete?: (item: KanbanItem) => void
  onApprove?: (item: KanbanItem) => void
  /** Called when user sends a message in the new-conversation panel. Should return the created task ID. */
  onCreateConversation?: (text: string) => Promise<string>
  /** Called when user sends a follow-up message in an existing conversation's detail panel. */
  onSendMessage?: (sessionKey: string, text: string) => Promise<void>
  /** Feed items keyed by session key (e.g. "task-{id}"). */
  feedItems?: Record<string, FeedItem[]>
  /** Whether a message is currently being processed. */
  isLoading?: Record<string, boolean>
  /** Custom empty state when no items exist. */
  emptyState?: ReactNode
  /** Maps a task ID to its session key. Defaults to `task-${id}`. */
  sessionKeyFor?: (taskId: string) => string
  runningStatuses?: string[]
  approveStatuses?: string[]
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: "running", label: "Running", statuses: ["running"] },
  { id: "needs_you", label: "Needs you", statuses: ["needs_you"] },
  { id: "done", label: "Done", statuses: ["done"] },
]

const defaultSessionKey = (id: string) => `task-${id}`

export function AIBoard({
  items,
  columns,
  selectedId: controlledSelectedId,
  onSelect: onSelectProp,
  onDelete,
  onApprove,
  onCreateConversation,
  onSendMessage,
  feedItems = {},
  isLoading = {},
  emptyState,
  sessionKeyFor = defaultSessionKey,
  runningStatuses = ["running"],
  approveStatuses = ["needs_you"],
}: AIBoardProps) {
  // Internal state when uncontrolled
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const [newPanelOpen, setNewPanelOpen] = useState(false)

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId
  const setSelectedId = onSelectProp ?? setInternalSelectedId

  const selectedItem = items.find((i) => i.id === selectedId) ?? null

  // Inject onAdd into the first column for the "+" button
  const resolvedColumns = (columns ?? DEFAULT_COLUMNS).map((col, idx) =>
    idx === 0 && onCreateConversation
      ? { ...col, onAdd: () => setNewPanelOpen(true) }
      : col,
  )

  const handleDelete = useCallback(
    (item: KanbanItem) => {
      onDelete?.(item)
      if (selectedId === item.id) setSelectedId(null)
    },
    [onDelete, selectedId, setSelectedId],
  )

  const board = (
    <div className="flex flex-col h-full">
      <KanbanBoard
        columns={resolvedColumns}
        items={items}
        selectedId={selectedId}
        runningStatuses={runningStatuses}
        approveStatuses={approveStatuses}
        onSelect={(item) => setSelectedId(item.id)}
        onDelete={onDelete ? handleDelete : undefined}
        onApprove={onApprove}
        emptyState={emptyState}
      />
    </div>
  )

  const showNewPanel = newPanelOpen && !selectedItem

  const rightPanel = selectedItem ? (
    <DetailPanel
      item={selectedItem}
      sessionKey={sessionKeyFor(selectedItem.id)}
      feedItems={feedItems[sessionKeyFor(selectedItem.id)] ?? []}
      isLoading={isLoading[sessionKeyFor(selectedItem.id)] ?? false}
      onSendMessage={onSendMessage}
      onClose={() => setSelectedId(null)}
    />
  ) : showNewPanel && onCreateConversation ? (
    <NewConversationPanel
      feedItems={feedItems["new-conversation"] ?? []}
      isLoading={isLoading["new-conversation"] ?? false}
      onSendMessage={onSendMessage}
      onCreateConversation={onCreateConversation}
      onClose={() => setNewPanelOpen(false)}
      onCreated={(taskId) => {
        setNewPanelOpen(false)
        setSelectedId(taskId)
      }}
    />
  ) : null

  return (
    <div className="h-full overflow-hidden">
      {rightPanel ? (
        <SplitView left={board} right={rightPanel} />
      ) : (
        board
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Internal: Detail panel for an existing conversation
// ---------------------------------------------------------------------------

interface DetailPanelProps {
  item: KanbanItem
  sessionKey: string
  feedItems: FeedItem[]
  isLoading: boolean
  onSendMessage?: (sessionKey: string, text: string) => Promise<void>
  onClose: () => void
}

function DetailPanel({
  item,
  sessionKey,
  feedItems,
  isLoading,
  onSendMessage,
  onClose,
}: DetailPanelProps) {
  const handleSend = useCallback(
    async (text: string) => {
      await onSendMessage?.(sessionKey, text)
    },
    [onSendMessage, sessionKey],
  )

  return (
    <KanbanDetailPanel
      title={item.title}
      subtitle={item.subtitle}
      status={item.status}
      onClose={onClose}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        <ChatPanel
          sessionKey={sessionKey}
          feedItems={feedItems}
          isLoading={isLoading}
          onSend={handleSend}
          placeholder="Send a follow-up..."
        />
      </div>
    </KanbanDetailPanel>
  )
}

// ---------------------------------------------------------------------------
// Internal: New conversation panel
// ---------------------------------------------------------------------------

interface NewConversationPanelProps {
  feedItems: FeedItem[]
  isLoading: boolean
  onSendMessage?: (sessionKey: string, text: string) => Promise<void>
  onCreateConversation: (text: string) => Promise<string>
  onClose: () => void
  onCreated: (taskId: string) => void
}

function NewConversationPanel({
  feedItems,
  isLoading,
  onCreateConversation,
  onClose,
  onCreated,
}: NewConversationPanelProps) {
  const handleSend = useCallback(
    async (text: string) => {
      const taskId = await onCreateConversation(text)
      onCreated(taskId)
    },
    [onCreateConversation, onCreated],
  )

  return (
    <KanbanDetailPanel
      title="New conversation"
      subtitle="Describe what you want the agent to do"
      onClose={onClose}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        <ChatPanel
          sessionKey="new-conversation"
          feedItems={feedItems}
          isLoading={isLoading}
          onSend={handleSend}
          placeholder="What should the agent work on?"
        />
      </div>
    </KanbanDetailPanel>
  )
}
