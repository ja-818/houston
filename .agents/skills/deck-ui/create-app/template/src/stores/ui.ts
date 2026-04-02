import { create } from "zustand";

export type ViewMode = "activity" | "events" | "memory" | "skills" | "routines" | "connections";

interface UIState {
  viewMode: ViewMode;
  chatOpen: boolean;
  setViewMode: (mode: ViewMode) => void;
  setChatOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: "activity",
  chatOpen: false,
  setViewMode: (viewMode) => set({ viewMode }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
}));
