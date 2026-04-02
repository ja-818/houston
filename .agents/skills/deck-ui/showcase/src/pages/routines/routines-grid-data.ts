import type { PropDef } from "../../components/props-table";
import type { Routine } from "@deck-ui/routines";

/* ── Sample data ─────────────────────────────────────────────── */

export const SAMPLE_ROUTINES: Routine[] = [
  {
    id: "r1",
    project_id: "p1",
    goal_id: null,
    skill_id: null,
    name: "Morning Briefing",
    description: "Summarize overnight activity and pending tasks",
    trigger_type: "scheduled",
    trigger_config: "0 9 * * *",
    status: "active",
    approval_mode: "auto_approve",
    context: "",
    run_count: 42,
    approval_count: 0,
    last_run_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "r2",
    project_id: "p1",
    goal_id: null,
    skill_id: null,
    name: "Weekly Report",
    description: "Generate team progress report every Friday",
    trigger_type: "scheduled",
    trigger_config: "0 17 * * 5",
    status: "active",
    approval_mode: "manual",
    context: "",
    run_count: 8,
    approval_count: 8,
    last_run_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "r3",
    project_id: "p1",
    goal_id: null,
    skill_id: null,
    name: "Dependency Audit",
    description: "Check for outdated or vulnerable packages",
    trigger_type: "periodic",
    trigger_config: "0 0 * * 1",
    status: "paused",
    approval_mode: "manual",
    context: "",
    run_count: 3,
    approval_count: 2,
    last_run_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "r4",
    project_id: "p1",
    goal_id: null,
    skill_id: null,
    name: "PR Review Bot",
    description: "Review open pull requests and leave comments",
    trigger_type: "periodic",
    trigger_config: "0 */2 * * *",
    status: "needs_setup",
    approval_mode: "manual",
    context: "",
    run_count: 0,
    approval_count: 0,
    last_run_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/* ── Code examples ───────────────────────────────────────────── */

export const QUICK_START_CODE = `import { RoutinesGrid } from "@deck-ui/routines"
import type { Routine } from "@deck-ui/routines"

function MyRoutines({ routines }: { routines: Routine[] }) {
  return (
    <RoutinesGrid
      routines={routines}
      onSelectRoutine={(id) => navigate(\`/routines/\${id}\`)}
    />
  )
}`;

export const ROUTINE_CARD_CODE = `import { RoutineCard } from "@deck-ui/routines"

<RoutineCard
  routine={routine}
  onClick={() => openRoutine(routine.id)}
/>`;

export const TYPES_CODE = `interface Routine {
  id: string
  project_id: string
  goal_id: string | null
  skill_id: string | null
  name: string
  description: string
  trigger_type: TriggerType  // "on_approval" | "scheduled" | "periodic" | "manual"
  trigger_config: string     // cron expression
  status: RoutineStatus      // "active" | "paused" | "needs_setup" | "error"
  approval_mode: ApprovalMode
  context: string
  run_count: number
  approval_count: number
  last_run_at: string | null
  created_at: string
  updated_at: string
}`;

/* ── Props definitions ───────────────────────────────────────── */

export const GRID_PROPS: PropDef[] = [
  { name: "routines", type: "Routine[]", description: "Array of routines to display in the grid" },
  { name: "loading", type: "boolean", default: "false", description: "Shows loading state when true and routines is empty" },
  { name: "onSelectRoutine", type: "(routineId: string) => void", description: "Called when a routine card is clicked" },
];

export const CARD_PROPS: PropDef[] = [
  { name: "routine", type: "Routine", description: "The routine data to display" },
  { name: "onClick", type: "() => void", description: "Called when the card is clicked" },
];
