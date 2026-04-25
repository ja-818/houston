/**
 * createMission — single source of truth for creating a new activity and
 * kicking off its Claude session. Used by both the desktop board-tab UI
 * and the mobile sync responder so the flow stays identical.
 */

import { tauriActivity, tauriChat } from "./tauri";
import { logger } from "./logger";

/** Build a session key for a given activity id. */
function sessionKeyForActivity(activityId: string): string {
  return `activity-${activityId}`;
}
function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Minimal Conversation shape consumed by createMission. Loosely based on
 * the legacy `@houston-ai/sync-protocol` type; kept local so the desktop
 * compiles without the deleted package.
 */
export interface Conversation {
  id: string;
  title: string;
  description?: string;
  agentName: string;
  agentColor?: string;
  status: string;
  updatedAt: string;
  agentPath: string;
}

const TITLE_MAX = 40;

/**
 * Derive an activity title from the user's message.
 * - Trims whitespace; empty input becomes "New mission".
 * - Truncates to ~40 chars on a word boundary and appends an ellipsis if
 *   the message was longer.
 */
export function autoTitleFromText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return "New mission";
  if (trimmed.length <= TITLE_MAX) return trimmed;
  const slice = trimmed.slice(0, TITLE_MAX);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${base.trimEnd()}...`;
}

export interface CreateMissionAgent {
  id: string;
  name: string;
  color?: string;
  folderPath: string;
}

export interface CreateMissionOptions {
  /** Sub-agent mode id to store with the activity row. */
  agentMode?: string;
  /** If set, a git worktree path to bind the activity to. */
  worktreePath?: string;
  /**
   * Builds the prompt actually sent to Claude, given the freshly-created
   * activity id. Defaults to returning the user's raw `text`. The board-tab
   * uses this to save attachments under `activity-{id}` and then append
   * their absolute paths to the prompt — all without changing the
   * user-visible description stored on the activity row.
   */
  buildPrompt?: (activityId: string) => Promise<string> | string;
  /** Prompt-file override forwarded to tauriChat.send (agent mode). */
  promptFile?: string;
  /** Provider override forwarded to tauriChat.send. */
  providerOverride?: string;
  /** Model override forwarded to tauriChat.send. */
  modelOverride?: string;
}

export interface CreateMissionResult {
  /** Activity id returned by the backend. */
  conversationId: string;
  /** Derived session key (`activity-{id}`). */
  sessionKey: string;
  /** Wire-ready Conversation payload for the mobile list. */
  conversation: Conversation;
}

/**
 * Create an activity under the given agent and fire off the Claude session.
 * The Claude session is fire-and-forget — errors are logged but do not
 * reject this promise, because the activity row already exists and the
 * caller has what it needs to render.
 */
export async function createMission(
  agent: CreateMissionAgent,
  text: string,
  opts: CreateMissionOptions = {},
): Promise<CreateMissionResult> {
  const title = autoTitleFromText(text);
  const description = text;

  const item = await tauriActivity.create(
    agent.folderPath,
    title,
    description,
    opts.agentMode,
    opts.worktreePath,
  );
  const conversationId = item.id;
  const sessionKey = sessionKeyForActivity(conversationId);

  const prompt = opts.buildPrompt
    ? await opts.buildPrompt(conversationId)
    : text;

  tauriChat
    .send(agent.folderPath, prompt, sessionKey, {
      mode: opts.promptFile,
      workingDirOverride: opts.worktreePath,
      providerOverride: opts.providerOverride,
      modelOverride: opts.modelOverride,
    })
    .catch((e) => {
      logger.error(`[create-mission] tauriChat.send failed: ${e}`);
    });

  const conversation: Conversation = {
    id: conversationId,
    title,
    description,
    agentName: agent.name,
    agentColor: agent.color,
    status: "running",
    updatedAt: nowIso(),
    agentPath: agent.folderPath,
  };

  return { conversationId, sessionKey, conversation };
}
