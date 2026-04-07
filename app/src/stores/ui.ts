import { create } from "zustand";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

interface UIState {
  viewMode: string;
  assistantPanelOpen: boolean;
  activityPanelId: string | null;
  claudeAvailable: boolean | null;
  authRequired: boolean;
  toasts: ToastItem[];
  createWorkspaceDialogOpen: boolean;
  chatDraft: string;
  /** Callback registered by the board tab to open the new-mission panel */
  onStartMission: (() => void) | null;
  /** Whether the mission chat panel is open (hides tab bar for full-height panel) */
  missionPanelOpen: boolean;
  setViewMode: (mode: string) => void;
  setAssistantPanelOpen: (open: boolean) => void;
  setActivityPanelId: (id: string | null) => void;
  setClaudeAvailable: (available: boolean | null) => void;
  setAuthRequired: (required: boolean) => void;
  addToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
  setCreateWorkspaceDialogOpen: (open: boolean) => void;
  setChatDraft: (draft: string) => void;
  setOnStartMission: (cb: (() => void) | null) => void;
  setMissionPanelOpen: (open: boolean) => void;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set) => ({
  viewMode: "chat",
  assistantPanelOpen: false,
  activityPanelId: null,
  claudeAvailable: null,
  authRequired: false,
  toasts: [],
  createWorkspaceDialogOpen: false,
  chatDraft: "",
  onStartMission: null,
  missionPanelOpen: false,

  setViewMode: (viewMode) => set({ viewMode }),
  setAssistantPanelOpen: (assistantPanelOpen) => set({ assistantPanelOpen }),
  setActivityPanelId: (activityPanelId) => set({ activityPanelId }),
  setClaudeAvailable: (claudeAvailable) => set({ claudeAvailable }),
  setAuthRequired: (authRequired) => set({ authRequired }),

  addToast: (toast) =>
    set((s) => {
      const isDuplicate = s.toasts.some(
        (t) => t.title === toast.title && t.description === toast.description,
      );
      if (isDuplicate) return s;

      const id = `toast-${++toastCounter}`;
      const timeout = toast.action ? 10000 : 5000;
      setTimeout(() => {
        set((prev) => ({ toasts: prev.toasts.filter((t) => t.id !== id) }));
      }, timeout);
      return { toasts: [...s.toasts, { ...toast, id }] };
    }),

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setCreateWorkspaceDialogOpen: (createWorkspaceDialogOpen) =>
    set({ createWorkspaceDialogOpen }),

  setChatDraft: (chatDraft) => set({ chatDraft }),
  setOnStartMission: (onStartMission) => set({ onStartMission }),
  setMissionPanelOpen: (missionPanelOpen) => set({ missionPanelOpen }),
}));
