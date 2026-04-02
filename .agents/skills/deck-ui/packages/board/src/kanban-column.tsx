import { AnimatePresence, motion } from "framer-motion"
import type { KanbanItem } from "./types"
import { KanbanCard } from "./kanban-card"

export interface KanbanColumnProps {
  label: string
  items: KanbanItem[]
  selectedId?: string | null
  onSelect: (item: KanbanItem) => void
  onDelete?: (item: KanbanItem) => void
  onApprove?: (item: KanbanItem) => void
  runningStatuses?: string[]
  approveStatuses?: string[]
  renderCard?: (item: KanbanItem) => React.ReactNode
  actions?: (item: KanbanItem) => React.ReactNode
  avatar?: React.ReactNode
}

export function KanbanColumn({
  label,
  items,
  onSelect,
  onDelete,
  onApprove,
  runningStatuses,
  approveStatuses,
  renderCard,
  actions,
  avatar,
}: KanbanColumnProps) {
  return (
    <div className="min-w-[180px] flex-1 flex flex-col h-full min-h-0 rounded-xl bg-secondary">
      {/* Column header */}
      <div className="px-3 py-2.5 flex items-center justify-center shrink-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-foreground">{label}</h3>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground/60 tabular-nums">
              {items.length}
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 px-1.5 pb-1.5 space-y-1.5 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {renderCard ? (
                renderCard(item)
              ) : (
                <KanbanCard
                  item={item}
                  onSelect={() => onSelect(item)}
                  onDelete={onDelete ? () => onDelete(item) : undefined}
                  onApprove={onApprove ? () => onApprove(item) : undefined}
                  runningStatuses={runningStatuses}
                  approveStatuses={approveStatuses}
                  actions={actions?.(item)}
                  avatar={avatar}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
