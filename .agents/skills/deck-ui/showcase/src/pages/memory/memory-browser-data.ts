import type { Memory } from "@deck-ui/memory";

/* -- Sample data --------------------------------------------------------- */

export const SAMPLE_MEMORIES: Memory[] = [
  {
    id: "1",
    projectId: "p1",
    content: "User prefers morning standup summaries via Slack",
    category: "preference",
    source: "agent",
    tags: ["slack", "standup"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    projectId: "p1",
    content: "The auth service uses JWT with 24h expiry",
    category: "fact",
    source: "session:abc",
    tags: ["auth", "jwt"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    projectId: "p1",
    content:
      "Previous deployment failed due to missing env var DATABASE_URL",
    category: "context",
    source: "compaction",
    tags: ["deployment"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    projectId: "p1",
    content: "Team uses conventional commits for all repositories",
    category: "preference",
    source: "agent",
    tags: ["git", "conventions"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    projectId: "p1",
    content: "How to restart the staging database: ssh into bastion, run reset-db.sh",
    category: "skill",
    source: "session:def",
    tags: ["staging", "database"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    projectId: "p1",
    content: "Last design review discussed moving to a card-based layout for the dashboard",
    category: "conversation",
    source: "session:ghi",
    tags: ["design", "dashboard"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/* -- Code examples -------------------------------------------------------- */

export const QUICK_START_CODE = `import { useState } from "react"
import { MemoryBrowser } from "@deck-ui/memory"
import type { Memory, MemoryCategory } from "@deck-ui/memory"

function MyMemories({ memories }: { memories: Memory[] }) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<MemoryCategory | null>(null)

  const filtered = memories.filter((m) => {
    if (category && m.category !== category) return false
    if (search && !m.content.toLowerCase().includes(search.toLowerCase()))
      return false
    return true
  })

  return (
    <MemoryBrowser
      memories={filtered}
      searchQuery={search}
      onSearch={setSearch}
      selectedCategory={category}
      onCategoryFilter={setCategory}
      onMemoryClick={(m) => console.log(m.id)}
    />
  )
}`;

export const MEMORY_GRID_CODE = `import { MemoryGrid } from "@deck-ui/memory"

<MemoryGrid
  memories={memories}
  onMemoryClick={(m) => openDetail(m)}
  onMemoryDelete={(m) => deleteMemory(m.id)}
  loading={isLoading}
/>`;

export const MEMORY_CARD_CODE = `import { MemoryCard } from "@deck-ui/memory"

<MemoryCard
  memory={memory}
  onClick={(m) => openDetail(m)}
  onDelete={(m) => deleteMemory(m.id)}
/>`;

export const MEMORY_DETAIL_CODE = `import { MemoryDetail } from "@deck-ui/memory"

<MemoryDetail
  memory={selectedMemory}
  onSave={(id, content, tags) => updateMemory(id, content, tags)}
  onDelete={(m) => deleteMemory(m.id)}
  onClose={() => setSelected(null)}
/>`;

export const MEMORY_SEARCH_CODE = `import { MemorySearch } from "@deck-ui/memory"

<MemorySearch
  value={query}
  onChange={setQuery}
  placeholder="Search memories..."
/>`;

export const CATEGORY_FILTER_CODE = `import { MemoryCategoryFilter } from "@deck-ui/memory"

<MemoryCategoryFilter
  value={selectedCategory}
  onChange={setCategory}
  counts={{ preference: 5, fact: 3, context: 2 }}
/>`;

export const MEMORY_EMPTY_CODE = `import { MemoryEmpty } from "@deck-ui/memory"

<MemoryEmpty message="No memories match your search." />`;

export const TYPES_CODE = `type MemoryCategory =
  | "conversation"
  | "preference"
  | "context"
  | "skill"
  | "fact"

interface Memory {
  id: string
  projectId: string
  content: string
  category: MemoryCategory
  source: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface MemoryQuery {
  projectId?: string
  category?: MemoryCategory | null
  searchText?: string
  tags?: string[]
}`;
