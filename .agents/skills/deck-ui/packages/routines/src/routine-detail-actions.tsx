/**
 * RoutineDetailActions — Action buttons for the routine detail page.
 * Save, Run Now, Pause/Resume, Delete.
 */
import { useState } from "react"
import { Pause, Play, RefreshCw, Save, Trash2 } from "lucide-react"
import { cn } from "@deck-ui/core"

export interface RoutineDetailActionsProps {
  isActive: boolean
  saving: boolean
  onSave: () => void
  onToggle: () => void
  onRunNow: () => void
  onDelete: () => void
}

export function RoutineDetailActions({
  isActive,
  saving,
  onSave,
  onToggle,
  onRunNow,
  onDelete,
}: RoutineDetailActionsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    onDelete()
  }

  const pillBtn = cn(
    "h-9 px-4 text-sm font-medium rounded-full transition-colors",
    "border border-border",
  )

  return (
    <div className="flex items-center gap-2 pt-4 border-t border-border">
      <button
        onClick={onSave}
        disabled={saving}
        className={cn(
          "h-9 px-4 text-sm font-medium rounded-full",
          "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
          "disabled:opacity-50",
        )}
      >
        <span className="flex items-center gap-1.5">
          <Save className="size-3.5" />
          {saving ? "Saving..." : "Save"}
        </span>
      </button>

      <button onClick={onRunNow} className={cn(pillBtn, "text-foreground hover:bg-secondary")}>
        <span className="flex items-center gap-1.5">
          <RefreshCw className="size-3.5" /> Run Now
        </span>
      </button>

      <button onClick={onToggle} className={cn(pillBtn, "text-foreground hover:bg-secondary")}>
        <span className="flex items-center gap-1.5">
          {isActive ? (
            <><Pause className="size-3.5" /> Pause</>
          ) : (
            <><Play className="size-3.5" /> Resume</>
          )}
        </span>
      </button>

      <div className="flex-1" />

      {confirmDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-destructive">Delete?</span>
          <button
            onClick={handleDelete}
            className="h-9 px-3 text-sm font-medium rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className={cn(pillBtn, "text-foreground hover:bg-secondary")}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={handleDelete}
          className={cn(pillBtn, "text-muted-foreground hover:text-destructive hover:border-destructive/20")}
        >
          <span className="flex items-center gap-1.5">
            <Trash2 className="size-3.5" /> Delete
          </span>
        </button>
      )}
    </div>
  )
}
