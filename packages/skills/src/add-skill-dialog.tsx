/**
 * AddSkillDialog — Marketplace modal for searching and installing skills
 * from skills.sh, or directly from any public GitHub repo.
 *
 * Repo install flow (two stages):
 *   1. Input — user enters owner/repo
 *   2. Selection — discovered skills shown with checkboxes + Install All
 */
import { useCallback, useEffect, useRef, useState } from "react"
import {
  cn,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Spinner,
} from "@houston-ai/core"
import {
  AlertCircle, ArrowLeft, Check, Loader2, Plus, Search,
} from "lucide-react"
import type { CommunitySkill, RepoSkill } from "./types"

export interface AddSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch: (query: string) => Promise<CommunitySkill[]>
  onInstallCommunity: (skill: CommunitySkill) => Promise<string>
  onListFromRepo?: (source: string) => Promise<RepoSkill[]>
  onInstallFromRepo?: (source: string, skills: RepoSkill[]) => Promise<string[]>
}

type View = "store" | "repo"

export function AddSkillDialog({
  open,
  onOpenChange,
  onSearch,
  onInstallCommunity,
  onListFromRepo,
  onInstallFromRepo,
}: AddSkillDialogProps) {
  const [view, setView] = useState<View>("store")

  useEffect(() => {
    if (!open) setView("store")
  }, [open])

  const canInstallFromRepo = !!onListFromRepo && !!onInstallFromRepo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col gap-4">
        {view === "store" ? (
          <StoreView
            open={open}
            onSearch={onSearch}
            onInstall={onInstallCommunity}
            onSwitchToRepo={canInstallFromRepo ? () => setView("repo") : undefined}
          />
        ) : (
          <RepoView
            onBack={() => setView("store")}
            onList={onListFromRepo!}
            onInstall={onInstallFromRepo!}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Store view ────────────────────────────────────────────────────

function StoreView({
  open,
  onSearch,
  onInstall,
  onSwitchToRepo,
}: {
  open: boolean
  onSearch: (query: string) => Promise<CommunitySkill[]>
  onInstall: (skill: CommunitySkill) => Promise<string>
  onSwitchToRepo?: () => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CommunitySkill[]>([])
  const [featured, setFeatured] = useState<CommunitySkill[]>([])
  const [loading, setLoading] = useState(true)
  const [installingIds, setInstallingIds] = useState<Set<string>>(new Set())
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const mountedRef = useRef(true)
  const loadedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setLoading(true)
      loadedRef.current = false
      return
    }
    if (loadedRef.current) return
    loadedRef.current = true
    loadFeatured()
  }, [open])

  const loadFeatured = async () => {
    setLoading(true)
    try {
      const skills = await onSearch("ai")
      if (mountedRef.current) setFeatured(skills.slice(0, 10))
    } catch {
      // Not critical — user can still search
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const skills = await onSearch(q)
        if (mountedRef.current) setResults(skills)
      } catch {
        if (mountedRef.current) setResults([])
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }, 350)
    return () => {
      clearTimeout(timer)
      setLoading(false)
    }
  }, [query, onSearch])

  const handleInstall = useCallback(
    async (skill: CommunitySkill) => {
      setInstallingIds((prev) => new Set(prev).add(skill.id))
      try {
        await onInstall(skill)
        setInstalledIds((prev) => new Set(prev).add(skill.id))
      } catch (e) {
        console.error("[skills] Install failed:", e)
      } finally {
        setInstallingIds((prev) => {
          const next = new Set(prev)
          next.delete(skill.id)
          return next
        })
      }
    },
    [onInstall],
  )

  const visibleSkills = query.trim() ? results : featured

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add skills</DialogTitle>
        <DialogDescription>
          Search and install skills from{" "}
          <span className="font-medium text-foreground">skills.sh</span>
          {onSwitchToRepo && (
            <>
              {" or "}
              <button
                onClick={onSwitchToRepo}
                className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
              >
                install from GitHub
              </button>
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills..."
          autoFocus
          className="w-full h-9 pl-9 pr-3 rounded-full border border-border bg-background text-sm
                     placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto -mx-6 min-h-0">
        {loading && visibleSkills.length === 0 && (
          <div className="flex justify-center py-8">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        )}

        {!loading && visibleSkills.length === 0 && query.trim() && (
          <p className="text-sm text-muted-foreground px-6 py-4">
            No skills found for &ldquo;{query.trim()}&rdquo;
          </p>
        )}

        {!loading && visibleSkills.length === 0 && !query.trim() && (
          <p className="text-sm text-muted-foreground px-6 py-4 text-center">
            Type to search for skills
          </p>
        )}

        {visibleSkills.length > 0 && (
          <div className="divide-y divide-border border-y border-border">
            {visibleSkills.map((skill) => (
              <StoreRow
                key={skill.id}
                skill={skill}
                installing={installingIds.has(skill.id)}
                installed={installedIds.has(skill.id)}
                onInstall={() => handleInstall(skill)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── Repo view (two stages: input → selection) ─────────────────────

type RepoStage =
  | { kind: "input" }
  | { kind: "loading"; source: string }
  | { kind: "selection"; source: string; skills: RepoSkill[] }
  | { kind: "installing"; source: string; skills: RepoSkill[]; selected: Set<string> }
  | { kind: "done"; installed: string[] }

function RepoView({
  onBack,
  onList,
  onInstall,
}: {
  onBack: () => void
  onList: (source: string) => Promise<RepoSkill[]>
  onInstall: (source: string, skills: RepoSkill[]) => Promise<string[]>
}) {
  const [source, setSource] = useState("")
  const [stage, setStage] = useState<RepoStage>({ kind: "input" })
  const [error, setError] = useState("")

  const handleDiscover = useCallback(async () => {
    const trimmed = source.trim()
    if (!trimmed) return
    setError("")
    setStage({ kind: "loading", source: trimmed })
    try {
      const skills = await onList(trimmed)
      const allSelected = new Set(skills.map((s) => s.id))
      setStage({ kind: "selection", source: trimmed, skills })
      // Pre-select all
      setStage({ kind: "selection", source: trimmed, skills })
      // Store selection separately so we can mutate it
      setSelected(allSelected)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStage({ kind: "input" })
    }
  }, [source, onList])

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleSkill = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleInstall = useCallback(async () => {
    if (stage.kind !== "selection") return
    const toInstall = stage.skills.filter((s) => selected.has(s.id))
    if (toInstall.length === 0) return
    setError("")
    setStage({ kind: "installing", source: stage.source, skills: stage.skills, selected })
    try {
      const names = await onInstall(stage.source, toInstall)
      setStage({ kind: "done", installed: names })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStage({ kind: "selection", source: stage.source, skills: stage.skills })
    }
  }, [stage, selected, onInstall])

  const isLoading = stage.kind === "loading"
  const isInstalling = stage.kind === "installing"

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground
                       hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
          <DialogTitle>Install from GitHub</DialogTitle>
        </div>
        <DialogDescription>
          Enter a <span className="font-medium text-foreground">public</span> GitHub repo in{" "}
          <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">owner/repo</span> format.
          Houston will find every <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">SKILL.md</span>{" "}
          file in the repo and let you pick which ones to install.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        {/* Input row — always visible unless done */}
        {stage.kind !== "done" && (
          <div className="flex gap-2">
            <Input
              value={source}
              onChange={(e) => {
                setSource(e.target.value)
                if (stage.kind !== "input") setStage({ kind: "input" })
                setError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && source.trim() && !isLoading && !isInstalling) {
                  if (stage.kind === "selection") handleInstall()
                  else handleDiscover()
                }
              }}
              placeholder="owner/repo"
              disabled={isLoading || isInstalling}
              autoFocus
              className="flex-1"
            />
            {stage.kind === "input" || stage.kind === "loading" ? (
              <Button
                onClick={handleDiscover}
                disabled={!source.trim() || isLoading}
                className="rounded-full shrink-0"
              >
                {isLoading ? <Spinner className="size-4" /> : "Find skills"}
              </Button>
            ) : (
              <Button
                onClick={handleInstall}
                disabled={selected.size === 0 || isInstalling}
                className="rounded-full shrink-0"
              >
                {isInstalling ? <Spinner className="size-4" /> : `Install ${selected.size}`}
              </Button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="flex items-start gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            {error}
          </p>
        )}

        {/* Selection list */}
        {stage.kind === "selection" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">
                {stage.skills.length} skill{stage.skills.length !== 1 && "s"} found
              </p>
              <button
                onClick={() => {
                  if (selected.size === stage.skills.length) {
                    setSelected(new Set())
                  } else {
                    setSelected(new Set(stage.skills.map((s) => s.id)))
                  }
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {selected.size === stage.skills.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {stage.skills.map((skill) => (
                <RepoSkillRow
                  key={skill.id}
                  skill={skill}
                  selected={selected.has(skill.id)}
                  onToggle={() => toggleSkill(skill.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Installing state */}
        {stage.kind === "installing" && (
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden opacity-60 pointer-events-none">
            {stage.skills.filter((s) => stage.selected.has(s.id)).map((skill) => (
              <RepoSkillRow
                key={skill.id}
                skill={skill}
                selected
                onToggle={() => {}}
              />
            ))}
          </div>
        )}

        {/* Success */}
        {stage.kind === "done" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Check className="size-4 text-emerald-600 shrink-0" />
              <span>
                Installed {stage.installed.length} skill{stage.installed.length !== 1 && "s"}:{" "}
                {stage.installed.join(", ")}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStage({ kind: "input" })
                setSource("")
                setError("")
                setSelected(new Set())
              }}
              className="rounded-full w-full"
            >
              Install from another repo
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Repo skill row ────────────────────────────────────────────────

function RepoSkillRow({
  skill,
  selected,
  onToggle,
}: {
  skill: RepoSkill
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
    >
      <div
        className={cn(
          "size-4 rounded border shrink-0 flex items-center justify-center transition-colors",
          selected
            ? "bg-foreground border-foreground"
            : "border-border bg-background",
        )}
      >
        {selected && <Check className="size-2.5 text-background" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{skill.name}</p>
        {skill.description && (
          <p className="text-xs text-muted-foreground truncate">{skill.description}</p>
        )}
        <p className="text-xs text-muted-foreground/60 truncate font-mono">{skill.path}</p>
      </div>
    </button>
  )
}

// ── Store row ─────────────────────────────────────────────────────

function formatInstalls(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function StoreRow({
  skill,
  installing,
  installed,
  onInstall,
}: {
  skill: CommunitySkill
  installing: boolean
  installed: boolean
  onInstall: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{skill.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {skill.source}
          {skill.installs > 0 && ` · ${formatInstalls(skill.installs)} installs`}
        </p>
      </div>
      <button
        onClick={onInstall}
        disabled={installing || installed}
        className={cn(
          "shrink-0 size-8 flex items-center justify-center rounded-full transition-colors",
          installed
            ? "text-muted-foreground cursor-default"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          installing && "opacity-50 cursor-wait",
        )}
      >
        {installing ? (
          <Loader2 className="size-4 animate-spin" />
        ) : installed ? (
          <Check className="size-4" />
        ) : (
          <Plus className="size-4" />
        )}
      </button>
    </div>
  )
}
