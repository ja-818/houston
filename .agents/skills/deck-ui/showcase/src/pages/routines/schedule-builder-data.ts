import type { PropDef } from "../../components/props-table";

/* ── Code examples ───────────────────────────────────────────── */

export const USAGE_CODE = `import { useState } from "react"
import { ScheduleBuilder } from "@deck-ui/routines"

function MySchedule() {
  const [cron, setCron] = useState("0 9 * * *")

  return (
    <ScheduleBuilder
      value={cron}
      onChange={setCron}
    />
  )
}`;

export const CUSTOM_PRESETS_CODE = `import type { SchedulePreset } from "@deck-ui/routines"

const presets: SchedulePreset[] = [
  "daily", "weekdays", "weekly", "custom",
]

<ScheduleBuilder
  value={cron}
  onChange={setCron}
  presets={presets}
/>`;

export const PRESET_TYPE_CODE = `type SchedulePreset =
  | "every_30min"
  | "hourly"
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly"
  | "custom"`;

/* ── Props definitions ───────────────────────────────────────── */

export const SCHEDULE_PROPS: PropDef[] = [
  { name: "value", type: "string", description: "Current cron expression" },
  { name: "onChange", type: "(cronExpression: string) => void", description: "Called when the schedule changes with the new cron expression" },
  { name: "presets", type: "SchedulePreset[]", default: "all presets", description: "Which preset buttons to show. Defaults to all seven presets." },
];
