import { create } from "zustand";
import { tauriProjects } from "../lib/tauri";
import type { Project } from "../lib/types";

const DEFAULT_AGENT_NAME = "{{APP_NAME_TITLE}}";
const DOCUMENTS_BASE = "~/Documents";

interface AgentState {
  agents: Project[];
  currentAgent: Project | null;
  ready: boolean;
  init: () => Promise<void>;
  selectAgent: (id: string) => void;
  addAgent: () => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  currentAgent: null,
  ready: false,

  init: async () => {
    const projects = await tauriProjects.list();
    if (projects.length === 0) {
      const agent = await tauriProjects.create(
        DEFAULT_AGENT_NAME,
        `${DOCUMENTS_BASE}/${DEFAULT_AGENT_NAME}/`,
      );
      set({ agents: [agent], currentAgent: agent, ready: true });
      return;
    }
    set({ agents: projects, currentAgent: projects[0], ready: true });
  },

  selectAgent: (id) => {
    const agent = get().agents.find((a) => a.id === id) ?? null;
    set({ currentAgent: agent });
  },

  addAgent: async () => {
    const name = prompt("Agent name:");
    if (!name?.trim()) return;
    const agent = await tauriProjects.create(
      name.trim(),
      `${DOCUMENTS_BASE}/${name.trim()}/`,
    );
    set((s) => ({
      agents: [...s.agents, agent],
      currentAgent: agent,
    }));
  },

  deleteAgent: async (id) => {
    await tauriProjects.delete(id);
    set((s) => {
      const agents = s.agents.filter((a) => a.id !== id);
      return {
        agents,
        currentAgent:
          s.currentAgent?.id === id ? agents[0] ?? null : s.currentAgent,
      };
    });
  },
}));
