/** `.houston/routine_runs/routine_runs.json` */

import schema from "@houston-ai/agent-schemas/routine_runs.schema.json";
import { readAgentJson } from "./agent-file";

export interface RoutineRun {
  id: string;
  routine_id: string;
  status: "running" | "silent" | "surfaced" | "error";
  session_key: string;
  activity_id?: string;
  summary?: string;
  started_at: string;
  completed_at?: string;
}

const NAME = "routine_runs";
const s = schema as unknown as Parameters<typeof readAgentJson>[2];

export async function list(agentPath: string, routineId?: string): Promise<RoutineRun[]> {
  const runs = await readAgentJson<RoutineRun[]>(agentPath, NAME, s, []);
  return routineId ? runs.filter((r) => r.routine_id === routineId) : runs;
}
