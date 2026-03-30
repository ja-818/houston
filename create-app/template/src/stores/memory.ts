import { create } from "zustand";
import type { Memory } from "@deck-ui/memory";
import { tauriMemory } from "../lib/tauri";

interface MemoryState {
  memories: Memory[];
  loading: boolean;
  loadMemories: (projectId: string) => Promise<void>;
  deleteMemory: (memoryId: string) => void;
}

export const useMemoryStore = create<MemoryState>((set) => ({
  memories: [],
  loading: false,

  loadMemories: async (projectId) => {
    set({ loading: true });
    try {
      const memories = await tauriMemory.list(projectId);
      set({ memories, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  deleteMemory: (memoryId) =>
    set((s) => ({
      memories: s.memories.filter((m) => m.id !== memoryId),
    })),
}));
