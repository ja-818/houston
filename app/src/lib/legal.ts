/**
 * Security disclaimer — version + copy.
 *
 * The **copy below is a placeholder** so the gate mechanism can ship
 * ahead of final legal review. Real legal text arrives from the user.
 * When it does, replace `PLACEHOLDER_DISCLAIMER_TEXT` AND bump
 * `CURRENT_DISCLAIMER_VERSION` so every user re-accepts the new text.
 */

/**
 * Current version of the in-app security disclaimer. Bump whenever the
 * text changes in a way that requires users to re-accept. The gate
 * re-prompts when the persisted `legal_acceptance.version` is lower
 * than this constant.
 */
export const CURRENT_DISCLAIMER_VERSION = 1;

/**
 * Placeholder disclaimer copy. The UI splits this on blank lines to
 * render paragraphs. A `[PLACEHOLDER]` banner lives at the top so no
 * reviewer mistakes this text for the final legal copy.
 *
 * TODO(legal): replace with real disclaimer text from counsel and bump
 * `CURRENT_DISCLAIMER_VERSION` in the same change.
 */
export const PLACEHOLDER_DISCLAIMER_TEXT = `[PLACEHOLDER — not final legal copy. Do not ship to production without counsel review.]

Welcome to Houston. Before you continue, please take a moment to read how this app works and what you are responsible for while using it.

Houston runs AI coding agents on your behalf. These agents use the command-line tools (such as Claude Code or Codex) that are already installed and signed in on your computer — Houston never asks for a password or API key of its own. Any action an agent takes is performed with the same privileges and billing relationship that you have with those providers directly. You are responsible for reviewing what the agents do on your behalf and for any changes they make to your files, repositories, cloud accounts, or third-party services.

Your data stays on your machine. Conversations, agent workspaces, preferences, and logs are stored locally under your home directory. Houston does not upload your files or prompts to any Houston-operated server. However, when an agent calls a model provider, the contents of that request are sent to the provider you chose and governed by that provider's terms of service and privacy policy.

AI agents are non-deterministic. They may make mistakes, hallucinate, misread instructions, or take actions you did not intend. Always keep important work under version control, review agent output before merging or publishing, and never give an agent access to a system whose blast radius you are not comfortable with.

By clicking Accept below, you confirm that you have read and understood the points above and that you agree to use Houston under these conditions. If you do not agree, click Decline and Houston will close.`;
