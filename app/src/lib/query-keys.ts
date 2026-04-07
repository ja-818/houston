/**
 * Centralized query key factory for TanStack Query.
 *
 * Every workspace-scoped query is keyed by [resource, workspacePath].
 * This makes invalidation trivial: on an "ActivityChanged" event for path X,
 * invalidate queryKeys.activity(X).
 */
export const queryKeys = {
  // Workspace-scoped (reactive via file watcher + Tauri events)
  activity: (workspacePath: string) => ["activity", workspacePath] as const,
  skills: (workspacePath: string) => ["skills", workspacePath] as const,
  skillDetail: (workspacePath: string, name: string) =>
    ["skill-detail", workspacePath, name] as const,
  learnings: (workspacePath: string) => ["learnings", workspacePath] as const,
  channels: (workspacePath: string) => ["channels", workspacePath] as const,
  files: (workspacePath: string) => ["files", workspacePath] as const,
  contextFiles: (workspacePath: string) =>
    ["context-files", workspacePath] as const,
  config: (workspacePath: string) => ["config", workspacePath] as const,
  conversations: (workspacePath: string) =>
    ["conversations", workspacePath] as const,
  allConversations: (workspacePaths: string[]) =>
    ["all-conversations", ...workspacePaths] as const,
  chatHistory: (workspacePath: string, sessionKey: string) =>
    ["chat-history", workspacePath, sessionKey] as const,

  // App-scoped (less reactive, loaded on init)
  connections: () => ["connections"] as const,
};
