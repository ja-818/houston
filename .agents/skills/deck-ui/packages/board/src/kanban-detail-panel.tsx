import { ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@deck-ui/core"

const STATUS_LABEL: Record<string, string> = {
  running: "Running",
  needs_you: "Needs You",
  done: "Done",
  approved: "Done",
  completed: "Done",
  error: "Failed",
  failed: "Failed",
}

export interface KanbanDetailPanelProps {
  title: string
  subtitle?: string
  status?: string
  onClose: () => void
  children: React.ReactNode
  actions?: React.ReactNode
  runningStatuses?: string[]
  statusLabels?: Record<string, string>
}

export function KanbanDetailPanel({
  title,
  subtitle,
  status,
  onClose,
  children,
  actions,
  runningStatuses = ["running"],
  statusLabels,
}: KanbanDetailPanelProps) {
  const labels = statusLabels ?? STATUS_LABEL
  const isRunning = status ? runningStatuses.includes(status) : false

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {title}
            </p>
            {(subtitle || status) && (
              <p className="text-[11px] text-muted-foreground">
                {subtitle}
                {subtitle && status && (
                  <span className="mx-1">&middot;</span>
                )}
                {status && (
                  <span className={cn(isRunning && "text-blue-500")}>
                    {labels[status] ?? status}
                  </span>
                )}
              </p>
            )}
          </div>
          {isRunning && (
            <Loader2 className="size-4 animate-spin text-blue-500 shrink-0" />
          )}
          {actions}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  )
}
