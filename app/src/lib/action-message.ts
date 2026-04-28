/**
 * App-side helpers for the encoded "user ran an action" chat message.
 *
 * Decoding + types are owned by `@houston-ai/chat` so the desktop and
 * mobile UIs render the same card. This file keeps the encoder and the
 * Claude-prompt assembler — pieces only the desktop needs since mobile
 * doesn't currently send actions, only display them.
 *
 * Persisted format (single line + body):
 *
 *     <!--houston:action {"skill":"...","message":"..."}-->
 *
 *     Use the X skill.
 *
 *     Optional user text.
 */

import {
  decodeActionMessage as decodeActionMessageFromChat,
  type ActionInvocation,
  type ActionInvocationField,
} from "@houston-ai/chat";
import type { SkillSummary } from "./types";

export type { ActionInvocation, ActionInvocationField };

/** Re-export so existing app callers don't need to know the new home. */
export const decodeActionMessage = decodeActionMessageFromChat;

const MARKER_PREFIX = "<!--houston:action ";
const MARKER_SUFFIX = "-->";

/**
 * Wrap an explicit Claude prompt with the action marker so the chat
 * renderer can show a card and the engine can persist a single value.
 */
export function encodeActionMessage(
  skill: SkillSummary,
  userText: string,
  claudePrompt: string,
): string {
  const trimmedText = userText.trim();
  const payload: ActionInvocation = {
    skill: skill.name,
    displayName: humanize(skill.name),
    image: skill.image,
    description: skill.description,
    integrations: skill.integrations,
    fields: [],
    message: trimmedText,
  };
  const json = JSON.stringify(payload);
  return `${MARKER_PREFIX}${json}${MARKER_SUFFIX}\n\n${claudePrompt}`;
}

/**
 * Build the explicit prompt sent to Claude for an action invocation.
 * Always names the skill so invocation is deterministic. Structured
 * inputs and prompt templates are legacy metadata and are ignored.
 */
export function buildActionClaudePrompt(
  skill: SkillSummary,
  userText: string,
): string {
  const trimmed = userText.trim();
  if (!trimmed) return `Use the ${skill.name} skill.`;
  return `Use the ${skill.name} skill.\n\n${trimmed}`;
}

function humanize(slug: string): string {
  const spaced = slug.replace(/[-_]+/g, " ").trim();
  return spaced.length === 0
    ? slug
    : spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
