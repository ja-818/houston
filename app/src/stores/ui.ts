import { create } from "zustand";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "error" | "success" | "info";
  action?: { label: string; onClick: () => void };
}

export type JobDescriptionTarget = "instructions" | "skills" | "learnings";

interface UIState {
  viewMode: string;
  assistantPanelOpen: boolean;
  activityPanelId: string | null;
  claudeAvailable: boolean | null;
  /** Provider ID that needs re-auth (e.g. "anthropic", "openai"), or null if OK */
  authRequired: string | null;
  toasts: ToastItem[];
  createAgentDialogOpen: boolean;
  /** Callback registered by the board tab to open the new-mission panel */
  onStartMission: (() => void) | null;
  /** Extra create actions registered by the board tab (e.g. "New Planning Session"). */
  boardActions: Array<{ id: string; label: string; onClick: () => void }>;
  /** Whether the mission chat panel is open (hides tab bar for full-height panel) */
  missionPanelOpen: boolean;
  jobDescriptionTarget: JobDescriptionTarget | null;
  setViewMode: (mode: string) => void;
  setAssistantPanelOpen: (open: boolean) => void;
  setActivityPanelId: (id: string | null) => void;
  setClaudeAvailable: (available: boolean | null) => void;
  setAuthRequired: (provider: string | null) => void;
  addToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
  setCreateAgentDialogOpen: (open: boolean) => void;
  setOnStartMission: (cb: (() => void) | null) => void;
  setBoardActions: (actions: Array<{ id: string; label: string; onClick: () => void }>) => void;
  setMissionPanelOpen: (open: boolean) => void;
  setJobDescriptionTarget: (target: JobDescriptionTarget | null) => void;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set) => ({
  viewMode: "chat",
  assistantPanelOpen: false,
  activityPanelId: null,
  claudeAvailable: null,
  authRequired: null,
  toasts: [],
  createAgentDialogOpen: false,
  onStartMission: null,
  boardActions: [],
  missionPanelOpen: false,
  jobDescriptionTarget: null,

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

  setCreateAgentDialogOpen: (createAgentDialogOpen) =>
    set({ createAgentDialogOpen }),

  setOnStartMission: (onStartMission) => set({ onStartMission }),
  setBoardActions: (boardActions) => set({ boardActions }),
  setMissionPanelOpen: (missionPanelOpen) => set({ missionPanelOpen }),
  setJobDescriptionTarget: (jobDescriptionTarget) => set({ jobDescriptionTarget }),
}));
