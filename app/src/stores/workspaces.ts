import { create } from "zustand";
import { tauriWorkspaces, tauriPreferences } from "../lib/tauri";
import { analytics } from "../lib/analytics";
import type { Workspace } from "../lib/types";

interface WorkspaceState {
  workspaces: Workspace[];
  current: Workspace | null;
  loading: boolean;
  loadWorkspaces: () => Promise<void>;
  setCurrent: (ws: Workspace) => void;
  create: (name: string, provider?: string, model?: string) => Promise<Workspace>;
  updateProvider: (id: string, provider: string, model?: string) => Promise<void>;
  delete: (id: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  current: null,
  loading: false,

  loadWorkspaces: async () => {
    set({ loading: true });
    try {
      const workspaces = await tauriWorkspaces.list();
      const current =
        workspaces.find((w) => w.isDefault) ?? workspaces[0] ?? null;
      set({ workspaces, current, loading: false });
    } catch (e) {
      console.error("[workspaces] Failed to load:", e);
      set({ loading: false });
    }
  },

  setCurrent: (ws) => {
    set({ current: ws });
    tauriPreferences.set("last_workspace_id", ws.id);
    analytics.track("workspace_opened", { workspace_id: ws.id });
  },

  create: async (name, provider, model) => {
    const ws = await tauriWorkspaces.create(name, provider, model);
    analytics.track("workspace_created", { provider: provider ?? "none" });
    set((s) => ({
      workspaces: [...s.workspaces, ws],
    }));
    return ws;
  },

  updateProvider: async (id, provider, model) => {
    const updated = await tauriWorkspaces.updateProvider(id, provider, model);
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? updated : w)),
      current: s.current?.id === id ? updated : s.current,
    }));
  },

  delete: async (id) => {
    await tauriWorkspaces.delete(id);
    set((s) => {
      const workspaces = s.workspaces.filter((w) => w.id !== id);
      const current =
        s.current?.id === id
          ? workspaces.find((w) => w.isDefault) ?? workspaces[0] ?? null
          : s.current;
      return { workspaces, current };
    });
  },

  rename: async (id, newName) => {
    await tauriWorkspaces.rename(id, newName);
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === id ? { ...w, name: newName } : w,
      ),
      current:
        s.current?.id === id ? { ...s.current, name: newName } : s.current,
    }));
  },
}));
