/**
 * HeartbeatConfig — Form for configuring agent heartbeat check-ins.
 * Toggle, interval, prompt, active hours, and suppression token.
 */
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@deck-ui/core"
import type { HeartbeatConfig as HeartbeatConfigType } from "./types"

export interface HeartbeatConfigProps {
  config: HeartbeatConfigType
  onChange: (config: HeartbeatConfigType) => void
  loading?: boolean
}

const inputClass = cn(
  "w-full px-3 py-2 rounded-xl border border-border bg-white",
  "text-sm text-foreground placeholder:text-muted-foreground/60",
  "focus:outline-none focus:border-border/80 transition-colors",
)

const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block"

const INTERVAL_OPTIONS = [
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Every hour" },
  { value: 120, label: "Every 2 hours" },
  { value: 240, label: "Every 4 hours" },
]

export function HeartbeatConfig({
  config,
  onChange,
  loading,
}: HeartbeatConfigProps) {
  const [showActiveHours, setShowActiveHours] = useState(
    Boolean(config.activeHoursStart || config.activeHoursEnd),
  )
  const [showAdvanced, setShowAdvanced] = useState(false)

  const update = (patch: Partial<HeartbeatConfigType>) => {
    onChange({ ...config, ...patch })
  }

  return (
    <div className={cn("space-y-5", loading && "opacity-60 pointer-events-none")}>
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Heartbeat</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            The agent will check in at this interval. If nothing needs
            attention, the check-in is silently suppressed.
          </p>
        </div>
        <button
          onClick={() => update({ enabled: !config.enabled })}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
            "border-2 border-transparent cursor-pointer",
            config.enabled ? "bg-primary" : "bg-muted-foreground/20",
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm",
              "transition-transform",
              config.enabled ? "translate-x-4" : "translate-x-0",
            )}
          />
        </button>
      </div>

      {config.enabled && (
        <>
          {/* Interval */}
          <div>
            <label className={labelClass}>Check-in Interval</label>
            <select
              value={config.intervalMinutes}
              onChange={(e) => update({ intervalMinutes: Number(e.target.value) })}
              className={inputClass}
            >
              {INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Prompt */}
          <div>
            <label className={labelClass}>Heartbeat Prompt</label>
            <textarea
              value={config.prompt}
              onChange={(e) => update({ prompt: e.target.value })}
              placeholder="Check if there's anything that needs attention..."
              rows={3}
              className={cn(inputClass, "resize-none")}
            />
          </div>

          {/* Active hours (collapsible) */}
          <CollapsibleSection
            label="Active Hours"
            open={showActiveHours}
            onToggle={() => setShowActiveHours((v) => !v)}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Start</label>
                <input
                  type="time"
                  value={config.activeHoursStart ?? "09:00"}
                  onChange={(e) => update({ activeHoursStart: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End</label>
                <input
                  type="time"
                  value={config.activeHoursEnd ?? "22:00"}
                  onChange={(e) => update({ activeHoursEnd: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Advanced (collapsible) */}
          <CollapsibleSection
            label="Advanced"
            open={showAdvanced}
            onToggle={() => setShowAdvanced((v) => !v)}
          >
            <div>
              <label className={labelClass}>Suppression Token</label>
              <input
                type="text"
                value={config.suppressionToken}
                onChange={(e) => update({ suppressionToken: e.target.value })}
                placeholder="heartbeat_ok"
                className={inputClass}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                When the agent responds with this token, the check-in
                is silently suppressed.
              </p>
            </div>
          </CollapsibleSection>
        </>
      )}
    </div>
  )
}

function CollapsibleSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const Arrow = open ? ChevronDown : ChevronRight
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <Arrow className="size-3" />
        {label}
      </button>
      {open && <div className="pl-4.5">{children}</div>}
    </div>
  )
}
