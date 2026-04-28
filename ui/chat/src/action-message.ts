/**
 * Action-invocation message marker.
 *
 * When a user runs a Houston "action" the selected action is shown
 * above the composer; the message body sent to Claude is wrapped in an
 * HTML-comment marker carrying the action's display metadata so the
 * chat renderer can show a card (instead of the raw prompt) for both
 * the live message and reloaded history.
 *
 * The marker is intentionally framework-agnostic: parsing lives in
 * `@houston-ai/chat` so any consumer (desktop app, mobile, future
 * embedded chats) can decode + render the same way without inheriting
 * the desktop's skill/agent code.
 *
 * Format (single line, rest of body is the explicit prompt Claude
 * follows):
 *
 *     <!--houston:action {"skill":"...","fields":[...],...}-->
 *
 *     Use the X skill...
 */

const MARKER_RE = /^<!--houston:action (\{[\s\S]*?\})-->\s*\n?\n?/;

export interface ActionInvocationField {
  label: string;
  value: string;
}

export interface ActionInvocation {
  /** Skill machine name (slug). */
  skill: string;
  /** Title-cased display name shown on the card. */
  displayName: string;
  /**
   * Either a full image URL or a Microsoft Fluent 3D Emoji slug. The
   * renderer is responsible for resolving slugs to URLs.
   */
  image: string | null;
  /** Optional muted description for the card. */
  description: string;
  /** Composio toolkit slugs (e.g. "gmail", "slack") for the logo row. */
  integrations: string[];
  /** Ordered field labels + values the user filled. */
  fields: ActionInvocationField[];
  /** Optional text the user typed alongside the action. */
  message: string;
}

/**
 * Try to extract an action-invocation payload from a user-message body.
 * Returns `null` when the message is plain text. Tolerant of trailing
 * whitespace.
 */
export function decodeActionMessage(body: string): ActionInvocation | null {
  const match = body.match(MARKER_RE);
  if (!match) return null;
  try {
    const payload = JSON.parse(match[1]) as ActionInvocation;
    if (typeof payload?.skill !== "string") return null;
    return {
      skill: payload.skill,
      displayName: payload.displayName ?? humanize(payload.skill),
      image: payload.image ?? null,
      description: payload.description ?? "",
      integrations: payload.integrations ?? [],
      fields: payload.fields ?? [],
      message: payload.message ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Resolve an `image` value (full URL or Fluent slug) to a renderable URL.
 * Slugs hit the jsDelivr mirror of `microsoft/fluentui-emoji@main/assets`.
 * Used by both the desktop and mobile renderers so the visual stays
 * consistent.
 */
export function resolveActionImage(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const parts = trimmed
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.toLowerCase());
  if (parts.length === 0) return null;
  const folder =
    parts[0].charAt(0).toUpperCase() +
    parts[0].slice(1) +
    (parts.length > 1 ? " " + parts.slice(1).join(" ") : "");
  const file = parts.join("_") + "_3d.png";
  return `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/${encodeURIComponent(folder)}/3D/${file}`;
}

function humanize(slug: string): string {
  const spaced = slug.replace(/[-_]+/g, " ").trim();
  return spaced.length === 0
    ? slug
    : spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
