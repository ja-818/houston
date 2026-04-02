import type { PropDef } from "../../components/props-table";
import type { HeartbeatConfig } from "@deck-ui/routines";

/* ── Sample data ─────────────────────────────────────────────── */

export const DEFAULT_HEARTBEAT: HeartbeatConfig = {
  enabled: true,
  intervalMinutes: 30,
  prompt: "Check if there's anything that needs attention...",
  activeHoursStart: "09:00",
  activeHoursEnd: "22:00",
  suppressionToken: "heartbeat_ok",
};

/* ── Code examples ───────────────────────────────────────────── */

export const USAGE_CODE = `import { useState } from "react"
import { HeartbeatConfigPanel } from "@deck-ui/routines"
import type { HeartbeatConfig } from "@deck-ui/routines"

function MySettings() {
  const [heartbeat, setHeartbeat] = useState<HeartbeatConfig>({
    enabled: true,
    intervalMinutes: 30,
    prompt: "Check if there's anything that needs attention...",
    activeHoursStart: "09:00",
    activeHoursEnd: "22:00",
    suppressionToken: "heartbeat_ok",
  })

  return (
    <HeartbeatConfigPanel
      config={heartbeat}
      onChange={setHeartbeat}
    />
  )
}`;

export const HEARTBEAT_TYPE_CODE = `interface HeartbeatConfig {
  enabled: boolean
  intervalMinutes: number
  prompt: string
  activeHoursStart?: string   // "HH:MM" format
  activeHoursEnd?: string     // "HH:MM" format
  suppressionToken: string
}`;

/* ── Props definitions ───────────────────────────────────────── */

export const HEARTBEAT_PROPS: PropDef[] = [
  { name: "config", type: "HeartbeatConfig", description: "Current heartbeat configuration state" },
  { name: "onChange", type: "(config: HeartbeatConfig) => void", description: "Called when any field changes with the full updated config" },
  { name: "loading", type: "boolean", default: "false", description: "Disables all inputs and reduces opacity" },
];
