import type React from "react"

export interface KanbanItem {
  id: string
  title: string
  subtitle?: string
  status: string
  updatedAt: string
  icon?: React.ReactNode
  metadata?: Record<string, unknown>
}

export interface KanbanColumn {
  id: string
  label: string
  statuses: string[]
}
