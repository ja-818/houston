import { invoke } from "@tauri-apps/api/core";
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

export const tauriSpaces = {
  list: () => invoke<Space[]>("list_spaces"),
  create: (name: string) =>
    invoke<Space>("create_space", { name }),
  delete: (id: string) =>
    invoke<void>("delete_space", { id }),
  rename: (id: string, newName: string) =>
    invoke<void>("rename_space", { id, newName }),
};

export const tauriWorkspaces = {
  list: (spaceId: string) =>
    invoke<Workspace[]>("list_workspaces", { spaceId }),
  create: (spaceId: string, name: string, experienceId: string) =>
    invoke<Workspace>("create_workspace", { spaceId, name, experienceId }),
  delete: (spaceId: string, id: string) =>
    invoke<void>("delete_workspace", { spaceId, id }),
  rename: (spaceId: string, id: string, newName: string) =>
    invoke<void>("rename_workspace", { spaceId, id, newName }),
};

export const tauriChat = {
  send: (workspacePath: string, prompt: string, sessionKey?: string) =>
    invoke<string>("send_message", { workspacePath, prompt, sessionKey }),
  loadHistory: (workspacePath: string) =>
    invoke<Array<{ feed_type: string; data: unknown }>>(
      "load_chat_history",
      { workspacePath },
    ),
};

export const tauriWorkspace = {
  readFile: (workspacePath: string, name: string) =>
    invoke<string>("read_workspace_file", { workspacePath, name }),
  writeFile: (workspacePath: string, name: string, content: string) =>
    invoke<void>("write_workspace_file", { workspacePath, name, content }),
};

export const tauriSkills = {
  list: (workspacePath: string) =>
    invoke<SkillSummary[]>("list_skills", { workspacePath }),
  load: (workspacePath: string, name: string) =>
    invoke<SkillDetail>("load_skill", { workspacePath, name }),
  create: (
    workspacePath: string,
    name: string,
    description: string,
    content: string,
  ) => invoke<void>("create_skill", { workspacePath, name, description, content }),
  delete: (workspacePath: string, name: string) =>
    invoke<void>("delete_skill", { workspacePath, name }),
  save: (workspacePath: string, name: string, content: string) =>
    invoke<void>("save_skill", { workspacePath, name, content }),
  installFromRepo: (workspacePath: string, source: string) =>
    invoke<string[]>("install_skills_from_repo", { workspacePath, source }),
  searchCommunity: (query: string) =>
    invoke<CommunitySkillResult[]>("search_community_skills", { query }),
  installCommunity: (workspacePath: string, source: string, skillId: string) =>
    invoke<string>("install_community_skill", { workspacePath, source, skillId }),
};

export const tauriLearnings = {
  load: (workspacePath: string) =>
    invoke<LearningsData>("load_learnings", { workspacePath }),
  add: (workspacePath: string, text: string) =>
    invoke<void>("add_learning", { workspacePath, text }),
  replace: (workspacePath: string, index: number, text: string) =>
    invoke<void>("replace_learning", { workspacePath, index, text }),
  remove: (workspacePath: string, index: number) =>
    invoke<void>("remove_learning", { workspacePath, index }),
};

export const tauriConnections = {
  list: () => invoke<ConnectionsResult>("list_composio_connections"),
};

export const tauriChannels = {
  list: (workspacePath: string) =>
    invoke<ChannelEntry[]>("list_channels_config", { workspacePath }),
  add: (
    workspacePath: string,
    input: { channel_type: string; name: string; token: string },
  ) => invoke<ChannelEntry>("add_channel_config", { workspacePath, input }),
  remove: (workspacePath: string, channelId: string) =>
    invoke<void>("remove_channel_config", { workspacePath, channelId }),
};

export const tauriFiles = {
  list: (workspacePath: string) =>
    invoke<FileEntry[]>("list_project_files", { workspacePath }),
  open: (workspacePath: string, relativePath: string) =>
    invoke<void>("open_file", { workspacePath, relativePath }),
  reveal: (workspacePath: string, relativePath: string) =>
    invoke<void>("reveal_file", { workspacePath, relativePath }),
  delete: (workspacePath: string, relativePath: string) =>
    invoke<void>("delete_file", { workspacePath, relativePath }),
  rename: (workspacePath: string, relativePath: string, newName: string) =>
    invoke<void>("rename_file", { workspacePath, relativePath, newName }),
  createFolder: (workspacePath: string, name: string) =>
    invoke<void>("create_workspace_folder", { workspacePath, folderName: name }),
  revealWorkspace: (workspacePath: string) =>
    invoke<void>("reveal_workspace", { workspacePath }),
};

export const tauriExperiences = {
  listInstalled: () =>
    invoke<Array<{ manifest: unknown; path: string }>>(
      "list_installed_experiences",
    ),
};

export const tauriTasks = {
  list: (workspacePath: string) =>
    invoke<Array<{ id: string; title: string; description?: string; status: string }>>(
      "list_tasks",
      { workspacePath },
    ),
  create: (workspacePath: string, title: string, description?: string) =>
    invoke<{ id: string; title: string; status: string }>(
      "create_task",
      { workspacePath, title, description },
    ),
  update: (
    workspacePath: string,
    taskId: string,
    update: { status?: string; title?: string; description?: string },
  ) => invoke<void>("update_task", { workspacePath, taskId, update }),
  delete: (workspacePath: string, taskId: string) =>
    invoke<void>("delete_task", { workspacePath, taskId }),
};

export const tauriConfig = {
  read: (workspacePath: string) =>
    invoke<Record<string, unknown>>("read_config", { workspacePath }),
  write: (workspacePath: string, config: Record<string, unknown>) =>
    invoke<void>("write_config", { workspacePath, config }),
};
