import { useRef, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { EventItem } from "./event-item"
import { EventFilter } from "./event-filter"
import { EventEmpty } from "./event-empty"
import type { EventEntry, EventType } from "./types"

export interface EventFeedProps {
  events: EventEntry[]
  loading?: boolean
  filter?: EventType | null
  onFilterChange?: (type: EventType | null) => void
  onEventClick?: (event: EventEntry) => void
  maxHeight?: string
  emptyMessage?: string
}

export function EventFeed({
  events,
  loading = false,
  filter = null,
  onFilterChange,
  onEventClick,
  maxHeight = "100%",
  emptyMessage,
}: EventFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  const checkIsAtBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 32
  }, [])

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [])

  // Track scroll position
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      isAtBottomRef.current = checkIsAtBottom()
    }

    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => el.removeEventListener("scroll", handleScroll)
  }, [checkIsAtBottom])

  // Auto-scroll when new events arrive (only if already at bottom)
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom()
    }
  }, [events.length, scrollToBottom])

  const filteredEvents = filter
    ? events.filter((e) => e.type === filter)
    : events

  const counts = events.reduce<Partial<Record<EventType, number>>>(
    (acc, e) => {
      acc[e.type] = (acc[e.type] ?? 0) + 1
      return acc
    },
    {},
  )

  return (
    <div className="flex flex-col" style={{ maxHeight }}>
      {/* Filter bar */}
      {onFilterChange && (
        <div className="shrink-0 border-b border-border">
          <EventFilter
            value={filter}
            onChange={onFilterChange}
            counts={counts}
          />
        </div>
      )}

      {/* Event list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {filteredEvents.length === 0 && !loading ? (
          <EventEmpty message={emptyMessage} />
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  <EventItem event={event} onClick={onEventClick} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
        )}
      </div>
    </div>
  )
}
