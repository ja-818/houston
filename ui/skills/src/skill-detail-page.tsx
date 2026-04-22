/**
 * SkillDetailPage — view and edit a skill's instructions.
 *
 * Visual: Mercury-style single header bar (back · live-title · Save · ⋯) and
 * a body that places the instructions inside a gray section card with a white
 * textarea well — same rhythm as the Routines editor.
 */
import { useCallback, useEffect, useState } from "react"
import {
  cn,
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@houston-ai/core"
import { ArrowLeft, MoreHorizontal, Trash2 } from "lucide-react"
import type { Skill } from "./types"

export interface SkillDetailPageProps {
  skill: Skill | undefined
  onBack: () => void
  onSave: (skillName: string, instructions: string) => Promise<void>
  onDelete: (skillName: string) => Promise<void>
}

export function SkillDetailPage({
  skill,
  onBack,
  onSave,
  onDelete,
}: SkillDetailPageProps) {
  const [instructions, setInstructions] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (skill) setInstructions(skill.instructions)
  }, [skill?.id])

  const handleSave = useCallback(async () => {
    if (!skill) return
    setSaving(true)
    try {
      await onSave(skill.name, instructions)
    } finally {
      setSaving(false)
    }
  }, [skill, instructions, onSave])

  const handleConfirmDelete = useCallback(async () => {
    if (!skill) return
    setConfirmOpen(false)
    setDeleting(true)
    try {
      await onDelete(skill.name)
      onBack()
    } finally {
      setDeleting(false)
    }
  }, [skill, onDelete, onBack])

  if (!skill) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Skill not found</p>
      </div>
    )
  }

  const isDirty = instructions !== skill.instructions

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Single action bar — back · context · primary on right */}
      <header className="px-4 py-2.5 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label="Back to skills"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <p className="text-sm font-medium text-foreground truncate min-w-0 flex-1">
            {skill.name}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || saving || deleting}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="More actions"
                  disabled={deleting}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="size-3.5" />
                  Delete skill
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${skill.name}"?`}
        description="This removes the skill from your agent. You can reinstall it later."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 pt-3 pb-12">
          <section className="rounded-xl bg-secondary p-3">
            {skill.description && (
              <p className="text-xs text-muted-foreground px-2 pb-2">
                {skill.description}
              </p>
            )}
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={18}
              placeholder="Instructions for this skill…"
              className={cn(
                "w-full px-4 py-3 text-sm text-foreground leading-relaxed font-mono",
                "placeholder:text-muted-foreground/60",
                "bg-background border border-black/[0.04] rounded-lg",
                "outline-none resize-y transition-shadow duration-200",
                "focus:shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
              )}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
