import { create } from "zustand";

export type ViewMode = "chat" | "context" | "skills" | "files";

interface UIState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: "chat",
  setViewMode: (viewMode) => set({ viewMode }),
}));
