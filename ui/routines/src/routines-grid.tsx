/**
 * RoutinesGrid — Card grid view for routines with create button.
 * Props-driven: no Zustand, no Tauri.
 */
import {
  Empty, EmptyHeader, EmptyTitle, EmptyDescription, Button,
} from "@houston-ai/core"
import { Plus } from "lucide-react"
import type { Routine, RoutineRun } from "./types"
import { RoutineCard } from "./routine-card"

export interface RoutinesGridProps {
  routines: Routine[]
  /** Most recent run per routine, keyed by routine ID. */
  lastRuns?: Record<string, RoutineRun>
  loading?: boolean
  onSelect: (routineId: string) => void
  onCreate?: () => void
  onToggle?: (routineId: string, enabled: boolean) => void
}

export function RoutinesGrid({
  routines,
  lastRuns = {},
  loading,
  onSelect,
  onCreate,
  onToggle,
}: RoutinesGridProps) {
  // Sort: enabled first, then alphabetical
  const sorted = [...routines].sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  if (loading && routines.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading routines...</p>
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <Empty className="flex-1 border-0">
        <EmptyHeader>
          <EmptyTitle>Automate recurring work</EmptyTitle>
          <EmptyDescription>
            Routines run on a schedule and notify you only when something needs
            your attention.
          </EmptyDescription>
        </EmptyHeader>
        {onCreate && (
          <div className="mt-4">
            <Button onClick={onCreate}>
              <Plus className="size-4 mr-1" />
              New routine
            </Button>
          </div>
        )}
      </Empty>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground">Routines</h2>
          {onCreate && (
            <Button variant="outline" size="sm" onClick={onCreate}>
              <Plus className="size-3.5 mr-1" />
              New routine
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              lastRun={lastRuns[routine.id]}
              onClick={() => onSelect(routine.id)}
              onToggle={onToggle ? (enabled) => onToggle(routine.id, enabled) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
