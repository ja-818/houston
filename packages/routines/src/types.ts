// Generic routine types — mirrors Houston's Routine model without Tauri/backend coupling.

export type TriggerType = "on_approval" | "scheduled" | "periodic" | "manual"
export type RoutineStatus = "active" | "paused" | "needs_setup" | "error"
export type ApprovalMode = "manual" | "auto_approve"

export type RunStatus =
  | "running"
  | "completed"
  | "failed"
  | "approved"
  | "needs_you"
  | "done"
  | "error"

export interface Routine {
  id: string
  project_id: string
  goal_id: string | null
  skill_id: string | null
  name: string
  description: string
  trigger_type: TriggerType
  trigger_config: string
  status: RoutineStatus
  approval_mode: ApprovalMode
  context: string
  run_count: number
  approval_count: number
  last_run_at: string | null
  created_at: string
  updated_at: string
}

export interface RoutineRun {
  id: string
  routine_id: string
  project_id: string
  status: RunStatus
  session_id: string | null
  claude_session_id: string | null
  output_files: string | null
  cost_usd: number | null
  duration_ms: number | null
  output_title: string | null
  output_summary: string | null
  feedback_text: string | null
  is_test_run: boolean
  created_at: string
  completed_at: string | null
  approved_at: string | null
}

export interface Skill {
  id: string
  name: string
  description: string
}

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  on_approval: "On approval",
  scheduled: "Scheduled",
  periodic: "Periodic",
  manual: "Manual",
}

/** Form state for the routine edit form */
export interface RoutineFormState {
  name: string
  description: string
  context: string
  triggerType: TriggerType
  approvalMode: ApprovalMode
  skillId: string | null
}

// --- Heartbeat & schedule types ---

export interface HeartbeatConfig {
  enabled: boolean
  intervalMinutes: number
  prompt: string
  activeHoursStart?: string
  activeHoursEnd?: string
  suppressionToken: string
}

export type SchedulePreset =
  | "every_30min"
  | "hourly"
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly"
  | "custom"

export const SCHEDULE_PRESET_LABELS: Record<SchedulePreset, string> = {
  every_30min: "Every 30 minutes",
  hourly: "Every hour",
  daily: "Daily",
  weekdays: "Weekdays only",
  weekly: "Weekly",
  monthly: "Monthly",
  custom: "Custom (cron)",
}
