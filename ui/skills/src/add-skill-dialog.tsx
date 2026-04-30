/**
 * AddSkillDialog — Marketplace modal with two tabs (Skills.sh / GitHub).
 *
 * Layout rules:
 * - DialogContent is a fixed-size flex column. Switching tabs never resizes.
 * - Header + pill row are fixed. Body is the only scrollable region.
 */
import { useEffect, useState } from "react"
import {
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@houston-ai/core"
import type { CommunitySkill, RepoSkill } from "./types"
import { StoreView } from "./add-skill-dialog-store-view"
import type { StoreViewLabels } from "./add-skill-dialog-store-labels"
import { RepoView } from "./add-skill-dialog-repo-view"
import type { RepoViewLabels } from "./add-skill-dialog-repo-labels"

export interface AddSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch: (query: string) => Promise<CommunitySkill[]>
  onInstallCommunity: (skill: CommunitySkill) => Promise<string>
  onListFromRepo?: (source: string) => Promise<RepoSkill[]>
  onInstallFromRepo?: (source: string, skills: RepoSkill[]) => Promise<string[]>
  labels?: AddSkillDialogLabels
}

export interface AddSkillDialogLabels {
  title?: string
  description?: string
  storeTab?: string
  repoTab?: string
  store?: StoreViewLabels
  repo?: RepoViewLabels
}

type View = "store" | "repo"

const TABS: View[] = ["store", "repo"]

const DEFAULT_LABELS: Required<Omit<AddSkillDialogLabels, "store" | "repo">> = {
  title: "Add actions",
  description: "Install reusable procedures for your agent.",
  storeTab: "Skills.sh",
  repoTab: "GitHub",
}

export function AddSkillDialog({
  open,
  onOpenChange,
  onSearch,
  onInstallCommunity,
  onListFromRepo,
  onInstallFromRepo,
  labels,
}: AddSkillDialogProps) {
  const l = { ...DEFAULT_LABELS, ...labels }
  const [view, setView] = useState<View>("store")

  useEffect(() => {
    if (!open) setView("store")
  }, [open])

  const canInstallFromRepo = !!onListFromRepo && !!onInstallFromRepo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg !gap-0 p-0 h-[600px] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-3">
          <DialogTitle>{l.title}</DialogTitle>
          <DialogDescription>
            {l.description}
          </DialogDescription>
        </DialogHeader>

        {canInstallFromRepo && (
          <div className="shrink-0 flex gap-1 px-6 pb-3">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors",
                  view === tab
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {tab === "store" ? l.storeTab : l.repoTab}
              </button>
            ))}
          </div>
        )}

        {view === "store" ? (
          <StoreView
            open={open}
            onSearch={onSearch}
            onInstall={onInstallCommunity}
            labels={labels?.store}
          />
        ) : (
          <RepoView
            onList={onListFromRepo!}
            onInstall={onInstallFromRepo!}
            labels={labels?.repo}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
