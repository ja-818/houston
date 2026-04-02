import { create } from "zustand";
import { tauriProjects } from "../lib/tauri";
import type { Project } from "../lib/types";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loadProjects: () => Promise<void>;
  selectProject: (id: string) => void;
  addProject: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,

  loadProjects: async () => {
    const projects = await tauriProjects.list();
    const current = get().currentProject;
    set({
      projects,
      currentProject: current ?? projects[0] ?? null,
    });
  },

  selectProject: (id) => {
    const project = get().projects.find((p) => p.id === id) ?? null;
    set({ currentProject: project });
  },

  addProject: async () => {
    const name = prompt("Project name:");
    if (!name) return;
    const folder = prompt("Project folder path:");
    if (!folder) return;
    const project = await tauriProjects.create(name, folder);
    set((s) => ({
      projects: [...s.projects, project],
      currentProject: project,
    }));
  },
}));
