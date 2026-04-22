/**
 * StoreView — Skills.sh search and install tab for AddSkillDialog.
 * Body-only: hosted inside a fixed-size dialog shell.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { cn, Spinner } from "@houston-ai/core"
import { Check, Loader2, Plus, Search } from "lucide-react"
import type { CommunitySkill } from "./types"

export interface StoreViewProps {
  open: boolean
  onSearch: (query: string) => Promise<CommunitySkill[]>
  onInstall: (skill: CommunitySkill) => Promise<string>
}

export function StoreView({ open, onSearch, onInstall }: StoreViewProps) {
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
    loadFeatured()
  }, [open, onSearch])

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
      <div className="shrink-0 px-6 pb-3">
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
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-6">
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
