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
 *     <!--houston:action {"skill":"...","fields":[...],...}-->
 *
 *     Use the X skill with these inputs:
 *     ...
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
  values: Record<string, string>,
  claudePrompt: string,
): string {
  const payload: ActionInvocation = {
    skill: skill.name,
    displayName: humanize(skill.name),
    image: skill.image,
    description: skill.description,
    integrations: skill.integrations,
    fields: skill.inputs
      .map((i) => ({
        label: i.label,
        value: (values[i.name] ?? "").trim(),
      }))
      .filter((f) => f.value.length > 0),
  };
  const json = JSON.stringify(payload);
  return `${MARKER_PREFIX}${json}${MARKER_SUFFIX}\n\n${claudePrompt}`;
}

/**
 * Build the explicit prompt sent to Claude for an action invocation.
 * Always names the skill so invocation is deterministic, and includes
 * either the author's interpolated `prompt_template` or a synthesised
 * input listing.
 */
export function buildActionClaudePrompt(
  skill: SkillSummary,
  values: Record<string, string>,
): string {
  if (skill.prompt_template) {
    const interpolated = interpolate(skill.prompt_template, values).trim();
    return `Use the ${skill.name} skill.\n\n${interpolated}`;
  }
  if (skill.inputs.length === 0) {
    return `Use the ${skill.name} skill.`;
  }
  const lines = skill.inputs.map(
    (i) => `- ${i.label}: ${(values[i.name] ?? "").trim()}`,
  );
  return [
    `Use the ${skill.name} skill with these inputs:`,
    "",
    ...lines,
  ].join("\n");
}

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_match, name) => {
    const v = values[name];
    return v != null && v.trim() !== "" ? v : `{{${name}}}`;
  });
}

function humanize(slug: string): string {
  const spaced = slug.replace(/[-_]+/g, " ").trim();
  return spaced.length === 0
    ? slug
    : spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
