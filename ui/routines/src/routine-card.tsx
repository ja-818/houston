/**
 * RoutineCard — displays a single routine with schedule summary and enabled toggle.
 */
import { cn } from "@houston-ai/core"
import { Clock } from "lucide-react"
import type { Routine, RoutineRun } from "./types"
import { cronToPreset, presetSummary, cronToOptions } from "./schedule-cron-utils"

export interface RoutineCardProps {
  routine: Routine
  lastRun?: RoutineRun
  onClick?: () => void
  onToggle?: (enabled: boolean) => void
}

function scheduleSummary(cron: string): string {
  const preset = cronToPreset(cron)
  if (!preset) return cron
  const options = cronToOptions(cron)
  return presetSummary(preset, {
    time: options.time ?? "09:00",
    dayOfWeek: options.dayOfWeek ?? 1,
    dayOfMonth: options.dayOfMonth ?? 1,
  })
}

const RUN_STATUS_LABEL: Record<string, string> = {
  silent: "Last: silent",
  surfaced: "Last: surfaced",
  running: "Running…",
  error: "Last: error",
}

const RUN_STATUS_COLOR: Record<string, string> = {
  silent: "text-muted-foreground",
  surfaced: "text-foreground",
  running: "text-blue-600",
  error: "text-red-500",
}

export function RoutineCard({ routine, lastRun, onClick, onToggle }: RoutineCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border border-border/50 p-4 transition-colors",
        "hover:bg-secondary/50",
        !routine.enabled && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {routine.name || "Untitled"}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="size-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {scheduleSummary(routine.schedule)}
            </p>
          </div>
          {lastRun && (
            <p className={cn("text-xs mt-1", RUN_STATUS_COLOR[lastRun.status])}>
              {RUN_STATUS_LABEL[lastRun.status] ?? lastRun.status}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle?.(!routine.enabled)
          }}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
            routine.enabled ? "bg-primary" : "bg-gray-300",
          )}
          role="switch"
          aria-checked={routine.enabled}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow",
              "transform transition-transform mt-0.5",
              routine.enabled ? "translate-x-4 ml-0.5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>
    </button>
  )
}
