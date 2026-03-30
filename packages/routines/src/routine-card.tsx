import type { Routine } from "./types"
import { TRIGGER_LABELS } from "./types"
import { cn } from "@deck-ui/core"
import { Clock } from "lucide-react"

export interface RoutineCardProps {
  routine: Routine
  onClick: () => void
}

const STATUS_DOT: Record<string, string> = {
  active: "bg-green-500",
  paused: "bg-muted-foreground",
  needs_setup: "bg-yellow-500",
  error: "bg-red-500",
}

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  needs_setup: "Needs Setup",
  error: "Error",
}

export function RoutineCard({ routine, onClick }: RoutineCardProps) {
  const displayName = routine.name || "Untitled"
  const triggerLabel =
    TRIGGER_LABELS[routine.trigger_type as keyof typeof TRIGGER_LABELS] ??
    routine.trigger_type
  const lastRun = routine.last_run_at
    ? new Date(routine.last_run_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border border-border p-5",
        "bg-white hover:border-border/80 transition-all duration-150",
        "hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        "flex flex-col gap-3",
      )}
    >
      {/* Top: name + status */}
      <div className="flex items-start gap-2.5">
        <h3 className="text-[15px] font-medium text-foreground leading-snug flex-1 min-w-0">
          {displayName}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <div
            className={cn(
              "size-1.5 rounded-full",
              STATUS_DOT[routine.status] ?? "bg-muted-foreground",
            )}
          />
          <span className="text-xs text-muted-foreground">
            {STATUS_LABEL[routine.status] ?? routine.status}
          </span>
        </div>
      </div>

      {/* Description */}
      {routine.description && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {routine.description}
        </p>
      )}

      {/* Footer: trigger + last run + run count */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {triggerLabel}
        </span>
        {routine.run_count > 0 && (
          <span>
            {routine.run_count} run{routine.run_count !== 1 ? "s" : ""}
          </span>
        )}
        {lastRun && <span>Last: {lastRun}</span>}
      </div>
    </button>
  )
}
