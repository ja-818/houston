/**
 * MemoryGrid -- Responsive grid of memory cards with loading skeletons.
 */
import { Skeleton } from "@deck-ui/core"
import type { Memory } from "./types"
import { MemoryCard } from "./memory-card"

export interface MemoryGridProps {
  memories: Memory[]
  onMemoryClick?: (memory: Memory) => void
  onMemoryDelete?: (memory: Memory) => void
  loading?: boolean
}

function MemoryCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  )
}

export function MemoryGrid({
  memories,
  onMemoryClick,
  onMemoryDelete,
  loading,
}: MemoryGridProps) {
  if (loading && memories.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MemoryCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {memories.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          onClick={onMemoryClick}
          onDelete={onMemoryDelete}
        />
      ))}
    </div>
  )
}
