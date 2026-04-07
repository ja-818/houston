import { useState, useCallback, useRef, useEffect } from "react"
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
  /** Called when user sends the first message in a new conversation. Should return the created task ID. */
  onCreateConversation?: (text: string) => Promise<string>
  /** Called when user sends a follow-up message in an existing conversation. */
  onSendMessage?: (sessionKey: string, text: string) => Promise<void>
  /** Feed items keyed by session key (e.g. "task-{id}"). */
  feedItems?: Record<string, FeedItem[]>
  /** Whether a message is currently being processed, keyed by session key. */
  isLoading?: Record<string, boolean>
  /** Custom empty state when the board has no items. */
  emptyState?: ReactNode
  /** Maps a task ID to its session key. Defaults to `task-${id}`. */
  sessionKeyFor?: (taskId: string) => string
  runningStatuses?: string[]
  approveStatuses?: string[]
  /** Load persisted chat history for a session. Called once per session key when selected. */
  onLoadHistory?: (sessionKey: string) => Promise<FeedItem[]>
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
  onLoadHistory,
}: AIBoardProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const [newPanelOpen, setNewPanelOpen] = useState(false)

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId
  const rawSetSelectedId = onSelectProp ?? setInternalSelectedId

  // -- History hydration: load persisted chat when a conversation is selected --
  const [historyCache, setHistoryCache] = useState<Record<string, FeedItem[]>>({})
  const hydratedKeys = useRef<Set<string>>(new Set())

  const hydrateSession = useCallback(
    (id: string) => {
      if (!onLoadHistory) return
      const sk = sessionKeyFor(id)
      if (hydratedKeys.current.has(sk)) return
      hydratedKeys.current.add(sk)
      onLoadHistory(sk).then((h) => {
        if (h.length > 0) setHistoryCache((prev) => ({ ...prev, [sk]: h }))
      }).catch(console.error)
    },
    [onLoadHistory, sessionKeyFor],
  )

  const setSelectedId = useCallback(
    (id: string | null) => { rawSetSelectedId(id); if (id) hydrateSession(id) },
    [rawSetSelectedId, hydrateSession],
  )

  // Hydrate on mount if there's an initial controlled selection
  useEffect(() => { if (selectedId) hydrateSession(selectedId) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedItem = items.find((i) => i.id === selectedId) ?? null

  const openNewPanel = useCallback(() => {
    setSelectedId(null)
    setNewPanelOpen(true)
  }, [setSelectedId])

  const resolvedColumns = (columns ?? DEFAULT_COLUMNS).map((col, idx) =>
    idx === 0 && onCreateConversation
      ? { ...col, onAdd: openNewPanel }
      : col,
  )

  const handleDelete = useCallback(
    (item: KanbanItem) => {
      onDelete?.(item)
      if (selectedId === item.id) setSelectedId(null)
    },
    [onDelete, selectedId, setSelectedId],
  )

  const handleCardSelect = useCallback(
    (item: KanbanItem) => {
      setNewPanelOpen(false)
      setSelectedId(item.id)
    },
    [setSelectedId],
  )

  // Unified send handler: creates conversation on first message, sends follow-ups after
  const handleSend = useCallback(
    async (text: string) => {
      if (selectedItem && onSendMessage) {
        await onSendMessage(sessionKeyFor(selectedItem.id), text)
      } else if (newPanelOpen && onCreateConversation) {
        const taskId = await onCreateConversation(text)
        setNewPanelOpen(false)
        setSelectedId(taskId)
      }
    },
    [selectedItem, onSendMessage, sessionKeyFor, newPanelOpen, onCreateConversation, setSelectedId],
  )

  // Resolve which session key and feed to show (merge persisted history + live items)
  const activeSessionKey = selectedItem ? sessionKeyFor(selectedItem.id) : null
  const liveFeed = activeSessionKey ? (feedItems[activeSessionKey] ?? []) : []
  const cachedFeed = activeSessionKey ? (historyCache[activeSessionKey] ?? []) : []
  const activeFeed = liveFeed.length > 0 ? liveFeed : cachedFeed
  const activeLoading = activeSessionKey ? (isLoading[activeSessionKey] ?? false) : false

  const showPanel = selectedItem || newPanelOpen
  const panelTitle = selectedItem?.title ?? "New conversation"

  const board = (
    <div className="flex flex-col h-full">
      <KanbanBoard
        columns={resolvedColumns}
        items={items}
        selectedId={selectedId}
        runningStatuses={runningStatuses}
        approveStatuses={approveStatuses}
        onSelect={handleCardSelect}
        onDelete={onDelete ? handleDelete : undefined}
        onApprove={onApprove}
        emptyState={emptyState}
      />
    </div>
  )

  const closePanel = useCallback(() => {
    setNewPanelOpen(false)
    setSelectedId(null)
  }, [setSelectedId])

  const rightPanel = showPanel ? (
    <div className="h-full overflow-hidden flex flex-col">
      <KanbanDetailPanel
        title={panelTitle}
        onClose={closePanel}
      >
        <div className="flex-1 min-h-0 flex flex-col">
          <ChatPanel
            sessionKey={activeSessionKey ?? "new-conversation"}
            feedItems={activeFeed}
            isLoading={activeLoading}
            onSend={handleSend}
            placeholder={selectedItem ? "Send a follow-up..." : "What should the agent work on?"}
          />
        </div>
      </KanbanDetailPanel>
    </div>
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
