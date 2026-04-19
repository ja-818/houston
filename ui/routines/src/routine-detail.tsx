/**
 * RoutineDetail — view a routine's config and run history.
 */
import { Button } from "@houston-ai/core"
import { ArrowLeft, Play, Pause, Trash2 } from "lucide-react"
import type { Routine, RoutineRun } from "./types"
import { cronToPreset, presetSummary, cronToOptions } from "./schedule-cron-utils"
import { RunHistory } from "./run-history"

export interface RoutineDetailProps {
  routine: Routine
  runs: RoutineRun[]
  onBack: () => void
  onEdit?: () => void
  onRunNow?: () => void
  onToggle?: (enabled: boolean) => void
  onDelete?: () => void
  onViewActivity?: (activityId: string) => void
}

function scheduleSummaryText(cron: string): string {
  const preset = cronToPreset(cron)
  if (!preset) return `Custom: ${cron}`
  const opts = cronToOptions(cron)
  return presetSummary(preset, {
    time: opts.time ?? "09:00",
    dayOfWeek: opts.dayOfWeek ?? 1,
    dayOfMonth: opts.dayOfMonth ?? 1,
  })
}

export function RoutineDetail({
  routine,
  runs,
  onBack,
  onEdit,
  onRunNow,
  onToggle,
  onDelete,
  onViewActivity,
}: RoutineDetailProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground">Routines</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-medium text-foreground">{routine.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {scheduleSummaryText(routine.schedule)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onRunNow && (
              <Button variant="outline" size="sm" onClick={onRunNow}>
                <Play className="size-3.5 mr-1" />
                Run now
              </Button>
            )}
            {onToggle && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggle(!routine.enabled)}
              >
                <Pause className="size-3.5 mr-1" />
                {routine.enabled ? "Pause" : "Resume"}
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="size-3.5 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Prompt preview */}
      <div className="px-6 py-4 border-b border-border/50">
        <p className="text-xs font-medium text-muted-foreground mb-2">Prompt</p>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed line-clamp-4">
          {routine.prompt}
        </p>
      </div>

      {/* Run history */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">Recent runs</p>
        <RunHistory runs={runs} onViewActivity={onViewActivity} />
      </div>
    </div>
  )
}
