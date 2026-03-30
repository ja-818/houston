/**
 * RoutineEditForm — Editable fields for a routine's details.
 * Pure presentational component: data and callbacks via props.
 */
import type { TriggerType, Skill } from "./types"
import type { RoutineFormState } from "./types"
import { cn } from "@deck-ui/core"
import { ScheduleBuilder } from "./schedule-builder"

export type { RoutineFormState }

export interface RoutineEditFormProps {
  form: RoutineFormState
  skills: Skill[]
  onChange: (patch: Partial<RoutineFormState>) => void
  /** Current trigger config (cron expression) for schedule builder */
  triggerConfig?: string
  /** Called when schedule builder changes the cron expression */
  onTriggerConfigChange?: (cronExpression: string) => void
}

const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "scheduled", label: "Scheduled" },
  { value: "periodic", label: "Periodic" },
  { value: "on_approval", label: "On Approval" },
]

const inputClass = cn(
  "w-full px-3 py-2 rounded-xl border border-border bg-white",
  "text-sm text-foreground placeholder:text-muted-foreground/60",
  "focus:outline-none focus:border-border/80 transition-colors",
)

const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block"

const SCHEDULE_TRIGGERS: TriggerType[] = ["scheduled", "periodic"]

export function RoutineEditForm({
  form,
  skills,
  onChange,
  triggerConfig,
  onTriggerConfigChange,
}: RoutineEditFormProps) {
  const showScheduleBuilder =
    SCHEDULE_TRIGGERS.includes(form.triggerType) &&
    onTriggerConfigChange !== undefined
  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className={labelClass}>Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Routine name"
          className={inputClass}
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What does this routine do?"
          rows={2}
          className={cn(inputClass, "resize-none")}
        />
      </div>

      {/* Prompt / Context */}
      <div>
        <label className={labelClass}>Prompt</label>
        <textarea
          value={form.context}
          onChange={(e) => onChange({ context: e.target.value })}
          placeholder="Instructions for the agent when running this routine..."
          rows={4}
          className={cn(inputClass, "resize-none")}
        />
      </div>

      {/* Two-column: Trigger + Skill */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Trigger</label>
          <select
            value={form.triggerType}
            onChange={(e) =>
              onChange({ triggerType: e.target.value as TriggerType })
            }
            className={inputClass}
          >
            {TRIGGER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Skill</label>
          <select
            value={form.skillId ?? ""}
            onChange={(e) =>
              onChange({ skillId: e.target.value || null })
            }
            className={inputClass}
          >
            <option value="">None</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule builder (shown for scheduled/periodic triggers) */}
      {showScheduleBuilder && (
        <div>
          <label className={labelClass}>Schedule</label>
          <ScheduleBuilder
            value={triggerConfig ?? "0 9 * * *"}
            onChange={onTriggerConfigChange!}
          />
        </div>
      )}

      {/* Approval mode */}
      <div>
        <label className={labelClass}>Approval</label>
        <div className="flex gap-2">
          {(["manual", "auto_approve"] as RoutineFormState["approvalMode"][]).map((mode) => (
            <button
              key={mode}
              onClick={() => onChange({ approvalMode: mode })}
              className={cn(
                "h-9 px-4 rounded-full text-sm font-medium transition-colors",
                form.approvalMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {mode === "manual" ? "Manual Review" : "Auto-approve"}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
