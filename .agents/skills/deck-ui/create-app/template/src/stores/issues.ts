import { create } from "zustand";
import { tauriIssues } from "../lib/tauri";
import type { Issue } from "../lib/types";

interface IssueState {
  issues: Issue[];
  loading: boolean;
  loadIssues: (projectId: string) => Promise<void>;
  createIssue: (projectId: string, title: string, description: string) => Promise<void>;
  updateIssueStatus: (issueId: string, status: string) => void;
}

export const useIssueStore = create<IssueState>((set, get) => ({
  issues: [],
  loading: false,

  loadIssues: async (projectId) => {
    set({ loading: true });
    const issues = await tauriIssues.list(projectId);
    set({ issues, loading: false });
  },

  createIssue: async (projectId, title, description) => {
    const issue = await tauriIssues.create(projectId, title, description);
    set((s) => ({ issues: [...s.issues, issue] }));
  },

  updateIssueStatus: (issueId, status) => {
    set((s) => ({
      issues: s.issues.map((i) =>
        i.id === issueId ? { ...i, status } : i,
      ),
    }));
  },
}));
