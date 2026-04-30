/**
 * CommunitySkillsSection — Search and install skills from a community marketplace.
 * Fully props-driven: host app provides search + install callbacks.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import type { CommunitySkill } from "./types"
import { CommunitySkillRow } from "./community-skill-row"
import { Search } from "lucide-react"

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 650

export interface CommunitySkillsSectionProps {
  /** Called when the user types a search query (debounced internally). */
  onSearch: (query: string) => Promise<CommunitySkill[]>
  /** Called when the user clicks install on a community skill. Should return the installed skill name. */
  onInstall: (skill: CommunitySkill) => Promise<string>
  labels?: {
    searchUnavailable?: string
  }
}

export function CommunitySkillsSection({
  onSearch,
  onInstall,
  labels,
}: CommunitySkillsSectionProps) {
  const l = {
    searchUnavailable: "Skill search is busy. Wait a moment and try again.",
    ...labels,
  }
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CommunitySkill[]>([])
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [installingIds, setInstallingIds] = useState<Set<string>>(new Set())
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const mountedRef = useRef(true)
  const searchSeqRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

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
    const timer = setTimeout(() => {
      doSearch(q, requestId)
      setShowAll(false)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const doSearch = async (q: string, requestId: number) => {
    setLoading(true)
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
  }

  const handleInstall = useCallback(
    async (skill: CommunitySkill) => {
      setInstallingIds((prev) => new Set(prev).add(skill.id))
      try {
        await onInstall(skill)
        setInstalledIds((prev) => new Set(prev).add(skill.id))
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

  const visible = showAll ? results : results.slice(0, PAGE_SIZE)
  const hasMore = results.length > PAGE_SIZE && !showAll

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium text-foreground">
          Discover actions from the community
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Browse reusable procedures on Skills.sh
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={'Search by what you want to achieve, like "sdr" or "writing"'}
          className="w-full h-9 pl-9 pr-3 rounded-full border border-border bg-background text-sm
                     placeholder:text-muted-foreground/60 focus:outline-none focus:border-border/80 transition-colors"
        />
      </div>

      {/* Results grid */}
      {loading && results.length === 0 && (
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      )}

      {!loading && searchError && query.trim().length >= 2 && (
        <p className="text-sm text-muted-foreground">
          {l.searchUnavailable}
        </p>
      )}

      {!loading && !searchError && results.length === 0 && query.trim().length >= 2 && (
        <p className="text-sm text-muted-foreground">
          No actions found for "{query.trim()}"
        </p>
      )}

      {visible.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {visible.map((skill) => (
            <CommunitySkillRow
              key={skill.id}
              skill={skill}
              installing={installingIds.has(skill.id)}
              installed={installedIds.has(skill.id)}
              onInstall={() => handleInstall(skill)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Show {results.length - PAGE_SIZE} more
        </button>
      )}
    </section>
  )
}
