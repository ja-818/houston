import type { PropDef } from "../../components/props-table";

export const MEMORY_BROWSER_PROPS: PropDef[] = [
  { name: "memories", type: "Memory[]", description: "Array of memories to display in the grid" },
  { name: "loading", type: "boolean", default: "false", description: "Shows skeleton cards while loading" },
  { name: "onSearch", type: "(query: string) => void", description: "Called on search input change. Omit to hide search." },
  { name: "onCategoryFilter", type: "(cat: MemoryCategory | null) => void", description: "Called when a category pill is clicked. Omit to hide filter." },
  { name: "onMemoryClick", type: "(memory: Memory) => void", description: "Called when a memory card is clicked" },
  { name: "onMemoryDelete", type: "(memory: Memory) => void", description: "Called when the delete button is clicked on a card" },
  { name: "onMemoryCreate", type: "() => void", description: "Called when the 'Add Memory' button is clicked. Omit to hide it." },
  { name: "selectedCategory", type: "MemoryCategory | null", default: "null", description: "Currently active category filter" },
  { name: "searchQuery", type: "string", default: '""', description: "Current search query (controlled)" },
  { name: "emptyMessage", type: "string", description: "Custom message for empty state" },
];

export const MEMORY_GRID_PROPS: PropDef[] = [
  { name: "memories", type: "Memory[]", description: "Memories to render as cards" },
  { name: "onMemoryClick", type: "(memory: Memory) => void", description: "Called when a card is clicked" },
  { name: "onMemoryDelete", type: "(memory: Memory) => void", description: "Called when delete is clicked on a card" },
  { name: "loading", type: "boolean", default: "false", description: "Shows 6 skeleton cards when true and memories is empty" },
];

export const MEMORY_CARD_PROPS: PropDef[] = [
  { name: "memory", type: "Memory", description: "The memory data to render" },
  { name: "onClick", type: "(memory: Memory) => void", description: "Called when the card is clicked" },
  { name: "onDelete", type: "(memory: Memory) => void", description: "Called when the delete button is clicked" },
];

export const MEMORY_DETAIL_PROPS: PropDef[] = [
  { name: "memory", type: "Memory", description: "The memory to display in full" },
  { name: "onSave", type: "(id, content, tags) => void", description: "Called when edits are saved. Omit to disable editing." },
  { name: "onDelete", type: "(memory: Memory) => void", description: "Called when the delete button is clicked" },
  { name: "onClose", type: "() => void", description: "Called when the close button is clicked" },
];

export const MEMORY_SEARCH_PROPS: PropDef[] = [
  { name: "value", type: "string", description: "Current search input value (controlled)" },
  { name: "onChange", type: "(query: string) => void", description: "Called after 300ms debounce on input change" },
  { name: "placeholder", type: "string", default: '"Search memories..."', description: "Placeholder text for the input" },
];

export const CATEGORY_FILTER_PROPS: PropDef[] = [
  { name: "value", type: "MemoryCategory | null", description: "Currently active category (null = all)" },
  { name: "onChange", type: "(cat: MemoryCategory | null) => void", description: "Called when a category pill is clicked" },
  { name: "counts", type: "Partial<Record<MemoryCategory, number>>", description: "Badge counts per category" },
];

export const MEMORY_EMPTY_PROPS: PropDef[] = [
  { name: "message", type: "string", default: '"Memories will appear here..."', description: "Custom empty state message" },
];
