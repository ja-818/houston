export interface ModelOption {
  id: string;
  label: string;
  description: string;
}

/**
 * How a provider authenticates.
 *
 * - `"cli"`: the provider exposes a CLI login command (e.g. `claude login`,
 *   `codex login`). Houston runs it via `tauriProvider.launchLogin` and the
 *   provider's own browser flow takes over.
 * - `"apiKey"`: the provider has NO CLI login flow. The user must paste an
 *   API key from the provider's console and Houston surfaces a dedicated
 *   dialog with the instructions instead of calling `launchLogin`.
 */
export type ProviderLoginKind = "cli" | "apiKey";

export interface ProviderInfo {
  id: string;
  name: string;
  subtitle: string;
  cliName: string;
  installUrl: string;
  loginCommand: string;
  cost: string;
  models: readonly ModelOption[];
  defaultModel: string;
  /** Auth flow this provider uses. Defaults to "cli" when omitted. */
  loginKind?: ProviderLoginKind;
  /**
   * Optional URL the connect dialog points API-key users at to mint a key.
   * Only meaningful when `loginKind === "apiKey"`.
   */
  apiKeyConsoleUrl?: string;
  /**
   * Shell `export` command (env var name) for API-key providers. Shown in
   * the connect dialog so the user can paste it into their shell rc.
   */
  apiKeyEnvVar?: string;
}

export const PROVIDERS: readonly ProviderInfo[] = [
  {
    id: "openai",
    name: "OpenAI",
    subtitle: "Codex",
    cliName: "codex",
    installUrl: "https://github.com/openai/codex",
    loginCommand: "codex login",
    cost: "Your ChatGPT subscription",
    // `gpt-5.5` is the default because the `-codex` variant is not granted
    // on every ChatGPT plan (Business / Enterprise users hit a hard 400
    // "model is not supported when using Codex with a ChatGPT account").
    // Plain `gpt-5.5` works on every plan that Codex accepts at all, so we
    // default there and let users opt into `-codex` via the picker if their
    // plan allows it.
    models: [
      {
        id: "gpt-5.5",
        label: "GPT-5.5",
        description: "Works on every ChatGPT plan. Recommended default.",
      },
      {
        id: "gpt-5.5-codex",
        label: "GPT-5.5 Codex",
        description: "Coding-tuned. Some ChatGPT plans (e.g. Business) do not include it.",
      },
    ],
    defaultModel: "gpt-5.5",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    subtitle: "Claude Code",
    cliName: "claude",
    installUrl: "https://docs.anthropic.com/en/docs/claude-code/overview",
    loginCommand: "claude login",
    cost: "Your Claude subscription",
    models: [
      { id: "sonnet", label: "Sonnet", description: "Best balance of speed and quality." },
      { id: "opus", label: "Opus", description: "Most capable. Slower, more tokens." },
    ],
    defaultModel: "sonnet",
  },
] as const;

/** Find a provider by id. */
export function getProvider(id: string): ProviderInfo | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/** Find the model object for a provider + model id. */
export function getModel(providerId: string, modelId: string): ModelOption | undefined {
  return getProvider(providerId)?.models.find((m) => m.id === modelId);
}

/** Get the default provider + model for a provider id. */
export function getDefaultModel(providerId: string): string {
  return getProvider(providerId)?.defaultModel ?? "sonnet";
}

/**
 * Return `providerId` only when it names a currently-active provider in
 * `PROVIDERS`. Used by the chat model selector and the per-chat
 * effective-provider fallback chain to skip stored values that point at
 * providers Houston has moved to `COMING_SOON_PROVIDERS` (e.g. an
 * activity record from a previous Houston version that selected Gemini
 * before it was paused). Callers chain it with `??` to fall through to
 * the next tier of preference.
 */
export function validProviderOrNull(providerId: string | null | undefined): string | null {
  return providerId && getProvider(providerId) ? providerId : null;
}

export interface ComingSoonProviderInfo {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  readonly mark: string;
}

export const COMING_SOON_PROVIDERS: readonly ComingSoonProviderInfo[] = [
  // Gemini: engine support + bundled CLI machinery are intact in this
  // codebase. The UI keeps it under "coming soon" until the broader
  // rollout (account-tier gating, Windows fork-build) is ready. Listed
  // first so the alphabetised "next up" slot stays prominent.
  { id: "gemini", name: "Google", subtitle: "Gemini CLI", mark: "GM" },
  { id: "subq", name: "SubQ", subtitle: "SubQ Code", mark: "SQ" },
  { id: "deepseek", name: "DeepSeek", subtitle: "DeepSeek Coder", mark: "DS" },
  { id: "minimax", name: "MiniMax", subtitle: "M2", mark: "MM" },
] as const;
