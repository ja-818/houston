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
  setViewMode: (mode: string) => void;
  setAssistantPanelOpen: (open: boolean) => void;
  setTaskPanelId: (id: string | null) => void;
  setClaudeAvailable: (available: boolean | null) => void;
  setAuthRequired: (required: boolean) => void;
  addToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
  setCreateWorkspaceDialogOpen: (open: boolean) => void;
  setChatDraft: (draft: string) => void;
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

  setViewMode: (viewMode) => set({ viewMode }),
  setAssistantPanelOpen: (assistantPanelOpen) => set({ assistantPanelOpen }),
  setTaskPanelId: (taskPanelId) => set({ taskPanelId }),
  setClaudeAvailable: (claudeAvailable) => set({ claudeAvailable }),
  setAuthRequired: (authRequired) => set({ authRequired }),

  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    const timeout = toast.action ? 10000 : 5000;
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, timeout);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setCreateWorkspaceDialogOpen: (createWorkspaceDialogOpen) =>
    set({ createWorkspaceDialogOpen }),

  setChatDraft: (chatDraft) => set({ chatDraft }),
}));
