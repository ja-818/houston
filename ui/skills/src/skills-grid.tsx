/**
 * SkillsGrid — installed-skills surface.
 *
 * Two layouts:
 *   - Empty: a centered `<Empty>` element on the host's white page (no card).
 *   - Has content: a meta row (count + Add CTA) above a gray section card
 *     containing the row list. Title is omitted because the host tab already
 *     labels this surface "Skills".
 */
import { useMemo, useState } from "react"
import {
  Button,
  ConfirmDialog,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@houston-ai/core"
import { Plus } from "lucide-react"
import type { Skill, CommunitySkill, RepoSkill } from "./types"
import { SkillRow } from "./skill-row"
import { AddSkillDialog } from "./add-skill-dialog"

/**
 * Optional translated labels. Defaults are English so existing callers
 * keep working unchanged. Consumers that need localization pass through
 * `t()` results from their own i18n layer — `ui/` stays i18n-agnostic
 * per the library-boundary rule.
 */
export interface SkillsGridLabels {
  loading?: string
  emptyTitle?: string
  emptyDescription?: string
  addSkill?: string
  descriptionShort?: string
  /** Heading on the delete-skill confirmation. `{name}` is the skill name. */
  deleteTitle?: (name: string) => string
  /** Fallback heading when a name isn't available. */
  deleteTitleFallback?: string
  deleteDescription?: string
  deleteConfirmLabel?: string
}

const DEFAULT_LABELS: Required<SkillsGridLabels> = {
  loading: "Loading skills…",
  emptyTitle: "No skills installed",
  emptyDescription: "Skills are reusable procedures your agent can lean on.",
  addSkill: "Add skill",
  descriptionShort: "Reusable procedures your agent can lean on.",
  deleteTitle: (name) => `Delete "${name}"?`,
  deleteTitleFallback: "Delete skill?",
  deleteDescription: "This removes the skill from your agent. You can reinstall it later.",
  deleteConfirmLabel: "Delete",
}

export interface SkillsGridProps {
  skills: Skill[]
  loading: boolean
  onSkillClick: (skill: Skill) => void
  /** Delete a skill by name. Enables per-row trash buttons when provided. */
  onDelete?: (name: string) => Promise<void>
  /** Search skills.sh. Required to enable the marketplace modal. */
  onSearch?: (query: string) => Promise<CommunitySkill[]>
  /** Install a single community skill. Returns installed skill name. */
  onInstallCommunity?: (skill: CommunitySkill) => Promise<string>
  /** Discover all SKILL.md files in a GitHub repo. */
  onListFromRepo?: (source: string) => Promise<RepoSkill[]>
  /** Install selected skills from a repo. Returns installed names. */
  onInstallFromRepo?: (source: string, skills: RepoSkill[]) => Promise<string[]>
  /** Override any/all user-visible strings. Unspecified fields fall back to English. */
  labels?: SkillsGridLabels
}

export function SkillsGrid({
  skills,
  loading,
  onSkillClick,
  onDelete,
  onSearch,
  onInstallCommunity,
  onListFromRepo,
  onInstallFromRepo,
  labels,
}: SkillsGridProps) {
  const l = { ...DEFAULT_LABELS, ...labels }
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Skill | null>(null)

  const handleConfirmDelete = async () => {
    if (!pendingDelete || !onDelete) return
    const name = pendingDelete.name
    setPendingDelete(null)
    await onDelete(name)
  }

  const sorted = useMemo(
    () => [...skills].sort((a, b) => a.name.localeCompare(b.name)),
    [skills],
  )

  const canAdd = !!onSearch && !!onInstallCommunity

  if (loading && skills.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">
          {l.loading}
        </p>
      </div>
    )
  }

  // Empty: text + CTA centered on the host's white page, top-aligned.
  if (sorted.length === 0) {
    return (
      <>
        <div className="mx-auto max-w-md flex flex-col items-center gap-6 text-center pt-24 px-6">
          <EmptyHeader>
            <EmptyTitle>{l.emptyTitle}</EmptyTitle>
            <EmptyDescription>
              {l.emptyDescription}
            </EmptyDescription>
          </EmptyHeader>
          {canAdd && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              {l.addSkill}
            </Button>
          )}
        </div>

        {canAdd && (
          <AddSkillDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSearch={onSearch}
            onInstallCommunity={onInstallCommunity}
            onListFromRepo={onListFromRepo}
            onInstallFromRepo={onInstallFromRepo}
          />
        )}
      </>
    )
  }

  // Has content: description + Add CTA above a 2-col grid of gray cards.
  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <p className="text-xs text-muted-foreground max-w-md">
          {l.descriptionShort}
        </p>
        {canAdd && (
          <Button size="sm" onClick={() => setDialogOpen(true)} className="shrink-0">
            <Plus className="size-3.5" />
            {l.addSkill}
          </Button>
        )}
      </div>

      <div className="rounded-xl bg-secondary overflow-hidden divide-y divide-border/60">
        {sorted.map((skill) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            onClick={() => onSkillClick(skill)}
            onDelete={onDelete ? () => setPendingDelete(skill) : undefined}
          />
        ))}
      </div>

      {onDelete && (
        <ConfirmDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => {
            if (!open) setPendingDelete(null)
          }}
          title={
            pendingDelete ? l.deleteTitle(pendingDelete.name) : l.deleteTitleFallback
          }
          description={l.deleteDescription}
          confirmLabel={l.deleteConfirmLabel}
          onConfirm={handleConfirmDelete}
        />
      )}

      {canAdd && (
        <AddSkillDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSearch={onSearch}
          onInstallCommunity={onInstallCommunity}
          onListFromRepo={onListFromRepo}
          onInstallFromRepo={onInstallFromRepo}
        />
      )}
    </div>
  )
}
