export type MemoryCategory =
  | "conversation"
  | "preference"
  | "context"
  | "skill"
  | "fact"

export interface Memory {
  id: string
  projectId: string
  content: string
  category: MemoryCategory
  source: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface MemoryQuery {
  projectId?: string
  category?: MemoryCategory | null
  searchText?: string
  tags?: string[]
}

export const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  conversation: "Conversation",
  preference: "Preference",
  context: "Context",
  skill: "Skill",
  fact: "Fact",
}

export const CATEGORY_ICONS: Record<MemoryCategory, string> = {
  conversation: "MessageCircle",
  preference: "Settings",
  context: "FolderOpen",
  skill: "Lightbulb",
  fact: "BookOpen",
}
