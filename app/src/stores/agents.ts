import { create } from "zustand";
import { tauriWorkspaces, tauriPreferences } from "../lib/tauri";
import type { Workspace } from "../lib/types";

interface WorkspaceState {
  workspaces: Workspace[];
  current: Workspace | null;
  loading: boolean;
  loadWorkspaces: (spaceId: string) => Promise<void>;
  setCurrent: (ws: Workspace) => void;
  create: (spaceId: string, name: string, experienceId: string, claudeMd?: string) => Promise<Workspace>;
  delete: (spaceId: string, id: string) => Promise<void>;
  rename: (spaceId: string, id: string, newName: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  current: null,
  loading: false,

  loadWorkspaces: async (spaceId) => {
    set({ loading: true });
    try {
      const workspaces = await tauriWorkspaces.list(spaceId);
      const current = get().current;
      const selected =
        workspaces.find((w) => w.id === current?.id) ?? null;
      set({ workspaces, current: selected, loading: false });
    } catch (e) {
      console.error("[workspaces] Failed to load:", e);
      set({ loading: false });
    }
  },

  setCurrent: (ws) => {
    set({ current: ws });
    tauriPreferences.set("last_workspace_id", ws.id);
  },

  create: async (spaceId, name, experienceId, claudeMd?) => {
    const ws = await tauriWorkspaces.create(spaceId, name, experienceId, claudeMd);
    set((s) => ({
      workspaces: [...s.workspaces, ws],
      current: ws,
    }));
    tauriPreferences.set("last_workspace_id", ws.id);
    return ws;
  },

  delete: async (spaceId, id) => {
    await tauriWorkspaces.delete(spaceId, id);
    set((s) => {
      const workspaces = s.workspaces.filter((w) => w.id !== id);
      const current =
        s.current?.id === id ? workspaces[0] ?? null : s.current;
      return { workspaces, current };
    });
  },

  rename: async (spaceId, id, newName) => {
    await tauriWorkspaces.rename(spaceId, id, newName);
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === id ? { ...w, name: newName } : w,
      ),
      current:
        s.current?.id === id ? { ...s.current, name: newName } : s.current,
    }));
  },
}));
