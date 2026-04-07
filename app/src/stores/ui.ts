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
  taskPanelId: string | null;
  claudeAvailable: boolean | null;
  authRequired: boolean;
  toasts: ToastItem[];
  createWorkspaceDialogOpen: boolean;
  chatDraft: string;
  /** Increments on every SessionStatus event — subscribers can reload data. */
  sessionStatusVersion: number;
  setViewMode: (mode: string) => void;
  setAssistantPanelOpen: (open: boolean) => void;
  setTaskPanelId: (id: string | null) => void;
  setClaudeAvailable: (available: boolean | null) => void;
  setAuthRequired: (required: boolean) => void;
  addToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
  setCreateWorkspaceDialogOpen: (open: boolean) => void;
  setChatDraft: (draft: string) => void;
  bumpSessionStatus: () => void;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set) => ({
  viewMode: "chat",
  assistantPanelOpen: false,
  taskPanelId: null,
  claudeAvailable: null,
  authRequired: false,
  toasts: [],
  createWorkspaceDialogOpen: false,
  chatDraft: "",
  sessionStatusVersion: 0,

  setViewMode: (viewMode) => set({ viewMode }),
  setAssistantPanelOpen: (assistantPanelOpen) => set({ assistantPanelOpen }),
  setTaskPanelId: (taskPanelId) => set({ taskPanelId }),
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
  bumpSessionStatus: () => set((s) => ({ sessionStatusVersion: s.sessionStatusVersion + 1 })),
}));
