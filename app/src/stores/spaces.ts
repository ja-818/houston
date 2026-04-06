import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { tauriSpaces } from "../lib/tauri";
import type { Space } from "../lib/types";

interface SpaceState {
  spaces: Space[];
  current: Space | null;
  loading: boolean;
  loadSpaces: () => Promise<void>;
  setCurrent: (space: Space) => void;
  create: (name: string) => Promise<Space>;
  delete: (id: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
}

export const useSpaceStore = create<SpaceState>((set) => ({
  spaces: [],
  current: null,
  loading: false,

  loadSpaces: async () => {
    set({ loading: true });
    try {
      const spaces = await tauriSpaces.list();
      const current =
        spaces.find((s) => s.isDefault) ?? spaces[0] ?? null;
      set({ spaces, current, loading: false });
    } catch (e) {
      console.error("[spaces] Failed to load:", e);
      set({ loading: false });
    }
  },

  setCurrent: (space) => {
    set({ current: space });
    invoke("set_preference", {
      key: "last_space_id",
      value: space.id,
    }).catch((e) =>
      console.error("[spaces] Failed to save preference:", e),
    );
  },

  create: async (name) => {
    const space = await tauriSpaces.create(name);
    set((s) => ({
      spaces: [...s.spaces, space],
    }));
    return space;
  },

  delete: async (id) => {
    await tauriSpaces.delete(id);
    set((s) => {
      const spaces = s.spaces.filter((sp) => sp.id !== id);
      const current =
        s.current?.id === id
          ? spaces.find((sp) => sp.isDefault) ?? spaces[0] ?? null
          : s.current;
      return { spaces, current };
    });
  },

  rename: async (id, newName) => {
    await tauriSpaces.rename(id, newName);
    set((s) => ({
      spaces: s.spaces.map((sp) =>
        sp.id === id ? { ...sp, name: newName } : sp,
      ),
      current:
        s.current?.id === id ? { ...s.current, name: newName } : s.current,
    }));
  },
}));
