/**
 * MemoryDetail -- Full memory view with inline editing.
 */
import { useCallback, useEffect, useState } from "react"
import { Button } from "@deck-ui/core"
import {
  MessageCircle,
  Settings,
  FolderOpen,
  Lightbulb,
  BookOpen,
  X as XIcon,
  Pencil,
  Trash2,
} from "lucide-react"
import type { Memory, MemoryCategory } from "./types"
import { CATEGORY_LABELS } from "./types"

export interface MemoryDetailProps {
  memory: Memory
  onSave?: (id: string, content: string, tags: string[]) => void
  onDelete?: (memory: Memory) => void
  onClose?: () => void
}

const categoryIcons: Record<MemoryCategory, React.ElementType> = {
  conversation: MessageCircle,
  preference: Settings,
  context: FolderOpen,
  skill: Lightbulb,
  fact: BookOpen,
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function MemoryDetail({
  memory,
  onSave,
  onDelete,
  onClose,
}: MemoryDetailProps) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(memory.content)
  const [tagInput, setTagInput] = useState(memory.tags.join(", "))

  useEffect(() => {
    setContent(memory.content)
    setTagInput(memory.tags.join(", "))
    setEditing(false)
  }, [memory.id])

  const handleSave = useCallback(() => {
    if (!onSave) return
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    onSave(memory.id, content, tags)
    setEditing(false)
  }, [memory.id, content, tagInput, onSave])

  const handleCancel = useCallback(() => {
    setContent(memory.content)
    setTagInput(memory.tags.join(", "))
    setEditing(false)
  }, [memory.content, memory.tags])

  const Icon = categoryIcons[memory.category]
  const isDirty =
    content !== memory.content || tagInput !== memory.tags.join(", ")

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
          <Icon className="size-3.5" />
          {CATEGORY_LABELS[memory.category]}
        </span>
        <span className="text-xs text-muted-foreground">
          {memory.source}
        </span>
        <div className="flex-1" />
        {onSave && !editing && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(memory)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <XIcon className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Content */}
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border/80 resize-y"
          />
        ) : (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {memory.content}
          </p>
        )}

        {/* Tags */}
        <section>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Tags
          </label>
          {editing ? (
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Comma-separated tags"
              className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border/80"
            />
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {memory.tags.length === 0 && (
                <span className="text-xs text-muted-foreground/60">
                  No tags
                </span>
              )}
              {memory.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Timestamps */}
        <section className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Created: {formatDate(memory.createdAt)}
          </p>
          <p className="text-xs text-muted-foreground">
            Updated: {formatDate(memory.updatedAt)}
          </p>
        </section>
      </div>

      {/* Footer actions (editing mode) */}
      {editing && (
        <div className="shrink-0 px-6 py-3 border-t border-border flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={!isDirty}>
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
