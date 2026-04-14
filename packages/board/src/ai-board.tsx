import { useState, useCallback, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import type { ReactNode } from "react"

import { ChatPanel } from "@houston-ai/chat"
import type { FeedItem, ToolsAndCardsProps } from "@houston-ai/chat"
import { SplitView } from "@houston-ai/layout"
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
  /** Called when user sends the first message in a new conversation. Should return the created activity ID. */
  onCreateConversation?: (text: string, files: File[]) => Promise<string>
  /** Called when user sends a follow-up message in an existing conversation. */
  onSendMessage?: (sessionKey: string, text: string, files: File[]) => Promise<void>
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
  /** Custom empty state for the chat panel when no messages exist. */
  chatEmptyState?: ReactNode
  /** Custom thinking indicator for the chat panel. */
  thinkingIndicator?: ReactNode
  /** Avatar element shown on every kanban card (e.g. small agent icon). */
  cardAvatar?: ReactNode
  /** Avatar element shown in the detail panel header. */
  panelAvatar?: ReactNode
  /** Name shown next to the avatar in the panel header (e.g. "Houston"). */
  panelAgentName?: string
  /** Called when the detail panel opens or closes. */
  onPanelOpenChange?: (open: boolean) => void
  /** Called when the user clicks Stop in the chat panel. Receives the active session key. */
  onStopSession?: (sessionKey: string) => void
  /** Predicate to identify tools that should use custom rendering. */
  isSpecialTool?: ToolsAndCardsProps["isSpecialTool"]
  /** Custom renderer for special tool results. */
  renderToolResult?: ToolsAndCardsProps["renderToolResult"]
  /** Custom tool name → human label mappings. */
  toolLabels?: ToolsAndCardsProps["toolLabels"]
  /** Render prop for an end-of-turn summary (e.g., list of edited files). Forwarded to ChatPanel. */
  renderTurnSummary?: import("@houston-ai/chat").ChatPanelProps["renderTurnSummary"]
  /** Emitted by ChatPanel to surface short notices to the user
   *  (e.g. duplicate-file drop). Forwarded as-is; app decides display. */
  onNotice?: (message: string) => void
  /** Called when the user clicks the open button on an inline link. Forwarded to ChatPanel. */
  onOpenLink?: import("@houston-ai/chat").ChatPanelProps["onOpenLink"]
  /** Custom renderer for markdown links. Forwarded to ChatPanel. */
  renderLink?: import("@houston-ai/chat").ChatPanelProps["renderLink"]
  /**
   * Composer footer content. When a function, called with `{ hasMessages }` so
   * the consumer can lock the provider for active conversations.
   */
  footer?: ReactNode | ((ctx: { hasMessages: boolean }) => ReactNode)
  /** Called when the user renames a card. */
  onRename?: (item: KanbanItem, newTitle: string) => void
  /** Render prop for extra action buttons on each card (e.g. "Run" button). */
  actions?: (item: KanbanItem) => React.ReactNode
  /** Render prop for action buttons in the detail panel header (e.g. worktree info, run button). */
  panelActions?: (item: KanbanItem) => React.ReactNode
  /**
   * DOM element to portal the detail panel into. When provided, the panel
   * renders via createPortal into this element (for app-level layout).
   * When not provided, falls back to SplitView within AIBoard.
   */
  panelContainer?: HTMLElement | null
  /**
   * Draft text keyed by session key. Used to persist composer text across
   * navigation so users don't lose what they've typed. The key
   * "new-conversation" is used for the new-mission panel.
   */
  drafts?: Record<string, string>
  /** Called when the user types in the panel's chat input. */
  onDraftChange?: (sessionKey: string, text: string) => void
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
  chatEmptyState,
  thinkingIndicator,
  cardAvatar,
  panelAvatar,
  panelAgentName,
  onPanelOpenChange,
  onStopSession,
  onRename,
  actions,
  panelActions,
  panelContainer,
  drafts,
  onDraftChange,
  isSpecialTool,
  renderToolResult,
  toolLabels,
  renderTurnSummary,
  onNotice,
  onOpenLink,
  renderLink,
  footer,
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

  // Resolve which session key and feed to show (merge persisted history + live items)
  const activeSessionKey = selectedItem ? sessionKeyFor(selectedItem.id) : null
  // The session key currently visible in the detail panel's ChatPanel.
  const activeDraftKey = activeSessionKey ?? "new-conversation"

  // Unified send handler: creates conversation on first message, sends follow-ups after
  const handleSend = useCallback(
    async (text: string, files: File[]) => {
      // Clear draft immediately so the user sees the send
      onDraftChange?.(activeDraftKey, "")
      if (selectedItem && onSendMessage) {
        await onSendMessage(sessionKeyFor(selectedItem.id), text, files)
      } else if (newPanelOpen && onCreateConversation) {
        const activityId = await onCreateConversation(text, files)
        setNewPanelOpen(false)
        setSelectedId(activityId)
      }
    },
    [selectedItem, onSendMessage, sessionKeyFor, newPanelOpen, onCreateConversation, setSelectedId, onDraftChange, activeDraftKey],
  )
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

  // Ensure parent resets its "panel open" state when AIBoard unmounts
  // (e.g. tab switch). Without this, portal containers in the app layout
  // would remain visible but empty.
  useEffect(() => {
    return () => {
      onPanelOpenChange?.(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const closePanel = useCallback(() => {
    setNewPanelOpen(false)
    setSelectedId(null)
  }, [setSelectedId])

  // Refs for outside-click detection.
  const boardRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Close the panel when the user clicks anywhere outside the board or the
  // detail panel (sidebar, tab bar, other app chrome, etc.).
  useEffect(() => {
    if (!showPanel) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (boardRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      // Radix portals (dropdowns, popovers) render outside the panel DOM.
      // Don't close the panel when interacting with them.
      if (target instanceof Element && target.closest("[data-radix-popper-content-wrapper]")) return
      closePanel()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showPanel, closePanel])

  const board = (
    <div ref={boardRef} className="flex flex-col h-full">
      <KanbanBoard
        columns={resolvedColumns}
        items={items}
        selectedId={selectedId}
        runningStatuses={runningStatuses}
        approveStatuses={approveStatuses}
        onSelect={handleCardSelect}
        onDelete={onDelete ? handleDelete : undefined}
        onApprove={onApprove}
        onRename={onRename}
        emptyState={emptyState}
        actions={actions}
        avatar={cardAvatar}
      />
    </div>
  )

  const detailPanel = (
    <KanbanDetailPanel
      ref={panelRef}
      title={panelTitle}
      onClose={closePanel}
      avatar={panelAvatar}
      agentName={panelAgentName ?? selectedItem?.group}
      actions={selectedItem ? panelActions?.(selectedItem) : undefined}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        <ChatPanel
          sessionKey={activeSessionKey ?? "new-conversation"}
          feedItems={activeFeed}
          isLoading={activeLoading}
          onSend={handleSend}
          onStop={activeSessionKey && onStopSession ? () => onStopSession(activeSessionKey) : undefined}
          placeholder={selectedItem ? "Send a follow-up..." : "What should the agent work on?"}
          emptyState={activeFeed.length === 0 ? chatEmptyState : undefined}
          thinkingIndicator={thinkingIndicator}
          value={drafts ? (drafts[activeDraftKey] ?? "") : undefined}
          onValueChange={onDraftChange ? (text: string) => onDraftChange(activeDraftKey, text) : undefined}
          isSpecialTool={isSpecialTool}
          renderToolResult={renderToolResult}
          toolLabels={toolLabels}
          renderTurnSummary={renderTurnSummary}
          onNotice={onNotice}
          onOpenLink={onOpenLink}
          renderLink={renderLink}
          footer={typeof footer === "function" ? footer({ hasMessages: activeFeed.length > 0 }) : footer}
        />
      </div>
    </KanbanDetailPanel>
  )

  if (!showPanel) {
    return <div className="h-full overflow-hidden">{board}</div>
  }

  // Portal mode: render panel into an app-level container (full-height layout)
  if (panelContainer) {
    return (
      <>
        <div className="h-full overflow-hidden">{board}</div>
        {createPortal(detailPanel, panelContainer)}
      </>
    )
  }

  // Fallback: inline SplitView within AIBoard
  return (
    <SplitView
      left={board}
      right={detailPanel}
      defaultLeftSize={55}
      defaultRightSize={45}
      minLeftSize={30}
      minRightSize={25}
    />
  )
}
