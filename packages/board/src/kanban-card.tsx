import { useState, useRef, useEffect } from "react"
import { cn, ConfirmDialog } from "@houston-ai/core"
import { Trash2, CheckCircle, Pencil } from "lucide-react"
import type { KanbanItem } from "./types"

export interface KanbanCardProps {
  item: KanbanItem
  onSelect: () => void
  onDelete?: () => void
  onApprove?: () => void
  onRename?: (newTitle: string) => void
  runningStatuses?: string[]
  approveStatuses?: string[]
  actions?: React.ReactNode
  avatar?: React.ReactNode
}

export function KanbanCard({
  item,
  onSelect,
  onDelete,
  onApprove,
  onRename,
  runningStatuses = ["running"],
  approveStatuses = ["needs_you"],
  actions,
  avatar,
}: KanbanCardProps) {
  const isRunning = runningStatuses.includes(item.status)
  const isNeedsApproval = approveStatuses.includes(item.status)
  const [showConfirm, setShowConfirm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirm(true)
  }

  const confirmDelete = () => {
    onDelete?.()
    setShowConfirm(false)
  }

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditValue(item.title)
    setEditing(true)
  }

  const commitRename = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== item.title) {
      onRename?.(trimmed)
    }
    setEditing(false)
  }

  return (
    <>
      <div
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        className={cn(
          "group/card relative rounded-lg bg-background px-3 py-2.5 cursor-pointer transition-all duration-200",
          isRunning
            ? "card-running-glow shadow-[0_2px_12px_rgba(59,130,246,0.12)]"
            : "shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]",
        )}
      >
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-0.5">
          {onRename && (
            <button
              onClick={handleRenameClick}
              className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-colors duration-200"
              aria-label={`Rename ${item.title}`}
            >
              <Pencil className="size-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
              aria-label={`Delete ${item.title}`}
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>

        {item.group && (
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            {item.group}
          </span>
        )}
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename()
              if (e.key === "Escape") setEditing(false)
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-foreground bg-transparent border-b border-foreground/20 outline-none w-full pr-5"
          />
        ) : (
          <p className="text-sm text-foreground line-clamp-2 pr-10">
            {item.title}
          </p>
        )}
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {item.description}
          </p>
        )}

        {/* Footer: avatar + subtitle + actions */}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {avatar ?? (
              item.icon && (
                <span className="size-4 shrink-0 flex items-center justify-center">
                  {item.icon}
                </span>
              )
            )}
            {item.subtitle && (
              <span className="text-[11px] text-muted-foreground truncate">
                {item.subtitle}
              </span>
            )}
          </div>

          <div className="shrink-0">
            {actions}
            {!actions && isNeedsApproval && onApprove && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onApprove()
                }}
                className="flex items-center gap-0.5 h-5 pl-1 pr-2 rounded-full bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/85 transition-colors duration-200"
              >
                <CheckCircle className="size-2.5" />
                Approve
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={`Delete "${item.title}"?`}
        description="This item and its history will be permanently removed."
        onConfirm={confirmDelete}
      />
    </>
  )
}
