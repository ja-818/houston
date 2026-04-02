/**
 * MemoryCard -- Individual memory card with category badge, content, tags.
 */
import { cn, Card } from "@deck-ui/core"
import {
  MessageCircle,
  Settings,
  FolderOpen,
  Lightbulb,
  BookOpen,
  X,
} from "lucide-react"
import type { Memory, MemoryCategory } from "./types"
import { CATEGORY_LABELS } from "./types"

export interface MemoryCardProps {
  memory: Memory
  onClick?: (memory: Memory) => void
  onDelete?: (memory: Memory) => void
}

const categoryIcons: Record<MemoryCategory, React.ElementType> = {
  conversation: MessageCircle,
  preference: Settings,
  context: FolderOpen,
  skill: Lightbulb,
  fact: BookOpen,
}

function relativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffSec = Math.floor((now - then) / 1000)

  if (diffSec < 60) return "just now"
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

export function MemoryCard({ memory, onClick, onDelete }: MemoryCardProps) {
  const Icon = categoryIcons[memory.category]

  return (
    <Card
      className={cn(
        "relative group p-4 gap-3 cursor-pointer transition-shadow hover:shadow-md",
        "border-border/50",
      )}
      onClick={() => onClick?.(memory)}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(memory)
          }}
          className="absolute top-3 right-3 size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      )}

      {/* Top: Category badge + timestamp */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
          <Icon className="size-3.5" />
          {CATEGORY_LABELS[memory.category]}
        </span>
        <span className="text-xs text-muted-foreground/60 shrink-0">
          {relativeTime(memory.updatedAt)}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
        {memory.content}
      </p>

      {/* Bottom: Tags + source */}
      <div className="flex items-center gap-2 flex-wrap">
        {memory.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {tag}
          </span>
        ))}
        {memory.tags.length > 0 && memory.source && (
          <span className="text-muted-foreground/30">|</span>
        )}
        {memory.source && (
          <span className="text-[11px] text-muted-foreground/60">
            {memory.source}
          </span>
        )}
      </div>
    </Card>
  )
}
