import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import type {
  Workspace,
  Agent,
  SkillSummary,
  SkillDetail,
  CommunitySkillResult,
  RepoSkill,
  FileEntry,
  ChannelEntry,
  StoreListing,
  ImportedWorkspace,
} from "./types";
import { logger } from "./logger";

/**
 * Wrapper around Tauri invoke that surfaces errors as toasts.
 * NEVER fails silently — users always see what went wrong.
 */
async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await tauriInvoke<T>(cmd, args);
  } catch (err) {
    const message = typeof err === "string" ? err : String(err);
    logger.error(`[tauri:${cmd}] ${message}`, JSON.stringify(args));

    // Show toast — import dynamically to avoid circular deps
    const { useUIStore } = await import("../stores/ui");
    const { reportBug } = await import("./bug-report");
    const timestamp = new Date().toISOString();

    useUIStore.getState().addToast({
      title: `Error: ${cmd.replace(/_/g, " ")}`,
      description: message,
      action: {
        label: "Report bug",
        onClick: () => {
          reportBug({
            command: cmd,
            error: message,
            timestamp,
            appVersion: __APP_VERSION__,
          }).catch((e) => console.error("Failed to report bug:", e));
        },
      },
    });

    throw err;
  }
}

export const tauriWorkspaces = {
  list: () => invoke<Workspace[]>("list_workspaces"),
  create: (name: string, provider?: string, model?: string) =>
    invoke<Workspace>("create_workspace", { name, provider: provider ?? null, model: model ?? null }),
  delete: (id: string) =>
    invoke<void>("delete_workspace", { id }),
  rename: (id: string, newName: string) =>
    invoke<void>("rename_workspace", { id, new_name: newName }),
  updateProvider: (id: string, provider: string, model?: string) =>
    invoke<Workspace>("update_workspace_provider", { id, provider, model: model ?? null }),
};

export interface CreateAgentResult {
  agent: Agent;
  onboardingActivityId: string | null;
}

export const tauriAgents = {
  list: (workspaceId: string) =>
    invoke<Agent[]>("list_agents", { workspace_id: workspaceId }),
  create: (workspaceId: string, name: string, configId: string, color?: string, claudeMd?: string, installedPath?: string, seeds?: Record<string, string>, existingPath?: string) =>
    invoke<CreateAgentResult>("create_agent", { workspace_id: workspaceId, name, config_id: configId, color, claude_md: claudeMd, installed_path: installedPath, seeds, existing_path: existingPath ?? null }),
  pickDirectory: () =>
    invoke<string | null>("pick_directory"),
  delete: (workspaceId: string, id: string) =>
    invoke<void>("delete_agent", { workspace_id: workspaceId, id }),
  rename: (workspaceId: string, id: string, newName: string) =>
    invoke<void>("rename_agent", { workspace_id: workspaceId, id, new_name: newName }),
};

export const tauriChat = {
  send: (
    agentPath: string,
    prompt: string,
    sessionKey: string,
    opts?: {
      mode?: string;
      promptFile?: string;
      workingDirOverride?: string;
      providerOverride?: string;
      modelOverride?: string;
    },
  ) =>
    invoke<string>("send_message", {
      agent_path: agentPath,
      prompt,
      session_key: sessionKey,
      mode: opts?.mode ?? null,
      working_dir_override: opts?.workingDirOverride ?? null,
      provider_override: opts?.providerOverride ?? null,
      model_override: opts?.modelOverride ?? null,
    }),
  startOnboarding: (agentPath: string, sessionKey: string) =>
    invoke<void>("start_onboarding_session", { agent_path: agentPath, session_key: sessionKey }),
  stop: (agentPath: string, sessionKey: string) =>
    invoke<void>("stop_session", { agent_path: agentPath, session_key: sessionKey }),
  loadHistory: (agentPath: string, sessionKey: string) =>
    invoke<Array<{ feed_type: string; data: unknown }>>(
      "load_chat_history",
      { agent_path: agentPath, session_key: sessionKey },
    ),
  summarize: (message: string) =>
    invoke<{ title: string; description: string }>("summarize_activity", { message }),
};

/**
 * Composer attachments — persisted under <app cache>/houston/attachments/<scope_id>/.
 * Files survive app restarts and are deleted when their owning activity/agent
 * is deleted. Claude reads them via its Read tool from the absolute paths
 * returned by `save`.
 */
async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // Chunked encoding to avoid call-stack overflow on large files.
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return btoa(binary);
}

export const tauriAttachments = {
  /** Save files for `scopeId`, returns the absolute paths Claude can Read. */
  save: async (scopeId: string, files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    const payload = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        data_base64: await fileToBase64(f),
      })),
    );
    return invoke<string[]>("save_attachments", {
      scope_id: scopeId,
      files: payload,
    });
  },
  /** Delete all attachments for `scopeId`. Idempotent. */
  delete: (scopeId: string) =>
    invoke<void>("delete_attachments", { scope_id: scopeId }),
};

/**
 * Format a prompt with attachment paths appended in a block Claude can parse.
 * Returns the original text unchanged if there are no paths.
 */
export function withAttachmentPaths(text: string, paths: string[]): string {
  if (paths.length === 0) return text;
  const list = paths.map((p) => `- ${p}`).join("\n");
  const block = `[User attached these files. Read them with the Read tool if needed:\n${list}]`;
  return text.length > 0 ? `${text}\n\n${block}` : block;
}

export const tauriAgent = {
  readFile: (agentPath: string, name: string) =>
    invoke<string>("read_agent_file", { agent_path: agentPath, name }),
  writeFile: (agentPath: string, name: string, content: string) =>
    invoke<void>("write_agent_file", { agent_path: agentPath, name, content }),
};

export const tauriSkills = {
  list: (agentPath: string) =>
    invoke<SkillSummary[]>("list_skills", { workspace_path: agentPath }),
  load: (agentPath: string, name: string) =>
    invoke<SkillDetail>("load_skill", { workspace_path: agentPath, name }),
  create: (
    agentPath: string,
    name: string,
    description: string,
    content: string,
  ) => invoke<void>("create_skill", { workspace_path: agentPath, name, description, content }),
  delete: (agentPath: string, name: string) =>
    invoke<void>("delete_skill", { workspace_path: agentPath, name }),
  save: (agentPath: string, name: string, content: string) =>
    invoke<void>("save_skill", { workspace_path: agentPath, name, content }),
  listFromRepo: (source: string) =>
    invoke<RepoSkill[]>("list_skills_from_repo", { source }),
  installFromRepo: (agentPath: string, source: string, skills: RepoSkill[]) =>
    invoke<string[]>("install_skills_from_repo", { workspace_path: agentPath, source, skills }),
  searchCommunity: (query: string) =>
    invoke<CommunitySkillResult[]>("search_community_skills", { query }),
  installCommunity: (agentPath: string, source: string, skillId: string) =>
    invoke<string>("install_community_skill", { workspace_path: agentPath, source, skill_id: skillId }),
};

export interface ComposioAppEntry {
  toolkit: string;
  name: string;
  description: string;
  logo_url: string;
  categories: string[];
}

/**
 * Composio integration state as reported by Houston's CLI-backed backend.
 * Matches the `ComposioStatus` enum in `crates/houston-tauri/src/composio_cli.rs`.
 */
export type ComposioStatus =
  | { status: "not_installed" }
  | { status: "needs_auth" }
  | { status: "error"; message: string }
  | { status: "ok"; email: string | null; org_name: string | null };

/** Async login start: opens a URL for the user to approve in the browser. */
export interface StartLoginResponse {
  login_url: string;
  cli_key: string;
}

/** Async app-link start: URL the user opens to authorize an app (Gmail, etc). */
export interface StartLinkResponse {
  redirect_url: string;
  connected_account_id: string;
  toolkit: string;
}

export const tauriConnections = {
  list: () => invoke<ComposioStatus>("list_composio_connections"),
  listApps: () => invoke<ComposioAppEntry[]>("list_composio_apps"),
  listConnectedToolkits: () =>
    invoke<string[]>("list_composio_connected_toolkits"),
  connectApp: (toolkit: string) =>
    invoke<StartLinkResponse>("connect_composio_app", { toolkit }),
  startOAuth: () => invoke<StartLoginResponse>("start_composio_oauth"),
  completeLogin: (cliKey: string) =>
    invoke<void>("complete_composio_login", { cli_key: cliKey }),
  isCliInstalled: () => invoke<boolean>("is_composio_cli_installed"),
  installCli: () => invoke<void>("install_composio_cli"),
};

export const tauriChannels = {
  list: (agentPath: string) =>
    invoke<ChannelEntry[]>("list_channels_config", { agent_path: agentPath }),
  add: (
    agentPath: string,
    input: { channel_type: string; name: string; token: string },
  ) => invoke<ChannelEntry>("add_channel_config", { agent_path: agentPath, input }),
  remove: (agentPath: string, channelId: string) =>
    invoke<void>("remove_channel_config", { agent_path: agentPath, channel_id: channelId }),
};

export const tauriFiles = {
  list: (agentPath: string) =>
    invoke<FileEntry[]>("list_project_files", { agent_path: agentPath }),
  open: (agentPath: string, relativePath: string) =>
    invoke<void>("open_file", { agent_path: agentPath, relative_path: relativePath }),
  reveal: (agentPath: string, relativePath: string) =>
    invoke<void>("reveal_file", { agent_path: agentPath, relative_path: relativePath }),
  delete: (agentPath: string, relativePath: string) =>
    invoke<void>("delete_file", { agent_path: agentPath, relative_path: relativePath }),
  rename: (agentPath: string, relativePath: string, newName: string) =>
    invoke<void>("rename_file", { agent_path: agentPath, relative_path: relativePath, new_name: newName }),
  createFolder: (agentPath: string, name: string) =>
    invoke<void>("create_agent_folder", { agent_path: agentPath, folder_name: name }),
  revealAgent: (agentPath: string) =>
    invoke<void>("reveal_agent", { agent_path: agentPath }),
};

export const tauriStore = {
  listInstalled: () =>
    invoke<Array<{ config: unknown; path: string }>>(
      "list_installed_configs",
    ),
  fetchCatalog: () =>
    invoke<StoreListing[]>("fetch_store_catalog"),
  search: (query: string) =>
    invoke<StoreListing[]>("search_store", { query }),
  install: (repo: string, agentId: string) =>
    invoke<void>("install_store_agent", { repo, agent_id: agentId }),
  uninstall: (agentId: string) =>
    invoke<void>("uninstall_store_agent", { agent_id: agentId }),
  /** Install an agent directly from a GitHub URL or "owner/repo" shorthand. */
  installFromGithub: (githubUrl: string) =>
    invoke<string>("install_agent_from_github", { github_url: githubUrl }),
  /** Check all installed agents for updates from their GitHub source. Returns list of repos that were updated. */
  checkUpdates: () =>
    invoke<string[]>("check_agent_updates"),
  /** Import a workspace template from GitHub. Creates workspace + all agent instances. */
  installWorkspaceFromGithub: (githubUrl: string) =>
    invoke<ImportedWorkspace>("install_workspace_from_github", { github_url: githubUrl }),
};

interface RawConversation {
  id: string;
  title: string;
  description?: string;
  status?: string;
  type: "primary" | "activity";
  session_key: string;
  updated_at?: string;
  agent_path: string;
  agent_name: string;
}

export const tauriConversations = {
  list: (agentPath: string) =>
    invoke<RawConversation[]>("list_conversations", { agent_path: agentPath }),
  listAll: (agentPaths: string[]) =>
    invoke<RawConversation[]>("list_all_conversations", { agent_paths: agentPaths }),
};

export const tauriRoutines = {
  list: (agentPath: string) =>
    invoke<Array<{
      id: string;
      name: string;
      description: string;
      prompt: string;
      schedule: string;
      enabled: boolean;
      suppress_when_silent: boolean;
      created_at: string;
      updated_at: string;
    }>>("list_routines", { agent_path: agentPath }),
  create: (
    agentPath: string,
    input: {
      name: string;
      description?: string;
      prompt: string;
      schedule: string;
      enabled?: boolean;
      suppress_when_silent?: boolean;
    },
  ) => invoke<{ id: string }>("create_routine", { agent_path: agentPath, input }),
  update: (
    agentPath: string,
    routineId: string,
    updates: {
      name?: string;
      description?: string;
      prompt?: string;
      schedule?: string;
      enabled?: boolean;
      suppress_when_silent?: boolean;
    },
  ) => invoke<void>("update_routine", { agent_path: agentPath, routine_id: routineId, updates }),
  delete: (agentPath: string, routineId: string) =>
    invoke<void>("delete_routine", { agent_path: agentPath, routine_id: routineId }),
  listRuns: (agentPath: string, routineId?: string) =>
    invoke<Array<{
      id: string;
      routine_id: string;
      status: "running" | "silent" | "surfaced" | "error";
      session_key: string;
      activity_id?: string;
      summary?: string;
      started_at: string;
      completed_at?: string;
    }>>("list_routine_runs", { agent_path: agentPath, routine_id: routineId }),
  runNow: (agentPath: string, routineId: string) =>
    invoke<void>("run_routine_now", { agent_path: agentPath, routine_id: routineId }),
  startScheduler: (agentPath: string) =>
    invoke<void>("start_routine_scheduler", { agent_path: agentPath }),
  stopScheduler: () =>
    invoke<void>("stop_routine_scheduler"),
  syncScheduler: () =>
    invoke<void>("sync_routine_scheduler"),
};

export const tauriActivity = {
  list: (agentPath: string) =>
    invoke<Array<{
      id: string;
      title: string;
      description?: string;
      status: string;
      session_key?: string;
      agent?: string;
      worktree_path?: string;
      routine_id?: string;
      routine_run_id?: string;
      updated_at?: string;
    }>>("list_activity", { agent_path: agentPath }),
  create: (
    agentPath: string,
    title: string,
    description?: string,
    agent?: string,
    worktreePath?: string,
  ) =>
    invoke<{ id: string; title: string; status: string; agent?: string; worktree_path?: string }>(
      "create_activity",
      { agent_path: agentPath, title, description, agent, worktree_path: worktreePath },
    ),
  update: (
    agentPath: string,
    activityId: string,
    update: { status?: string; title?: string; description?: string; agent?: string; worktree_path?: string | null },
  ) => invoke<void>("update_activity", { agent_path: agentPath, activity_id: activityId, updates: update }),
  delete: (agentPath: string, activityId: string) =>
    invoke<void>("delete_activity", { agent_path: agentPath, activity_id: activityId }),
};

export const tauriWorktree = {
  create: (repoPath: string, name: string, branch?: string) =>
    invoke<{ path: string; branch: string; is_main: boolean }>(
      "create_worktree",
      { repo_path: repoPath, name, branch },
    ),
  remove: (repoPath: string, worktreePath: string) =>
    invoke<void>("remove_worktree", { repo_path: repoPath, worktree_path: worktreePath }),
  list: (repoPath: string) =>
    invoke<Array<{ path: string; branch: string; is_main: boolean }>>(
      "list_worktrees",
      { repo_path: repoPath },
    ),
};

export const tauriShell = {
  run: (path: string, command: string) =>
    invoke<string>("run_shell", { path, command }),
};

export const tauriTerminal = {
  open: (path: string, command?: string, terminalApp?: string) =>
    invoke<void>("open_terminal", {
      path,
      command: command ?? null,
      terminal_app: terminalApp ?? null,
    }),
};

export const tauriConfig = {
  read: (agentPath: string) =>
    invoke<Record<string, unknown>>("read_config", { agent_path: agentPath }),
  write: (agentPath: string, config: Record<string, unknown>) =>
    invoke<void>("write_config", { agent_path: agentPath, config }),
};

export const tauriPreferences = {
  get: (key: string) =>
    invoke<string | null>("get_preference", { key }),
  set: (key: string, value: string) =>
    invoke<void>("set_preference", { key, value }),
};

export interface ProviderStatus {
  provider: string;
  cli_installed: boolean;
  authenticated: boolean;
  cli_name: string;
}

export const tauriProvider = {
  checkStatus: (provider: string) =>
    invoke<ProviderStatus>("check_provider_status", { provider }),
  getDefault: () =>
    invoke<string>("get_default_provider"),
  setDefault: (provider: string) =>
    invoke<void>("set_default_provider", { provider }),
  launchLogin: (provider: string) =>
    invoke<void>("launch_provider_login", { provider }),
};

export const tauriSystem = {
  checkClaudeCli: () => invoke<boolean>("check_claude_cli"),
  openUrl: (url: string) => invoke<void>("open_url", { url }),
};

export interface SyncInfo {
  token: string;
  pairing_url: string;
}

export const tauriSync = {
  start: () => invoke<SyncInfo>("start_sync"),
  stop: () => invoke<void>("stop_sync"),
  status: () => invoke<SyncInfo | null>("get_sync_status"),
  send: (message: { type: string; from: string; ts: string; payload: unknown }) =>
    invoke<void>("send_sync_message", { message }),
};

export const tauriWatcher = {
  start: (agentPath: string) =>
    invoke<void>("start_agent_watcher", { agent_path: agentPath }),
  stop: () => invoke<void>("stop_agent_watcher"),
};
