/** `.houston/routines/routines.json` */

import schema from "@houston-ai/agent-schemas/routines.schema.json";
import { newId, now, readAgentJson, writeAgentJson } from "./agent-file";

export interface Routine {
  id: string;
  name: string;
  description: string;
  prompt: string;
  schedule: string;
  enabled: boolean;
  suppress_when_silent: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewRoutine {
  name: string;
  description?: string;
  prompt: string;
  schedule: string;
  enabled?: boolean;
  suppress_when_silent?: boolean;
}

export interface RoutineUpdate {
  name?: string;
  description?: string;
  prompt?: string;
  schedule?: string;
  enabled?: boolean;
  suppress_when_silent?: boolean;
}

const NAME = "routines";
const s = schema as unknown as Parameters<typeof readAgentJson>[2];

export async function list(agentPath: string): Promise<Routine[]> {
  return readAgentJson<Routine[]>(agentPath, NAME, s, []);
}

export async function create(agentPath: string, input: NewRoutine): Promise<Routine> {
  const items = await list(agentPath);
  const stamp = now();
  const routine: Routine = {
    id: newId(),
    name: input.name,
    description: input.description ?? "",
    prompt: input.prompt,
    schedule: input.schedule,
    enabled: input.enabled ?? true,
    suppress_when_silent: input.suppress_when_silent ?? false,
    created_at: stamp,
    updated_at: stamp,
  };
  await writeAgentJson(agentPath, NAME, s, [...items, routine]);
  return routine;
}

export async function update(
  agentPath: string,
  id: string,
  patch: RoutineUpdate,
): Promise<Routine> {
  const items = await list(agentPath);
  const idx = items.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Routine not found: ${id}`);
  const merged: Routine = {
    ...items[idx],
    ...patch,
    updated_at: now(),
  };
  const next = [...items];
  next[idx] = merged;
  await writeAgentJson(agentPath, NAME, s, next);
  return merged;
}

export async function remove(agentPath: string, id: string): Promise<void> {
  const items = await list(agentPath);
  const next = items.filter((r) => r.id !== id);
  if (next.length === items.length) throw new Error(`Routine not found: ${id}`);
  await writeAgentJson(agentPath, NAME, s, next);
}
