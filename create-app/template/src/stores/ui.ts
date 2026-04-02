import { create } from "zustand";

export type ViewMode = "files" | "instructions";

interface UIState {
  viewMode: ViewMode;
  chatOpen: boolean;
  setViewMode: (mode: ViewMode) => void;
  setChatOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: "files",
  chatOpen: false,
  setViewMode: (viewMode) => set({ viewMode }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
}));
