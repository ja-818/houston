import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import type { ConnectionsResult } from "@houston-ai/connections";
import type {
  Space,
  Workspace,
  SkillSummary,
  SkillDetail,
  CommunitySkillResult,
  FileEntry,
  LearningsData,
  ChannelEntry,
} from "./types";

/**
 * Wrapper around Tauri invoke that surfaces errors as toasts.
 * NEVER fails silently — users always see what went wrong.
 */
async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await tauriInvoke<T>(cmd, args);
  } catch (err) {
    const message = typeof err === "string" ? err : String(err);
    console.error(`[tauri:${cmd}] ${message}`, args);

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

export const tauriSpaces = {
  list: () => invoke<Space[]>("list_spaces"),
  create: (name: string) =>
    invoke<Space>("create_space", { name }),
  delete: (id: string) =>
    invoke<void>("delete_space", { id }),
  rename: (id: string, newName: string) =>
    invoke<void>("rename_space", { id, new_name: newName }),
};

export const tauriWorkspaces = {
  list: (spaceId: string) =>
    invoke<Workspace[]>("list_workspaces", { space_id: spaceId }),
  create: (spaceId: string, name: string, experienceId: string, claudeMd?: string) =>
    invoke<Workspace>("create_workspace", { space_id: spaceId, name, experience_id: experienceId, claude_md: claudeMd }),
  delete: (spaceId: string, id: string) =>
    invoke<void>("delete_workspace", { space_id: spaceId, id }),
  rename: (spaceId: string, id: string, newName: string) =>
    invoke<void>("rename_workspace", { space_id: spaceId, id, new_name: newName }),
};

export const tauriChat = {
  send: (workspacePath: string, prompt: string, sessionKey?: string) =>
    invoke<string>("send_message", { workspace_path: workspacePath, prompt, session_key: sessionKey }),
  loadHistory: (workspacePath: string, sessionKey?: string) =>
    invoke<Array<{ feed_type: string; data: unknown }>>(
      "load_chat_history",
      { workspace_path: workspacePath, session_key: sessionKey },
    ),
};

export const tauriWorkspace = {
  readFile: (workspacePath: string, name: string) =>
    invoke<string>("read_workspace_file", { workspace_path: workspacePath, name }),
  writeFile: (workspacePath: string, name: string, content: string) =>
    invoke<void>("write_workspace_file", { workspace_path: workspacePath, name, content }),
};

export const tauriSkills = {
  list: (workspacePath: string) =>
    invoke<SkillSummary[]>("list_skills", { workspace_path: workspacePath }),
  load: (workspacePath: string, name: string) =>
    invoke<SkillDetail>("load_skill", { workspace_path: workspacePath, name }),
  create: (
    workspacePath: string,
    name: string,
    description: string,
    content: string,
  ) => invoke<void>("create_skill", { workspace_path: workspacePath, name, description, content }),
  delete: (workspacePath: string, name: string) =>
    invoke<void>("delete_skill", { workspace_path: workspacePath, name }),
  save: (workspacePath: string, name: string, content: string) =>
    invoke<void>("save_skill", { workspace_path: workspacePath, name, content }),
  installFromRepo: (workspacePath: string, source: string) =>
    invoke<string[]>("install_skills_from_repo", { workspace_path: workspacePath, source }),
  searchCommunity: (query: string) =>
    invoke<CommunitySkillResult[]>("search_community_skills", { query }),
  installCommunity: (workspacePath: string, source: string, skillId: string) =>
    invoke<string>("install_community_skill", { workspace_path: workspacePath, source, skill_id: skillId }),
};

export const tauriLearnings = {
  load: (workspacePath: string) =>
    invoke<LearningsData>("load_learnings", { workspace_path: workspacePath }),
  add: (workspacePath: string, text: string) =>
    invoke<void>("add_learning", { workspace_path: workspacePath, text }),
  replace: (workspacePath: string, index: number, text: string) =>
    invoke<void>("replace_learning", { workspace_path: workspacePath, index, text }),
  remove: (workspacePath: string, index: number) =>
    invoke<void>("remove_learning", { workspace_path: workspacePath, index }),
};

export const tauriConnections = {
  list: () => invoke<ConnectionsResult>("list_composio_connections"),
  startOAuth: () => invoke<{ auth_url: string }>("start_composio_oauth"),
  reopenOAuth: () => invoke<void>("reopen_composio_oauth"),
  submitCallback: (callbackUrl: string) =>
    invoke<void>("submit_composio_callback", { callback_url: callbackUrl }),
};

export const tauriChannels = {
  list: (workspacePath: string) =>
    invoke<ChannelEntry[]>("list_channels_config", { workspace_path: workspacePath }),
  add: (
    workspacePath: string,
    input: { channel_type: string; name: string; token: string },
  ) => invoke<ChannelEntry>("add_channel_config", { workspace_path: workspacePath, input }),
  remove: (workspacePath: string, channelId: string) =>
    invoke<void>("remove_channel_config", { workspace_path: workspacePath, channel_id: channelId }),
};

export const tauriFiles = {
  list: (workspacePath: string) =>
    invoke<FileEntry[]>("list_project_files", { workspace_path: workspacePath }),
  open: (workspacePath: string, relativePath: string) =>
    invoke<void>("open_file", { workspace_path: workspacePath, relative_path: relativePath }),
  reveal: (workspacePath: string, relativePath: string) =>
    invoke<void>("reveal_file", { workspace_path: workspacePath, relative_path: relativePath }),
  delete: (workspacePath: string, relativePath: string) =>
    invoke<void>("delete_file", { workspace_path: workspacePath, relative_path: relativePath }),
  rename: (workspacePath: string, relativePath: string, newName: string) =>
    invoke<void>("rename_file", { workspace_path: workspacePath, relative_path: relativePath, new_name: newName }),
  createFolder: (workspacePath: string, name: string) =>
    invoke<void>("create_workspace_folder", { workspace_path: workspacePath, folder_name: name }),
  revealWorkspace: (workspacePath: string) =>
    invoke<void>("reveal_workspace", { workspace_path: workspacePath }),
};

export const tauriExperiences = {
  listInstalled: () =>
    invoke<Array<{ manifest: unknown; path: string }>>(
      "list_installed_experiences",
    ),
};

interface RawConversation {
  id: string;
  title: string;
  status?: string;
  type: "primary" | "task";
  session_key: string;
  updated_at?: string;
  workspace_path: string;
  workspace_name: string;
}

export const tauriConversations = {
  list: (workspacePath: string) =>
    invoke<RawConversation[]>("list_conversations", { workspace_path: workspacePath }),
  listAll: (workspacePaths: string[]) =>
    invoke<RawConversation[]>("list_all_conversations", { workspace_paths: workspacePaths }),
};

export const tauriTasks = {
  list: (workspacePath: string) =>
    invoke<Array<{ id: string; title: string; description?: string; status: string; updated_at?: string }>>(
      "list_tasks",
      { workspace_path: workspacePath },
    ),
  create: (workspacePath: string, title: string, description?: string) =>
    invoke<{ id: string; title: string; status: string }>(
      "create_task",
      { workspace_path: workspacePath, title, description },
    ),
  update: (
    workspacePath: string,
    taskId: string,
    update: { status?: string; title?: string; description?: string },
  ) => invoke<void>("update_task", { workspace_path: workspacePath, task_id: taskId, updates: update }),
  delete: (workspacePath: string, taskId: string) =>
    invoke<void>("delete_task", { workspace_path: workspacePath, task_id: taskId }),
};

export const tauriConfig = {
  read: (workspacePath: string) =>
    invoke<Record<string, unknown>>("read_config", { workspace_path: workspacePath }),
  write: (workspacePath: string, config: Record<string, unknown>) =>
    invoke<void>("write_config", { workspace_path: workspacePath, config }),
};

export const tauriPreferences = {
  get: (key: string) =>
    invoke<string | null>("get_preference", { key }),
  set: (key: string, value: string) =>
    invoke<void>("set_preference", { key, value }),
};

export const tauriSystem = {
  checkClaudeCli: () => invoke<boolean>("check_claude_cli"),
  openUrl: (url: string) => invoke<void>("open_url", { url }),
};
