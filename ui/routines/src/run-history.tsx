/**
 * RunHistory — list of routine runs with status dots, timestamps, and links for surfaced runs.
 */
import { cn } from "@houston-ai/core"
import { ExternalLink } from "lucide-react"
import type { RoutineRun } from "./types"

export interface RunHistoryProps {
  runs: RoutineRun[]
  onViewActivity?: (activityId: string) => void
}

const STATUS_DOT: Record<string, string> = {
  silent: "bg-gray-400",
  surfaced: "bg-blue-500",
  running: "bg-blue-500 animate-pulse",
  error: "bg-red-500",
}

const STATUS_LABEL: Record<string, string> = {
  silent: "Silent",
  surfaced: "Surfaced",
  running: "Running",
  error: "Error",
}

function formatRunTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  if (diffDays === 0) return `Today ${time}`
  if (diffDays === 1) return `Yesterday ${time}`
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`
}

function formatDuration(startedAt: string, completedAt?: string): string | null {
  if (!completedAt) return null
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function RunHistory({ runs, onViewActivity }: RunHistoryProps) {
  // Show newest first
  const sorted = [...runs].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  )

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No runs yet. This routine hasn't fired.</p>
    )
  }

  return (
    <div className="space-y-1">
      {sorted.map((run) => {
        const duration = formatDuration(run.started_at, run.completed_at)
        return (
          <div
            key={run.id}
            className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary/50 text-sm"
          >
            {/* Status dot */}
            <div className={cn("size-2 rounded-full shrink-0", STATUS_DOT[run.status])} />

            {/* Timestamp */}
            <span className="text-muted-foreground w-36 shrink-0 text-xs">
              {formatRunTime(run.started_at)}
            </span>

            {/* Status */}
            <span className={cn(
              "text-xs w-16 shrink-0",
              run.status === "error" ? "text-red-500" : "text-muted-foreground",
            )}>
              {STATUS_LABEL[run.status] ?? run.status}
            </span>

            {/* Duration */}
            <span className="text-xs text-muted-foreground w-12 shrink-0">
              {duration ?? "—"}
            </span>

            {/* Summary or View link */}
            <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
              {run.summary ?? ""}
            </span>

            {run.status === "surfaced" && run.activity_id && onViewActivity && (
              <button
                onClick={() => onViewActivity(run.activity_id!)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 shrink-0"
              >
                View
                <ExternalLink className="size-3" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
