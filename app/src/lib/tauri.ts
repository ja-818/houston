/**
 * Houston backend adapter.
 *
 * Every domain call (workspaces, agents, chat, skills, store, sync, …) goes
 * through this file. When `VITE_HOUSTON_USE_ENGINE_SERVER=1` each wrapper
 * routes to `@houston-ai/engine-client` (HTTP/WS to the engine subprocess);
 * otherwise it falls back to the legacy Tauri command (via
 * [`legacyInvoke`](./os-bridge)), preserving today's desktop behaviour.
 *
 * OS-native calls (`reveal_file`, `open_url`, `pick_directory`, terminals,
 * local CLI probes, frontend log writes) do NOT flow through here — they
 * live in `./os-bridge` because the engine may run on a remote VPS.
 *
 * Phase 4 will delete the legacy branch once every desktop command has a
 * `/v1/*` counterpart and the flag flips on by default.
 */

import type {
  Workspace,
  Agent,
  SkillSummary,
  SkillDetail,
  CommunitySkillResult,
  RepoSkill,
  FileEntry,
  StoreListing,
  ImportedWorkspace,
} from "./types";
import type {
  ComposioAppEntry as EngineComposioAppEntry,
  ComposioStatus as EngineComposioStatus,
  ProviderStatus as EngineProviderStatus,
  SyncInfo as EngineSyncInfo,
  SyncMessage as EngineSyncMessage,
} from "@houston-ai/engine-client";
import { getEngine, useEngineServer } from "./engine";
import { legacyInvoke, osPickDirectory } from "./os-bridge";
import { logger } from "./logger";

/**
 * Legacy-path wrapper around Tauri invoke that surfaces errors as toasts.
 * NEVER fails silently — users always see what went wrong.
 *
 * When `useEngineServer` is on, callers bypass this entirely and hit the
 * engine client directly.
 */
async function invokeWithToast<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  try {
    return await legacyInvoke<T>(cmd, args);
  } catch (err) {
    await surfaceToast(cmd, err, args);
    throw err;
  }
}

/** Same toast/report flow as `invokeWithToast` but wraps an engine call. */
async function wrapEngineCall<T>(
  cmd: string,
  fn: () => Promise<T>,
  args?: Record<string, unknown>,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    await surfaceToast(cmd, err, args);
    throw err;
  }
}

async function surfaceToast(
  cmd: string,
  err: unknown,
  args?: Record<string, unknown>,
): Promise<void> {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : String(err);
  logger.error(`[tauri:${cmd}] ${message}`, args ? JSON.stringify(args) : undefined);
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
}

/** Dispatch a call either to the engine client or to the legacy Tauri path. */
function dual<T>(
  cmd: string,
  tauriArgs: Record<string, unknown> | undefined,
  engineFn: () => Promise<T>,
): Promise<T> {
  if (useEngineServer) {
    return wrapEngineCall(cmd, engineFn, tauriArgs);
  }
  return invokeWithToast<T>(cmd, tauriArgs);
}

// ─── Workspaces ────────────────────────────────────────────────────────

export const tauriWorkspaces = {
  list: () =>
    dual<Workspace[]>("list_workspaces", undefined, () => getEngine().listWorkspaces()),
  create: (name: string, provider?: string, model?: string) =>
    dual<Workspace>(
      "create_workspace",
      { name, provider: provider ?? null, model: model ?? null },
      () => getEngine().createWorkspace({ name, provider, model }),
    ),
  delete: (id: string) =>
    dual<void>("delete_workspace", { id }, () => getEngine().deleteWorkspace(id)),
  rename: (id: string, newName: string) =>
    dual<void>("rename_workspace", { id, new_name: newName }, async () => {
      await getEngine().renameWorkspace(id, { newName });
    }),
  updateProvider: (id: string, provider: string, model?: string) =>
    dual<Workspace>(
      "update_workspace_provider",
      { id, provider, model: model ?? null },
      () => getEngine().setWorkspaceProvider(id, { provider, model }),
    ),
};

// ─── Agents (workspace-scoped CRUD, no engine route yet) ──────────────

export interface CreateAgentResult {
  agent: Agent;
  onboardingActivityId: string | null;
}

export const tauriAgents = {
  list: (workspaceId: string) =>
    invokeWithToast<Agent[]>("list_agents", { workspace_id: workspaceId }),
  pickDirectory: () => osPickDirectory(),
  create: (
    workspaceId: string,
    name: string,
    configId: string,
    color?: string,
    claudeMd?: string,
    installedPath?: string,
    seeds?: Record<string, string>,
    existingPath?: string,
  ) =>
    invokeWithToast<CreateAgentResult>("create_agent", {
      workspace_id: workspaceId,
      name,
      config_id: configId,
      color,
      claude_md: claudeMd,
      installed_path: installedPath,
      seeds,
      existing_path: existingPath ?? null,
    }),
  delete: (workspaceId: string, id: string) =>
    invokeWithToast<void>("delete_agent", { workspace_id: workspaceId, id }),
  rename: (workspaceId: string, id: string, newName: string) =>
    invokeWithToast<void>("rename_agent", {
      workspace_id: workspaceId,
      id,
      new_name: newName,
    }),
};

// ─── Chat sessions ────────────────────────────────────────────────────

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
  ) => {
    const args = {
      agent_path: agentPath,
      prompt,
      session_key: sessionKey,
      mode: opts?.mode ?? null,
      working_dir_override: opts?.workingDirOverride ?? null,
      provider_override: opts?.providerOverride ?? null,
      model_override: opts?.modelOverride ?? null,
    };
    return dual<string>("send_message", args, async () => {
      const res = await getEngine().startSession(agentPath, {
        sessionKey,
        prompt,
        source: "desktop",
        workingDir: opts?.workingDirOverride,
        provider: opts?.providerOverride,
        model: opts?.modelOverride,
      });
      return res.sessionKey;
    });
  },
  // Onboarding needs Tauri's seed + prompt assembly — no engine route yet.
  startOnboarding: (agentPath: string, sessionKey: string) =>
    invokeWithToast<void>("start_onboarding_session", {
      agent_path: agentPath,
      session_key: sessionKey,
    }),
  stop: (agentPath: string, sessionKey: string) =>
    dual<void>(
      "stop_session",
      { agent_path: agentPath, session_key: sessionKey },
      async () => {
        await getEngine().cancelSession(agentPath, sessionKey);
      },
    ),
  // `load_chat_history` reads SQLite via the Tauri adapter — no engine route yet.
  loadHistory: (agentPath: string, sessionKey: string) =>
    invokeWithToast<Array<{ feed_type: string; data: unknown }>>("load_chat_history", {
      agent_path: agentPath,
      session_key: sessionKey,
    }),
  summarize: (message: string) =>
    invokeWithToast<{ title: string; description: string }>("summarize_activity", {
      message,
    }),
};

// ─── Composer attachments ─────────────────────────────────────────────

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
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
  save: async (scopeId: string, files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    const payload = await Promise.all(
      files.map(async (f) => ({ name: f.name, data_base64: await fileToBase64(f) })),
    );
    return dual<string[]>(
      "save_attachments",
      { scope_id: scopeId, files: payload },
      () =>
        getEngine().saveAttachments(
          scopeId,
          payload.map((p) => ({ name: p.name, dataBase64: p.data_base64 })),
        ),
    );
  },
  delete: (scopeId: string) =>
    dual<void>("delete_attachments", { scope_id: scopeId }, () =>
      getEngine().deleteAttachments(scopeId),
    ),
};

/** Format a prompt with attachment paths appended. Unchanged. */
export function withAttachmentPaths(text: string, paths: string[]): string {
  if (paths.length === 0) return text;
  const list = paths.map((p) => `- ${p}`).join("\n");
  const block = `[User attached these files. Read them with the Read tool if needed:\n${list}]`;
  return text.length > 0 ? `${text}\n\n${block}` : block;
}

// ─── Agent-data files (`.houston/**`) ─────────────────────────────────

export const tauriAgent = {
  readFile: (agentPath: string, relPath: string) =>
    dual<string>(
      "read_agent_file",
      { agent_path: agentPath, rel_path: relPath },
      () => getEngine().readAgentFile(agentPath, relPath),
    ),
  writeFile: (agentPath: string, relPath: string, content: string) =>
    dual<void>(
      "write_agent_file",
      { agent_path: agentPath, rel_path: relPath, content },
      () => getEngine().writeAgentFile(agentPath, relPath, content),
    ),
  seedSchemas: (agentPath: string) =>
    dual<void>("seed_agent_schemas", { agent_path: agentPath }, () =>
      getEngine().seedAgentSchemas(agentPath),
    ),
  migrateFiles: (agentPath: string) =>
    dual<void>("migrate_agent_files", { agent_path: agentPath }, () =>
      getEngine().migrateAgentFiles(agentPath),
    ),
};

// ─── Skills ───────────────────────────────────────────────────────────

export const tauriSkills = {
  list: (agentPath: string) =>
    dual<SkillSummary[]>(
      "list_skills",
      { workspace_path: agentPath },
      async () =>
        (await getEngine().listSkills(agentPath)).map((s) => ({
          name: s.name,
          description: s.description,
          version: s.version,
          tags: s.tags,
          created: s.created,
          last_used: s.lastUsed,
        })),
    ),
  load: (agentPath: string, name: string) =>
    dual<SkillDetail>(
      "load_skill",
      { workspace_path: agentPath, name },
      () => getEngine().loadSkill(agentPath, name),
    ),
  create: (agentPath: string, name: string, description: string, content: string) =>
    dual<void>(
      "create_skill",
      { workspace_path: agentPath, name, description, content },
      () =>
        getEngine().createSkill({
          workspacePath: agentPath,
          name,
          description,
          content,
        }),
    ),
  delete: (agentPath: string, name: string) =>
    dual<void>(
      "delete_skill",
      { workspace_path: agentPath, name },
      () => getEngine().deleteSkill(agentPath, name),
    ),
  save: (agentPath: string, name: string, content: string) =>
    dual<void>(
      "save_skill",
      { workspace_path: agentPath, name, content },
      () => getEngine().saveSkill(name, { workspacePath: agentPath, content }),
    ),
  listFromRepo: (source: string) =>
    dual<RepoSkill[]>(
      "list_skills_from_repo",
      { source },
      () => getEngine().listSkillsFromRepo(source),
    ),
  installFromRepo: (agentPath: string, source: string, skills: RepoSkill[]) =>
    dual<string[]>(
      "install_skills_from_repo",
      { workspace_path: agentPath, source, skills },
      () =>
        getEngine().installSkillsFromRepo({
          workspacePath: agentPath,
          source,
          skills,
        }),
    ),
  searchCommunity: (query: string) =>
    dual<CommunitySkillResult[]>(
      "search_community_skills",
      { query },
      async () =>
        (await getEngine().searchCommunitySkills(query)).map((s) => ({
          id: s.id,
          skillId: s.skillId,
          name: s.name,
          installs: s.installs,
          source: s.source,
        })),
    ),
  installCommunity: (agentPath: string, source: string, skillId: string) =>
    dual<string>(
      "install_community_skill",
      { workspace_path: agentPath, source, skill_id: skillId },
      () =>
        getEngine().installCommunitySkill({
          workspacePath: agentPath,
          source,
          skillId,
        }),
    ),
};

// ─── Composio ─────────────────────────────────────────────────────────

export interface ComposioAppEntry {
  toolkit: string;
  name: string;
  description: string;
  logo_url: string;
  categories: string[];
}

export type ComposioStatus = EngineComposioStatus;

export interface StartLoginResponse {
  login_url: string;
  cli_key: string;
}

export interface StartLinkResponse {
  redirect_url: string;
  connected_account_id: string;
  toolkit: string;
}

export const tauriConnections = {
  list: () =>
    dual<ComposioStatus>("list_composio_connections", undefined, () =>
      getEngine().composioStatus(),
    ),
  listApps: () =>
    dual<ComposioAppEntry[]>("list_composio_apps", undefined, async () =>
      (await getEngine().composioListApps()).map((a: EngineComposioAppEntry) => ({
        toolkit: a.toolkit,
        name: a.name,
        description: a.description,
        logo_url: a.logo_url,
        categories: a.categories,
      })),
    ),
  listConnectedToolkits: () =>
    dual<string[]>("list_composio_connected_toolkits", undefined, () =>
      getEngine().composioListConnections(),
    ),
  connectApp: (toolkit: string) =>
    dual<StartLinkResponse>("connect_composio_app", { toolkit }, async () => {
      const r = await getEngine().composioConnectApp(toolkit);
      return {
        redirect_url: r.redirect_url,
        connected_account_id: r.connected_account_id,
        toolkit: r.toolkit,
      } satisfies StartLinkResponse as StartLinkResponse;
    }),
  startOAuth: () =>
    dual<StartLoginResponse>("start_composio_oauth", undefined, async () => {
      const r = await getEngine().composioStartLogin();
      return { login_url: r.login_url, cli_key: r.cli_key };
    }),
  completeLogin: (cliKey: string) =>
    dual<void>(
      "complete_composio_login",
      { cli_key: cliKey },
      () => getEngine().composioCompleteLogin(cliKey),
    ),
  isCliInstalled: () =>
    dual<boolean>("is_composio_cli_installed", undefined, () =>
      getEngine().composioCliInstalled(),
    ),
  installCli: () =>
    dual<void>("install_composio_cli", undefined, () =>
      getEngine().composioInstallCli(),
    ),
};

// ─── Project files (browser) ──────────────────────────────────────────
//
// OS-native file operations live in `./os-bridge`. Here: only the
// engine-eligible list + rename + delete + folder-create + reveal-free
// wrappers.

import {
  osOpenFile,
  osRevealAgent,
  osRevealFile,
} from "./os-bridge";

export const tauriFiles = {
  list: (agentPath: string) =>
    dual<FileEntry[]>(
      "list_project_files",
      { agent_path: agentPath },
      async () =>
        (await getEngine().listProjectFiles(agentPath)).map((f) => ({
          path: f.path,
          name: f.name,
          extension: f.extension,
          size: f.size,
        })),
    ),
  open: (agentPath: string, relativePath: string) =>
    osOpenFile(agentPath, relativePath),
  reveal: (agentPath: string, relativePath: string) =>
    osRevealFile(agentPath, relativePath),
  delete: (agentPath: string, relativePath: string) =>
    dual<void>(
      "delete_file",
      { agent_path: agentPath, relative_path: relativePath },
      () => getEngine().deleteFile(agentPath, relativePath),
    ),
  rename: (agentPath: string, relativePath: string, newName: string) =>
    dual<void>(
      "rename_file",
      { agent_path: agentPath, relative_path: relativePath, new_name: newName },
      () => getEngine().renameFile(agentPath, relativePath, newName),
    ),
  createFolder: (agentPath: string, name: string) =>
    dual<void>(
      "create_agent_folder",
      { agent_path: agentPath, folder_name: name },
      async () => {
        await getEngine().createFolder(agentPath, name);
      },
    ),
  revealAgent: (agentPath: string) => osRevealAgent(agentPath),
};

// ─── Store ────────────────────────────────────────────────────────────

export const tauriStore = {
  listInstalled: () =>
    dual<Array<{ config: unknown; path: string }>>(
      "list_installed_configs",
      undefined,
      () => getEngine().listInstalledConfigs(),
    ),
  fetchCatalog: () =>
    dual<StoreListing[]>("fetch_store_catalog", undefined, () =>
      getEngine().storeCatalog(),
    ),
  search: (query: string) =>
    dual<StoreListing[]>("search_store", { query }, () => getEngine().storeSearch(query)),
  install: (repo: string, agentId: string) =>
    dual<void>(
      "install_store_agent",
      { repo, agent_id: agentId },
      () => getEngine().installStoreAgent({ repo, agentId }),
    ),
  uninstall: (agentId: string) =>
    dual<void>(
      "uninstall_store_agent",
      { agent_id: agentId },
      () => getEngine().uninstallStoreAgent(agentId),
    ),
  installFromGithub: (githubUrl: string) =>
    dual<string>(
      "install_agent_from_github",
      { github_url: githubUrl },
      async () => (await getEngine().installAgentFromGithub({ githubUrl })).agentId,
    ),
  checkUpdates: () =>
    dual<string[]>("check_agent_updates", undefined, () =>
      getEngine().checkAgentUpdates(),
    ),
  installWorkspaceFromGithub: (githubUrl: string) =>
    dual<ImportedWorkspace>(
      "install_workspace_from_github",
      { github_url: githubUrl },
      () => getEngine().installWorkspaceFromGithub({ githubUrl }),
    ),
};

// ─── Conversations ────────────────────────────────────────────────────

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
    dual<RawConversation[]>(
      "list_conversations",
      { agent_path: agentPath },
      async () =>
        (await getEngine().listConversations(agentPath)).map(conversationToRaw),
    ),
  listAll: (agentPaths: string[]) =>
    dual<RawConversation[]>(
      "list_all_conversations",
      { agent_paths: agentPaths },
      async () =>
        (await getEngine().listAllConversations(agentPaths)).map(conversationToRaw),
    ),
};

function conversationToRaw(
  c: import("@houston-ai/engine-client").ConversationEntry,
): RawConversation {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status,
    type: c.type as "primary" | "activity",
    session_key: c.session_key,
    updated_at: c.updated_at,
    agent_path: c.agent_path,
    agent_name: c.agent_name,
  };
}

// ─── Routines (agent data + scheduler passthrough) ────────────────────

import * as activityData from "../data/activity";
import * as routinesData from "../data/routines";
import * as routineRunsData from "../data/routine-runs";
import * as configData from "../data/config";

export const tauriRoutines = {
  list: (agentPath: string) => routinesData.list(agentPath),
  create: (agentPath: string, input: routinesData.NewRoutine) =>
    routinesData.create(agentPath, input),
  update: (
    agentPath: string,
    routineId: string,
    updates: routinesData.RoutineUpdate,
  ) => routinesData.update(agentPath, routineId, updates),
  delete: (agentPath: string, routineId: string) =>
    routinesData.remove(agentPath, routineId),
  listRuns: (agentPath: string, routineId?: string) =>
    routineRunsData.list(agentPath, routineId),
  runNow: (agentPath: string, routineId: string) =>
    invokeWithToast<void>("run_routine_now", {
      agent_path: agentPath,
      routine_id: routineId,
    }),
  startScheduler: (agentPath: string) =>
    invokeWithToast<void>("start_routine_scheduler", { agent_path: agentPath }),
  stopScheduler: () => invokeWithToast<void>("stop_routine_scheduler"),
  syncScheduler: () => invokeWithToast<void>("sync_routine_scheduler"),
};

export const tauriActivity = {
  list: (agentPath: string) => activityData.list(agentPath),
  create: (
    agentPath: string,
    title: string,
    description?: string,
    agent?: string,
    worktreePath?: string,
  ) => activityData.create(agentPath, title, description ?? "", agent, worktreePath),
  update: (
    agentPath: string,
    activityId: string,
    update: activityData.ActivityUpdate,
  ) => activityData.update(agentPath, activityId, update).then(() => undefined),
  delete: (agentPath: string, activityId: string) =>
    activityData.remove(agentPath, activityId),
};

// ─── Worktrees & shell ────────────────────────────────────────────────

export const tauriWorktree = {
  create: (repoPath: string, name: string, branch?: string) =>
    dual<{ path: string; branch: string; is_main: boolean }>(
      "create_worktree",
      { repo_path: repoPath, name, branch },
      async () => {
        const w = await getEngine().createWorktree({ repoPath, name, branch });
        return { path: w.path, branch: w.branch, is_main: w.isMain };
      },
    ),
  remove: (repoPath: string, worktreePath: string) =>
    dual<void>(
      "remove_worktree",
      { repo_path: repoPath, worktree_path: worktreePath },
      () => getEngine().removeWorktree({ repoPath, worktreePath }),
    ),
  list: (repoPath: string) =>
    dual<Array<{ path: string; branch: string; is_main: boolean }>>(
      "list_worktrees",
      { repo_path: repoPath },
      async () =>
        (await getEngine().listWorktrees({ repoPath })).map((w) => ({
          path: w.path,
          branch: w.branch,
          is_main: w.isMain,
        })),
    ),
};

export const tauriShell = {
  run: (path: string, command: string) =>
    dual<string>("run_shell", { path, command }, () =>
      getEngine().runShell({ path, command }),
    ),
};

// Terminal launching is OS-native — see `./os-bridge::osOpenTerminal`.
// Keep the `tauriTerminal` export for callers that haven't migrated.
import { osOpenTerminal } from "./os-bridge";
export const tauriTerminal = {
  open: (path: string, command?: string, terminalApp?: string) =>
    osOpenTerminal(path, command, terminalApp),
};

// ─── Agent config (per-agent JSON on disk) ────────────────────────────

export const tauriConfig = {
  read: (agentPath: string) => configData.read(agentPath),
  write: (agentPath: string, config: configData.Config) =>
    configData.write(agentPath, config),
};

// ─── Preferences ──────────────────────────────────────────────────────

export const tauriPreferences = {
  get: (key: string) =>
    dual<string | null>("get_preference", { key }, () => getEngine().getPreference(key)),
  set: (key: string, value: string) =>
    dual<void>("set_preference", { key, value }, () => getEngine().setPreference(key, value)),
};

// ─── Providers ────────────────────────────────────────────────────────

export interface ProviderStatus {
  provider: string;
  cli_installed: boolean;
  authenticated: boolean;
  cli_name: string;
}

const DEFAULT_PROVIDER_PREF_KEY = "default_provider";

export const tauriProvider = {
  checkStatus: (provider: string) =>
    dual<ProviderStatus>(
      "check_provider_status",
      { provider },
      async () => {
        const p: EngineProviderStatus = await getEngine().providerStatus(provider);
        return {
          provider: p.provider,
          cli_installed: p.cliInstalled,
          authenticated: p.authenticated,
          cli_name: p.cliName,
        };
      },
    ),
  getDefault: () =>
    dual<string>("get_default_provider", undefined, async () =>
      (await getEngine().getPreference(DEFAULT_PROVIDER_PREF_KEY)) ?? "",
    ),
  setDefault: (provider: string) =>
    dual<void>("set_default_provider", { provider }, () =>
      getEngine().setPreference(DEFAULT_PROVIDER_PREF_KEY, provider),
    ),
  launchLogin: (provider: string) =>
    dual<void>("launch_provider_login", { provider }, () =>
      getEngine().providerLogin(provider),
    ),
};

// ─── System (OS-native helpers, preserved for back-compat) ────────────

import { osCheckClaudeCli, osOpenUrl } from "./os-bridge";
export const tauriSystem = {
  checkClaudeCli: () => osCheckClaudeCli(),
  openUrl: (url: string) => osOpenUrl(url),
};

// ─── Mobile sync ──────────────────────────────────────────────────────

export interface SyncInfo {
  token: string;
  pairing_url: string;
}

function toLegacySyncInfo(info: EngineSyncInfo | null): SyncInfo | null {
  if (!info) return null;
  return { token: info.token, pairing_url: info.pairingUrl };
}

export const tauriSync = {
  start: () =>
    dual<SyncInfo>("start_sync", undefined, async () =>
      toLegacySyncInfo(await getEngine().startSync()) as SyncInfo,
    ),
  stop: () => dual<void>("stop_sync", undefined, () => getEngine().stopSync()),
  status: () =>
    dual<SyncInfo | null>("get_sync_status", undefined, async () =>
      toLegacySyncInfo(await getEngine().syncStatus()),
    ),
  send: (message: EngineSyncMessage) =>
    dual<void>("send_sync_message", { message }, () =>
      getEngine().sendSyncMessage(message),
    ),
};

// ─── Agent file watcher (no engine route yet) ─────────────────────────

export const tauriWatcher = {
  start: (agentPath: string) =>
    invokeWithToast<void>("start_agent_watcher", { agent_path: agentPath }),
  stop: () => invokeWithToast<void>("stop_agent_watcher"),
};
