/**
 * MemoryCategoryFilter -- Horizontal row of category pill buttons.
 */
import { cn } from "@deck-ui/core"
import type { MemoryCategory } from "./types"
import { CATEGORY_LABELS } from "./types"

export interface MemoryCategoryFilterProps {
  value: MemoryCategory | null
  onChange: (category: MemoryCategory | null) => void
  counts?: Partial<Record<MemoryCategory, number>>
}

const categories: MemoryCategory[] = [
  "conversation",
  "preference",
  "context",
  "skill",
  "fact",
]

export function MemoryCategoryFilter({
  value,
  onChange,
  counts,
}: MemoryCategoryFilterProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
          value === null
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:bg-accent",
        )}
      >
        All
        {counts && (
          <span className="opacity-60">
            {Object.values(counts).reduce((a, b) => a + (b ?? 0), 0)}
          </span>
        )}
      </button>

      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            value === cat
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-accent",
          )}
        >
          {CATEGORY_LABELS[cat]}
          {counts?.[cat] != null && (
            <span className="opacity-60">{counts[cat]}</span>
          )}
        </button>
      ))}
    </div>
  )
}
