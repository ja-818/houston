/**
 * StoreView — Skills.sh search and install tab for AddSkillDialog.
 * Body-only: hosted inside a fixed-size dialog shell.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { Spinner } from "@houston-ai/core"
import { Search } from "lucide-react"
import type { CommunitySkill } from "./types"
import {
  DEFAULT_STORE_VIEW_LABELS,
  type StoreViewLabels,
} from "./add-skill-dialog-store-labels"
import { StoreRow } from "./add-skill-dialog-store-row"

const SEARCH_DEBOUNCE_MS = 650

export interface StoreViewProps {
  open: boolean
  onSearch: (query: string) => Promise<CommunitySkill[]>
  onInstall: (skill: CommunitySkill) => Promise<string>
  labels?: StoreViewLabels
}

export function StoreView({ open, onSearch, onInstall, labels }: StoreViewProps) {
  const l = { ...DEFAULT_STORE_VIEW_LABELS, ...labels }
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CommunitySkill[]>([])
  const [featured, setFeatured] = useState<CommunitySkill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchError, setSearchError] = useState(false)
  const [installingIds, setInstallingIds] = useState<Set<string>>(new Set())
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const mountedRef = useRef(true)
  const loadedRef = useRef(false)
  const searchSeqRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setLoading(true)
      setSearchError(false)
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
    const requestId = searchSeqRef.current + 1
    searchSeqRef.current = requestId
    const q = query.trim()
    setSearchError(false)
    if (!q) {
      setResults([])
      setLoading(false)
      return
    }
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const skills = await onSearch(q)
        if (mountedRef.current && searchSeqRef.current === requestId) {
          setResults(skills)
        }
      } catch {
        if (mountedRef.current && searchSeqRef.current === requestId) {
          setResults([])
          setSearchError(true)
        }
      } finally {
        if (mountedRef.current && searchSeqRef.current === requestId) setLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
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
            placeholder={l.searchPlaceholder}
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

        {!loading && query.trim().length === 1 && (
          <p className="text-sm text-muted-foreground px-6 py-4 text-center">
            {l.minQuery}
          </p>
        )}

        {!loading && searchError && query.trim().length >= 2 && (
          <p className="text-sm text-muted-foreground px-6 py-4 text-center">
            {l.searchUnavailable}
          </p>
        )}

        {!loading && !searchError && visibleSkills.length === 0 && query.trim().length >= 2 && (
          <p className="text-sm text-muted-foreground px-6 py-4">
            {l.noResults(query.trim())}
          </p>
        )}

        {!loading && !searchError && visibleSkills.length === 0 && !query.trim() && (
          <p className="text-sm text-muted-foreground px-6 py-4 text-center">
            {l.typeToSearch}
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
                labels={l}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
