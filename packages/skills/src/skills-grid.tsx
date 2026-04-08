/**
 * SkillsGrid — Installed skills list with "Add skill" button that opens
 * a marketplace modal for searching and installing from skills.sh.
 */
import { useMemo, useState } from "react"
import {
  Button,
  Empty, EmptyHeader, EmptyTitle, EmptyDescription,
} from "@houston-ai/core"
import { Plus } from "lucide-react"
import type { Skill, CommunitySkill, RepoSkill } from "./types"
import { SkillRow } from "./skill-row"
import { AddSkillDialog } from "./add-skill-dialog"

export interface SkillsGridProps {
  skills: Skill[]
  loading: boolean
  onSkillClick: (skill: Skill) => void
  /** Search skills.sh. Required to enable the marketplace modal. */
  onSearch?: (query: string) => Promise<CommunitySkill[]>
  /** Install a single community skill. Returns installed skill name. */
  onInstallCommunity?: (skill: CommunitySkill) => Promise<string>
  /** Discover all SKILL.md files in a GitHub repo. */
  onListFromRepo?: (source: string) => Promise<RepoSkill[]>
  /** Install selected skills from a repo. Returns installed names. */
  onInstallFromRepo?: (source: string, skills: RepoSkill[]) => Promise<string[]>
}

export function SkillsGrid({
  skills,
  loading,
  onSkillClick,
  onSearch,
  onInstallCommunity,
  onListFromRepo,
  onInstallFromRepo,
}: SkillsGridProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const sorted = useMemo(() => {
    return [...skills].sort((a, b) => a.name.localeCompare(b.name))
  }, [skills])

  const canAdd = !!onSearch && !!onInstallCommunity

  if (loading && skills.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading skills...
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-8">
        {/* Empty state */}
        {sorted.length === 0 && (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>No skills yet</EmptyTitle>
              <EmptyDescription>
                Skills teach your agent reusable procedures. Install skills
                from the community or let your agent learn them over time.
              </EmptyDescription>
            </EmptyHeader>
            {canAdd && (
              <Button
                onClick={() => setDialogOpen(true)}
                className="rounded-full"
              >
                <Plus className="size-4" />
                Add skill
              </Button>
            )}
          </Empty>
        )}

        {/* Installed section */}
        {sorted.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">
                Installed
              </h2>
              {canAdd && (
                <Button
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                  className="rounded-full"
                >
                  <Plus className="size-3.5" />
                  Add skill
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {sorted.map((skill) => (
                <SkillRow
                  key={skill.id}
                  skill={skill}
                  onClick={() => onSkillClick(skill)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Marketplace modal */}
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
