/**
 * RoutinesGrid — Card grid view for routines.
 * Accepts data and callbacks via props (no Zustand, no Tauri).
 */
import { useMemo } from "react"
import type { Routine } from "./types"
import { RoutineCard } from "./routine-card"

export interface RoutinesGridProps {
  routines: Routine[]
  loading?: boolean
  onSelectRoutine: (routineId: string) => void
}

const STATUS_ORDER: Record<string, number> = {
  active: 0,
  needs_setup: 1,
  error: 2,
  paused: 3,
}

export function RoutinesGrid({
  routines,
  loading,
  onSelectRoutine,
}: RoutinesGridProps) {
  const sorted = useMemo(() => {
    return [...routines].sort((a, b) => {
      const sa = STATUS_ORDER[a.status] ?? 9
      const sb = STATUS_ORDER[b.status] ?? 9
      if (sa !== sb) return sa - sb
      const nameA = a.name.toLowerCase()
      const nameB = b.name.toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }, [routines])

  if (loading && routines.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading routines...
        </p>
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center pt-[20vh] gap-4 px-8">
        <div className="space-y-2 text-center max-w-md">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Automate recurring work
          </h1>
          <p className="text-sm text-muted-foreground">
            Routines run on a schedule so Houston can work for you
            automatically — daily reports, weekly research, and more.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onClick={() => onSelectRoutine(routine.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
