import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { tauriWorkspaces } from "../lib/tauri";
import type { Workspace } from "../lib/types";

interface WorkspaceState {
  workspaces: Workspace[];
  current: Workspace | null;
  loading: boolean;
  loadWorkspaces: (orgId: string) => Promise<void>;
  setCurrent: (ws: Workspace) => void;
  create: (orgId: string, name: string, experienceId: string) => Promise<Workspace>;
  delete: (orgId: string, id: string) => Promise<void>;
  rename: (orgId: string, id: string, newName: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  current: null,
  loading: false,

  loadWorkspaces: async (orgId) => {
    set({ loading: true });
    try {
      const workspaces = await tauriWorkspaces.list(orgId);
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
    invoke("set_preference", {
      key: "last_workspace_id",
      value: ws.id,
    }).catch((e) =>
      console.error("[workspaces] Failed to save preference:", e),
    );
  },

  create: async (orgId, name, experienceId) => {
    const ws = await tauriWorkspaces.create(orgId, name, experienceId);
    set((s) => ({
      workspaces: [...s.workspaces, ws],
      current: ws,
    }));
    invoke("set_preference", {
      key: "last_workspace_id",
      value: ws.id,
    }).catch((e) =>
      console.error("[workspaces] Failed to save preference:", e),
    );
    return ws;
  },

  delete: async (orgId, id) => {
    await tauriWorkspaces.delete(orgId, id);
    set((s) => {
      const workspaces = s.workspaces.filter((w) => w.id !== id);
      const current =
        s.current?.id === id ? workspaces[0] ?? null : s.current;
      return { workspaces, current };
    });
  },

  rename: async (orgId, id, newName) => {
    await tauriWorkspaces.rename(orgId, id, newName);
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === id ? { ...w, name: newName } : w,
      ),
      current:
        s.current?.id === id ? { ...s.current, name: newName } : s.current,
    }));
  },
}));
