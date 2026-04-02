import type { RoutineRun } from "./types"
import {
  Check,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react"

export interface RunHistoryProps {
  runs: RoutineRun[]
  onSelectRun: (id: string) => void
}

export function RunHistory({ runs, onSelectRun }: RunHistoryProps) {
  if (runs.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Runs
        </p>
        <p className="text-sm text-muted-foreground">No runs yet.</p>
      </div>
    )
  }

  const sorted = [...runs].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Run History
      </p>
      <div className="space-y-1">
        {sorted.map((run) => (
          <RunRow key={run.id} run={run} onClick={() => onSelectRun(run.id)} />
        ))}
      </div>
    </div>
  )
}

function RunRow({ run, onClick }: { run: RoutineRun; onClick: () => void }) {
  const date = new Date(run.created_at)
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  const icon = (() => {
    switch (run.status) {
      case "running":
        return <Loader2 className="size-3.5 text-blue-500 animate-spin" />
      case "needs_you":
        return <Clock className="size-3.5 text-amber-500" />
      case "done":
      case "approved":
        return <Check className="size-3.5 text-emerald-500" />
      case "error":
      case "failed":
        return <AlertCircle className="size-3.5 text-destructive" />
      default:
        return <Clock className="size-3.5 text-muted-foreground" />
    }
  })()

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-accent/30 transition-colors"
    >
      {icon}
      <span className="text-sm text-foreground truncate flex-1">
        {run.output_title || `${dateStr} ${timeStr}`}
      </span>
      <span className="text-xs text-muted-foreground shrink-0">
        {dateStr} {timeStr}
      </span>
    </button>
  )
}
