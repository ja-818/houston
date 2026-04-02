/**
 * RoutineRunPage — Full-page view for a single routine run.
 * Shows the agent conversation header and delegates chat rendering
 * to a consumer-provided component via the `renderChat` prop.
 */
import type { Routine, RoutineRun } from "./types"
import { ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@deck-ui/core"

export interface RoutineRunPageProps {
  routine: Routine | undefined
  run: RoutineRun | undefined
  onBack: () => void
  /** Render the chat feed area. Receives run status context. */
  renderChat: (context: {
    runId: string
    isRunning: boolean
    isNeedsYou: boolean
  }) => React.ReactNode
}

const RUN_STATUS_LABEL: Record<string, string> = {
  running: "Running",
  needs_you: "Needs You",
  done: "Done",
  approved: "Approved",
  completed: "Completed",
  error: "Error",
  failed: "Failed",
}

export function RoutineRunPage({
  routine,
  run,
  onBack,
  renderChat,
}: RoutineRunPageProps) {
  const isRunning = run?.status === "running"
  const isNeedsYou = run?.status === "needs_you"

  const displayName = routine?.name || "Routine"
  const statusLabel = run ? (RUN_STATUS_LABEL[run.status] ?? run.status) : ""
  const runDate = run
    ? new Date(run.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : ""

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-3 border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {runDate}
              <span className="mx-1">&middot;</span>
              <span className={cn(isRunning && "text-blue-500")}>
                {statusLabel}
              </span>
            </p>
          </div>
          {isRunning && (
            <Loader2 className="size-4 animate-spin text-blue-500 shrink-0" />
          )}
        </div>
      </div>

      {/* Chat feed — delegated to consumer */}
      {run ? (
        renderChat({
          runId: run.id,
          isRunning,
          isNeedsYou,
        })
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Run not found</p>
        </div>
      )}
    </div>
  )
}
