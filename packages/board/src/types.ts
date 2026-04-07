import type React from "react"

export interface KanbanItem {
  id: string
  title: string
  subtitle?: string
  /** Grouping label displayed above the title (e.g. workspace name). */
  group?: string
  status: string
  updatedAt: string
  icon?: React.ReactNode
  metadata?: Record<string, unknown>
}

/** A unified conversation entry — either the primary chat or a task conversation. */
export interface ConversationEntry {
  id: string
  title: string
  status?: string
  /** `"primary"` for the workspace main chat, `"task"` for task conversations. */
  type: "primary" | "task"
  /** Session key used to address this conversation (e.g. `"main"`, `"task-{id}`). */
  sessionKey: string
  updatedAt?: string
  /** Absolute path to the workspace this conversation belongs to. */
  workspacePath: string
  /** Human-readable workspace name. */
  workspaceName: string
}

export interface KanbanColumn {
  id: string
  label: string
  statuses: string[]
  /** Show a "+" button in the column header */
  onAdd?: () => void
}
