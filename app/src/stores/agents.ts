import { create } from "zustand";
import { tauriAgents, tauriPreferences, tauriRoutines, tauriWatcher } from "../lib/tauri";
import type { Agent } from "../lib/types";

interface AgentState {
  agents: Agent[];
  current: Agent | null;
  loading: boolean;
  loadAgents: (workspaceId: string) => Promise<void>;
  setCurrent: (agent: Agent) => void;
  create: (workspaceId: string, name: string, configId: string, claudeMd?: string) => Promise<Agent>;
  delete: (workspaceId: string, id: string) => Promise<void>;
  rename: (workspaceId: string, id: string, newName: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  current: null,
  loading: false,

  loadAgents: async (workspaceId) => {
    set({ loading: true });
    try {
      const agents = await tauriAgents.list(workspaceId);
      const current = get().current;
      const selected =
        agents.find((a) => a.id === current?.id) ?? null;
      set({ agents, current: selected, loading: false });
    } catch (e) {
      console.error("[agents] Failed to load:", e);
      set({ loading: false });
    }
  },

  setCurrent: (agent) => {
    set({ current: agent });
    tauriPreferences.set("last_agent_id", agent.id);
    // Start file watcher for AI-native reactivity
    tauriWatcher.start(agent.folderPath).catch((e) =>
      console.error("[watcher] Failed to start:", e),
    );
    // Start routine scheduler for this agent
    tauriRoutines.startScheduler(agent.folderPath).catch((e) =>
      console.error("[routines] Failed to start scheduler:", e),
    );
  },

  create: async (workspaceId, name, configId, claudeMd?) => {
    const agent = await tauriAgents.create(workspaceId, name, configId, claudeMd);
    set((s) => ({
      agents: [...s.agents, agent],
      current: agent,
    }));
    tauriPreferences.set("last_agent_id", agent.id);
    // Start file watcher so agent writes (CLAUDE.md, skills) trigger query invalidation
    tauriWatcher.start(agent.folderPath).catch((e) =>
      console.error("[watcher] Failed to start:", e),
    );
    return agent;
  },

  delete: async (workspaceId, id) => {
    await tauriAgents.delete(workspaceId, id);
    set((s) => {
      const agents = s.agents.filter((a) => a.id !== id);
      const current =
        s.current?.id === id ? agents[0] ?? null : s.current;
      return { agents, current };
    });
  },

  rename: async (workspaceId, id, newName) => {
    await tauriAgents.rename(workspaceId, id, newName);
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, name: newName } : a,
      ),
      current:
        s.current?.id === id ? { ...s.current, name: newName } : s.current,
    }));
  },
}));
