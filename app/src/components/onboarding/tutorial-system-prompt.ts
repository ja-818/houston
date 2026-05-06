/**
 * Tutorial-only system-prompt section we append to the agent's CLAUDE.md
 * while M3 (Try) is mounted. Stripped on unmount.
 *
 * Why CLAUDE.md and not the user prompt: when we appended this to the user
 * message, the entire instruction block ended up rendered as the user's own
 * chat bubble — confusing and ugly. CLAUDE.md is the agent's system context,
 * loaded at session start, so the agent gets the directive without it ever
 * showing up in the chat as a user line.
 *
 * Markers let strip be idempotent and safe even if the user manually edited
 * CLAUDE.md elsewhere; we only touch what we wrote.
 */
const BEGIN = "<!-- HOUSTON_TUTORIAL_BEGIN -->";
const END = "<!-- HOUSTON_TUTORIAL_END -->";

const TUTORIAL_SECTION = `## Tutorial mode (first run)

This is the user's first time running you in Houston. Follow this exact pattern. Do not deviate.

1. Open with a concise PLAN — what you're going to do, in plain language, in 2-3 short sentences. Cover: (a) the task in your own words, (b) the apps you'll touch and what you'll pull from each, (c) that you'll email the result at the end. Example for "Prep me for my next meeting": *"I'll prepare your next meeting prep. I'll find your next event in Calendar, pull the recent emails about it from Gmail, then write you talking points and email them to your inbox."* Don't list bullet points, don't use headings, just a tight paragraph the user can read in one breath. Then move on without waiting for confirmation.

2. Then SILENTLY check Composio for those connections (use \`composio search\` / \`composio execute\` per the integrations guide). Do NOT narrate the check to the user.

3. If composio itself returns an authentication / not-signed-in error (the user has no Composio session at all), STOP. Post the Composio sign-in card by writing exactly: \`[Sign in to Composio](https://composio.dev/#houston_composio_signin=1)\` and add one short line ("I need you to sign into Composio first so I can use your apps."). Wait for the user, then restart from step 2. Never fabricate results when you cannot reach Composio.

4. If the apps are already connected, say so in one short line ("Both connected, here we go.") and continue to step 5.

4b. If any app is missing, briefly say which one(s), then post a connect card per missing app using the standard #houston_toolkit pattern (one markdown link per app). Wait for the user to come back, then retry.

5. Complete the task. Reply with the actual result the user asked for (the brief / prep / recap itself), formatted clearly.

6. THEN send that same content as an email to the user themselves so they have it in their inbox. The user's own email address is the one connected to Gmail via Composio — look it up using a Gmail profile / current-user tool if you don't have it. Subject line should be the task title (e.g. "Your morning brief"). Body should be the same content as your chat reply, lightly formatted for email. After sending, tell the user in ONE short line that you emailed it (e.g. "Also sent it to your inbox.").

7. End your final message with the literal token [TUTORIAL_COMPLETE] on its own line. The frontend uses this token to advance the tutorial. Emit it ONLY after you have delivered the result in chat AND sent the email. Never emit it before.

Be tight. No apologies. No "let me think about that". No narration of your process. Announce, check, post cards if needed, deliver the result, send the email, emit the token. Done.
`;

/** Append the tutorial section to CLAUDE.md if not already present. */
export function appendTutorialSection(claudeMd: string): string {
  if (claudeMd.includes(BEGIN)) return claudeMd;
  const trimmed = claudeMd.replace(/\s+$/, "");
  return `${trimmed}\n\n${BEGIN}\n${TUTORIAL_SECTION}${END}\n`;
}

/** Remove the tutorial section if present. Idempotent. */
export function stripTutorialSection(claudeMd: string): string {
  const beginIdx = claudeMd.indexOf(BEGIN);
  if (beginIdx === -1) return claudeMd;
  const endIdx = claudeMd.indexOf(END, beginIdx);
  if (endIdx === -1) return claudeMd;
  const before = claudeMd.slice(0, beginIdx).replace(/\s+$/, "");
  const after = claudeMd.slice(endIdx + END.length).replace(/^\s+/, "");
  if (!before) return after;
  if (!after) return `${before}\n`;
  return `${before}\n\n${after}`;
}
