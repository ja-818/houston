/**
 * RoutineDetailPage — Full-page detail view for a single routine.
 * Shows editable fields, action buttons, and run history below.
 * All data and actions provided via props (no Zustand, no Tauri).
 */
import { useCallback, useEffect, useState } from "react"
import type { Routine, RoutineRun, Skill } from "./types"
import type { RoutineFormState } from "./routine-edit-form"
import { RoutineEditForm } from "./routine-edit-form"
import { RoutineDetailActions } from "./routine-detail-actions"
import { RunHistory } from "./routine-run-history"
import { ArrowLeft } from "lucide-react"

export interface RoutineDetailPageProps {
  routine: Routine | undefined
  runs: RoutineRun[]
  skills: Skill[]
  onBack: () => void
  onSave: (form: RoutineFormState) => Promise<void>
  onRunNow: () => Promise<void>
  onToggle: () => Promise<void>
  onDelete: () => Promise<void>
  onSelectRun: (runId: string) => void
}

export function RoutineDetailPage({
  routine,
  runs,
  skills,
  onBack,
  onSave,
  onRunNow,
  onToggle,
  onDelete,
  onSelectRun,
}: RoutineDetailPageProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<RoutineFormState | null>(null)

  // Initialize form from routine
  useEffect(() => {
    if (routine) {
      setForm({
        name: routine.name,
        description: routine.description,
        context: routine.context,
        triggerType: routine.trigger_type as RoutineFormState["triggerType"],
        approvalMode: routine.approval_mode as RoutineFormState["approvalMode"],
        skillId: routine.skill_id,
      })
    }
  }, [routine?.id]) // Only reset on routine change, not every re-render

  const handleChange = useCallback((patch: Partial<RoutineFormState>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : null))
  }, [])

  const handleSave = useCallback(async () => {
    if (!form) return
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }, [form, onSave])

  if (!routine || !form) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Routine not found</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-3 border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="text-sm font-medium text-foreground truncate flex-1">
            {form.name || "Untitled"}
          </h1>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <RoutineEditForm form={form} skills={skills} onChange={handleChange} />

          <RoutineDetailActions
            isActive={routine.status === "active"}
            saving={saving}
            onSave={handleSave}
            onToggle={onToggle}
            onRunNow={onRunNow}
            onDelete={onDelete}
          />

          <RunHistory runs={runs} onSelectRun={onSelectRun} />
        </div>
      </div>
    </div>
  )
}
