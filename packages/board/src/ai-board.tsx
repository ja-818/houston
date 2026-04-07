import { useState, useCallback, useRef, useEffect } from "react"
import type { ReactNode } from "react"

import { ChatPanel } from "@houston-ai/chat"
import type { FeedItem } from "@houston-ai/chat"
import { KanbanBoard } from "./kanban-board"
import { KanbanDetailPanel } from "./kanban-detail-panel"
import type { KanbanItem, KanbanColumn } from "./types"

function ResizablePanel({
  defaultWidth = 45,
  minWidth = 380,
  children,
}: {
  defaultWidth?: number
  minWidth?: number
  children: ReactNode
}) {
  const [width, setWidth] = useState<number | null>(null)
  const dragging = useRef(false)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      dragging.current = true
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= minWidth) setWidth(newWidth)
    },
    [minWidth],
  )

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const style = width
    ? { width: `${width}px` }
    : { width: `${defaultWidth}%`, minWidth: `${minWidth}px` }

  return (
    <div
      className="fixed top-0 right-0 bottom-0 z-50 bg-background border-l border-border flex flex-col"
      style={style}
    >
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/10 active:bg-primary/20 transition-colors z-10"
      />
      {children}
    </div>
  )
}

export interface AIBoardProps {
  items: KanbanItem[]
  columns?: KanbanColumn[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onDelete?: (item: KanbanItem) => void
  onApprove?: (item: KanbanItem) => void
  /** Called when user sends the first message in a new conversation. Should return the created activity ID. */
  onCreateConversation?: (text: string) => Promise<string>
  /** Called when user sends a follow-up message in an existing conversation. */
  onSendMessage?: (sessionKey: string, text: string) => Promise<void>
  /** Feed items keyed by session key (e.g. "activity-{id}"). */
  feedItems?: Record<string, FeedItem[]>
  /** Whether a message is currently being processed, keyed by session key. */
  isLoading?: Record<string, boolean>
  /** Custom empty state when the board has no items. */
  emptyState?: ReactNode
  /** Maps an activity ID to its session key. Defaults to `activity-${id}`. */
  sessionKeyFor?: (activityId: string) => string
  runningStatuses?: string[]
  approveStatuses?: string[]
  /** Load persisted chat history for a session. Called once per session key when selected. */
  onLoadHistory?: (sessionKey: string) => Promise<FeedItem[]>
  /** Called with the openNewPanel function so the parent can trigger it externally (e.g. from a header button). */
  onNewPanelOpenerReady?: (opener: () => void) => void
  /** Custom thinking indicator for the chat panel. */
  thinkingIndicator?: ReactNode
  /** Avatar element shown in the detail panel header. */
  panelAvatar?: ReactNode
  /** Name shown next to the avatar in the panel header (e.g. "Houston"). */
  panelAgentName?: string
  /** Called when the detail panel opens or closes. */
  onPanelOpenChange?: (open: boolean) => void
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: "running", label: "Running", statuses: ["running"] },
  { id: "needs_you", label: "Needs you", statuses: ["needs_you"] },
  { id: "done", label: "Done", statuses: ["done"] },
]

const defaultSessionKey = (id: string) => `activity-${id}`

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
  onNewPanelOpenerReady,
  thinkingIndicator,
  panelAvatar,
  panelAgentName,
  onPanelOpenChange,
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

  // Expose openNewPanel to parent
  useEffect(() => {
    onNewPanelOpenerReady?.(openNewPanel)
  }, [onNewPanelOpenerReady, openNewPanel])

  const resolvedColumns = columns ?? DEFAULT_COLUMNS

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
        const activityId = await onCreateConversation(text)
        setNewPanelOpen(false)
        setSelectedId(activityId)
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

  // Notify parent when panel opens/closes
  useEffect(() => {
    onPanelOpenChange?.(!!showPanel)
  }, [!!showPanel, onPanelOpenChange]) // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div className="h-full overflow-hidden">
      {board}
      {showPanel && (
        <ResizablePanel defaultWidth={45} minWidth={380}>
          <KanbanDetailPanel
            title={panelTitle}
            onClose={closePanel}
            avatar={panelAvatar}
            agentName={panelAgentName ?? selectedItem?.group}
          >
            <div className="flex-1 min-h-0 flex flex-col">
              <ChatPanel
                sessionKey={activeSessionKey ?? "new-conversation"}
                feedItems={activeFeed}
                isLoading={activeLoading}
                onSend={handleSend}
                placeholder={selectedItem ? "Send a follow-up..." : "What should the agent work on?"}
                thinkingIndicator={thinkingIndicator}
              />
            </div>
          </KanbanDetailPanel>
        </ResizablePanel>
      )}
    </div>
  )
}
