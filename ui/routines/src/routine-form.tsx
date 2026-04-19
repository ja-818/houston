/**
 * RoutineForm — create or edit a routine.
 * Fields: name, description, prompt, schedule, suppress toggle.
 */
import { cn, Button } from "@houston-ai/core"
import { ScheduleBuilder } from "./schedule-builder"

export interface RoutineFormData {
  name: string
  description: string
  prompt: string
  schedule: string
  suppress_when_silent: boolean
}

export interface RoutineFormProps {
  /** Initial form values. */
  initial?: Partial<RoutineFormData>
  value: RoutineFormData
  onChange: (patch: Partial<RoutineFormData>) => void
  onSubmit: () => void
  onCancel: () => void
  /** "Create" or "Save" */
  submitLabel?: string
}

const inputClass = cn(
  "w-full px-3 py-2 rounded-xl border border-border bg-background",
  "text-sm text-foreground placeholder:text-muted-foreground/60",
  "focus:outline-none focus:border-border/80 transition-colors",
)

const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block"

export function RoutineForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = "Create",
}: RoutineFormProps) {
  const canSubmit = value.name.trim() && value.prompt.trim() && value.schedule.trim()

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className={labelClass}>Name</label>
        <input
          type="text"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Check email"
          className={inputClass}
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description (optional)</label>
        <input
          type="text"
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Brief description of what this routine does"
          className={inputClass}
        />
      </div>

      {/* Prompt */}
      <div>
        <label className={labelClass}>Prompt</label>
        <textarea
          value={value.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          placeholder="What should the agent do when this routine runs?"
          rows={4}
          className={cn(inputClass, "resize-none")}
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          This is sent to the agent each time the routine fires.
        </p>
      </div>

      {/* Schedule */}
      <div>
        <label className={labelClass}>Schedule</label>
        <ScheduleBuilder
          value={value.schedule}
          onChange={(schedule) => onChange({ schedule })}
        />
      </div>

      {/* Suppress toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground">Only notify when relevant</p>
          <p className="text-xs text-muted-foreground">
            Silent runs won't appear on the board.
          </p>
        </div>
        <button
          onClick={() => onChange({ suppress_when_silent: !value.suppress_when_silent })}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
            value.suppress_when_silent ? "bg-primary" : "bg-gray-300",
          )}
          role="switch"
          aria-checked={value.suppress_when_silent}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow",
              "transform transition-transform mt-0.5",
              value.suppress_when_silent ? "translate-x-4 ml-0.5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!canSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
