/**
 * RepoView — GitHub owner/repo discovery and install tab for AddSkillDialog.
 * Body-only: hosted inside a fixed-size dialog shell.
 *
 * Stages: input → loading → selection → installing → done
 */
import { useCallback, useState } from "react"
import { cn, Button, Spinner } from "@houston-ai/core"
import { AlertCircle, Check, Search } from "lucide-react"
import type { RepoSkill } from "./types"

export interface RepoViewProps {
  onList: (source: string) => Promise<RepoSkill[]>
  onInstall: (source: string, skills: RepoSkill[]) => Promise<string[]>
}

type RepoStage =
  | { kind: "input" }
  | { kind: "loading"; source: string }
  | { kind: "selection"; source: string; skills: RepoSkill[] }
  | { kind: "installing"; source: string; skills: RepoSkill[]; selected: Set<string> }
  | { kind: "done"; installed: string[] }

export function RepoView({ onList, onInstall }: RepoViewProps) {
  const [source, setSource] = useState("")
  const [stage, setStage] = useState<RepoStage>({ kind: "input" })
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleDiscover = useCallback(async () => {
    const trimmed = source.trim()
    if (!trimmed) return
    setError("")
    setStage({ kind: "loading", source: trimmed })
    try {
      const skills = await onList(trimmed)
      setStage({ kind: "selection", source: trimmed, skills })
      setSelected(new Set(skills.map((s) => s.id)))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStage({ kind: "input" })
    }
  }, [source, onList])

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
  const showList = stage.kind === "selection" || stage.kind === "installing"
  const listSkills = showList ? stage.skills : []

  return (
    <>
      <div className="shrink-0 px-6 pb-3 space-y-2">
        {stage.kind !== "done" && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
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
                className="w-full h-9 pl-9 pr-3 rounded-full border border-border bg-background text-sm
                           placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring transition-colors
                           disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
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

        {error && (
          <p className="flex items-start gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            {error}
          </p>
        )}

        {stage.kind === "selection" && (
          <div className="flex items-center justify-between pt-1">
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
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-6">
        {stage.kind === "input" && !error && (
          <p className="text-sm text-muted-foreground px-6 py-4 text-center">
            Enter a public GitHub repo in owner/repo format
          </p>
        )}

        {stage.kind === "loading" && (
          <div className="flex justify-center py-8">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        )}

        {showList && listSkills.length > 0 && (
          <div
            className={cn(
              "divide-y divide-border border-y border-border",
              isInstalling && "opacity-60 pointer-events-none",
            )}
          >
            {listSkills.map((skill) => {
              const isSelected =
                stage.kind === "installing"
                  ? stage.selected.has(skill.id)
                  : selected.has(skill.id)
              if (stage.kind === "installing" && !isSelected) return null
              return (
                <RepoSkillRow
                  key={skill.id}
                  skill={skill}
                  selected={isSelected}
                  onToggle={() => toggleSkill(skill.id)}
                />
              )
            })}
          </div>
        )}

        {stage.kind === "done" && (
          <div className="px-6 space-y-3">
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
      className="w-full flex items-center gap-3 px-6 py-3 hover:bg-accent/50 transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{skill.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {skill.description || skill.path}
        </p>
      </div>
      <div
        className={cn(
          "shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
          selected
            ? "bg-foreground border-foreground"
            : "border-border bg-background",
        )}
      >
        {selected && <Check className="size-2.5 text-background" />}
      </div>
    </button>
  )
}
