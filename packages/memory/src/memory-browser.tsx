/**
 * MemoryBrowser -- Main component: search + category filter + memory grid.
 * Fully props-driven: host app provides data and callbacks.
 */
import { Button } from "@deck-ui/core"
import { Plus } from "lucide-react"
import type { Memory, MemoryCategory } from "./types"
import { MemorySearch } from "./memory-search"
import { MemoryCategoryFilter } from "./memory-category-filter"
import { MemoryGrid } from "./memory-grid"
import { MemoryEmpty } from "./memory-empty"

export interface MemoryBrowserProps {
  memories: Memory[]
  loading?: boolean
  onSearch?: (query: string) => void
  onCategoryFilter?: (category: MemoryCategory | null) => void
  onMemoryClick?: (memory: Memory) => void
  onMemoryDelete?: (memory: Memory) => void
  onMemoryCreate?: () => void
  selectedCategory?: MemoryCategory | null
  searchQuery?: string
  emptyMessage?: string
}

export function MemoryBrowser({
  memories,
  loading,
  onSearch,
  onCategoryFilter,
  onMemoryClick,
  onMemoryDelete,
  onMemoryCreate,
  selectedCategory = null,
  searchQuery = "",
  emptyMessage,
}: MemoryBrowserProps) {
  const showEmpty = !loading && memories.length === 0

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 px-6 py-4 space-y-3">
        <div className="flex items-center gap-3">
          {onSearch && (
            <div className="flex-1">
              <MemorySearch value={searchQuery} onChange={onSearch} />
            </div>
          )}
          {onMemoryCreate && (
            <Button variant="outline" size="sm" onClick={onMemoryCreate}>
              <Plus className="size-4" />
              Add Memory
            </Button>
          )}
        </div>

        {onCategoryFilter && (
          <MemoryCategoryFilter
            value={selectedCategory}
            onChange={onCategoryFilter}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {showEmpty ? (
          <MemoryEmpty message={emptyMessage} />
        ) : (
          <MemoryGrid
            memories={memories}
            onMemoryClick={onMemoryClick}
            onMemoryDelete={onMemoryDelete}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}
