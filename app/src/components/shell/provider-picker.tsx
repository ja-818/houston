import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Check, CircleDashed, ExternalLink, Terminal, ChevronDown, LogOut } from "lucide-react";
import {
  Spinner,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  Button,
} from "@houston-ai/core";
import { tauriProvider, tauriSystem, type ProviderStatus } from "../../lib/tauri";
import {
  PROVIDERS,
  COMING_SOON_PROVIDERS,
  type ProviderInfo,
  type ComingSoonProviderInfo,
} from "../../lib/providers";
import { analytics } from "../../lib/analytics";

interface Props {
  value: string | null;
  model?: string | null;
  onSelect: (provider: string, model: string) => void;
}

export function ProviderPicker({ value, model: controlledModel, onSelect }: Props) {
  const [statuses, setStatuses] = useState<Record<string, ProviderStatus>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [models, setModels] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const p of PROVIDERS) defaults[p.id] = p.defaultModel;
    if (controlledModel && value) defaults[value] = controlledModel;
    return defaults;
  });

  const prevStatuses = useRef<Record<string, ProviderStatus>>({});
  const loadStatuses = useCallback(async () => {
    const [openai, anthropic] = await Promise.all([
      tauriProvider.checkStatus("openai"),
      tauriProvider.checkStatus("anthropic"),
    ]);
    const next: Record<string, ProviderStatus> = { openai, anthropic };
    // Track when a provider transitions to connected
    for (const id of ["openai", "anthropic"] as const) {
      const wasConnected = prevStatuses.current[id]?.cli_installed && prevStatuses.current[id]?.authenticated;
      const isConnected = next[id]?.cli_installed && next[id]?.authenticated;
      if (!wasConnected && isConnected) {
        analytics.track("provider_configured", { provider: id });
      }
    }
    prevStatuses.current = next;
    setStatuses(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  // Auto-poll every 3s while a disconnected provider's guidance is visible
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const shouldPoll =
      expanded && !(statuses[expanded]?.cli_installed && statuses[expanded]?.authenticated);
    if (shouldPoll) {
      pollRef.current = setInterval(loadStatuses, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [expanded, statuses, loadStatuses]);

  const handleRefresh = async () => {
    setLoading(true);
    await loadStatuses();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map((prov) => {
          const status = statuses[prov.id];
          const connected = (status?.cli_installed && status?.authenticated) ?? false;
          const isSelected = value === prov.id;
          const isExpanded = expanded === prov.id;

          return (
            <ProviderCard
              key={prov.id}
              provider={prov}
              connected={connected}
              selected={isSelected}
              expanded={isExpanded}
              selectedModel={models[prov.id] ?? prov.defaultModel}
              onModelChange={(m) => {
                setModels((prev) => ({ ...prev, [prov.id]: m }));
                if (isSelected) onSelect(prov.id, m);
              }}
              onSelect={() => onSelect(prov.id, models[prov.id] ?? prov.defaultModel)}
              onSignedOut={async () => {
                await loadStatuses();
                setExpanded(prov.id);
              }}
              // Settle the expanded state based on what got clicked:
              //   - connected card              → collapse (no setup needed)
              //   - disconnected card currently expanded → collapse (toggle off)
              //   - disconnected card not expanded       → switch to it
              // Previously we only called onExpand when !connected, so
              // clicking a connected card while a disconnected card's
              // SetupGuidance was open left that stale card behind.
              onExpand={() =>
                setExpanded(
                  connected ? null : isExpanded ? null : prov.id,
                )
              }
            />
          );
        })}
        {COMING_SOON_PROVIDERS.map((prov) => (
          <ComingSoonCard key={prov.id} provider={prov} />
        ))}
      </div>

      {/* Setup guidance — rendered below the grid when a disconnected card
          is expanded. `key={expanded}` remounts the component when the user
          switches between OpenAI and Anthropic, resetting local state
          (`loginLaunched`, `loginError`) so the previous provider's
          "Waiting for browser sign-in..." banner doesn't linger under the
          new provider's heading. */}
      {expanded && !(statuses[expanded]?.cli_installed && statuses[expanded]?.authenticated) && (
        <SetupGuidance
          key={expanded}
          provider={PROVIDERS.find((p) => p.id === expanded)!}
          status={statuses[expanded]}
          isSelected={value === expanded}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}

function ProviderCard({
  provider,
  connected,
  selected,
  expanded,
  selectedModel,
  onModelChange,
  onSelect,
  onExpand,
  onSignedOut,
}: {
  provider: ProviderInfo;
  connected: boolean;
  selected: boolean;
  expanded: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSelect: () => void;
  onExpand: () => void;
  onSignedOut: () => void | Promise<void>;
}) {
  const { t } = useTranslation("providers");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSignOutError(null);
    setSigningOut(true);
    try {
      await tauriProvider.launchLogout(provider.id);
      await onSignedOut();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[provider-picker] launchLogout(${provider.id}) failed:`, msg);
      setSignOutError(msg);
    } finally {
      setSigningOut(false);
    }
  };
  const handleClick = () => {
    onSelect();
    // Always settle the expansion state — the parent decides whether this
    // means "open me", "close me", or "close whoever was open". Must NOT
    // gate on `!connected` here or a connected card's click leaves the
    // previously-open disconnected card's SetupGuidance orphaned below.
    onExpand();
  };

  const selectedModelObj = provider.models.find((m) => m.id === selectedModel) ?? provider.models[0];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
      aria-label={connected
        ? t("card.ariaLabelConnected", { name: provider.name })
        : t("card.ariaLabelNotConnected", { name: provider.name })}
      aria-pressed={selected}
      className={`
        relative rounded-xl p-5 transition-all flex flex-col items-center gap-3 cursor-pointer
        outline-none focus-visible:ring-2 focus-visible:ring-ring
        ${selected
          ? "border-2 border-foreground bg-secondary"
          : connected
            ? "border border-black/[0.08] hover:border-black/[0.15] hover:bg-accent"
            : "border border-black/[0.05] opacity-75 hover:opacity-100"
        }
        ${expanded && !connected ? "border-black/[0.15] bg-accent/50" : ""}
      `}
    >
      {/* Selection check */}
      {selected && (
        <div className="absolute top-3 right-3">
          <Check className="h-4 w-4 text-foreground" strokeWidth={2.5} />
        </div>
      )}

      {/* Logo */}
      <div className="h-10 w-10 flex items-center justify-center">
        {provider.id === "anthropic" ? <ClaudeLogo /> : <OpenAILogo />}
      </div>

      {/* Name */}
      <div className="text-center">
        <div className="text-sm font-medium text-foreground">{provider.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{provider.subtitle}</div>
      </div>

      {/* Connection status */}
      <div className="flex items-center gap-1.5 text-xs" aria-live="polite">
        {connected ? (
          <>
            <Check className="h-3 w-3 text-[#00a240]" />
            <span className="text-[#00a240] font-medium">{t("card.connected")}</span>
          </>
        ) : (
          <>
            <CircleDashed className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{t("card.notConnected")}</span>
          </>
        )}
      </div>

      {/* Model picker — uses the design-system DropdownMenu */}
      {(selected || connected) && (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8 gap-1.5 text-xs"
              >
                {selectedModelObj.label}
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="w-64 overscroll-contain"
              style={{
                maxHeight: "min(22rem, var(--radix-dropdown-menu-content-available-height, 22rem))",
              }}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                {t("card.modelDropdownLabel")}
              </DropdownMenuLabel>
              {provider.models.map((m) => {
                const isActive = m.id === selectedModel;
                return (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => {
                      onModelChange(m.id);
                      if (!selected && connected) onSelect();
                    }}
                    className="flex items-start gap-2.5 py-2"
                  >
                    <div className="w-4 shrink-0 mt-0.5 flex justify-center">
                      {isActive && <Check className="h-3.5 w-3.5 text-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{m.label}</div>
                      <div className="text-xs text-muted-foreground leading-snug">{m.description}</div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Cost */}
      <p className="text-xs text-muted-foreground">{provider.cost}</p>

      {/* Sign out — only when this provider is currently connected. Lets
          the user clear local credentials (or revoke server-side tokens
          for Codex) and then re-login through the existing setup flow. */}
      {connected && (
        <div className="w-full" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingOut ? (
              <>
                <Spinner className="h-3 w-3" />
                {t("card.signingOut")}
              </>
            ) : (
              <>
                <LogOut className="h-3 w-3" />
                {t("card.signOut")}
              </>
            )}
          </button>
          {signOutError && (
            <p className="mt-1.5 text-xs text-destructive">
              {t("card.signOutError", { provider: provider.name })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ComingSoonCard({ provider }: { provider: ComingSoonProviderInfo }) {
  const { t } = useTranslation("providers");
  return (
    <div
      aria-disabled="true"
      className="relative rounded-xl p-5 flex flex-col items-center gap-3 cursor-not-allowed border border-black/[0.05] opacity-60 select-none"
    >
      <div className="h-10 w-10 flex items-center justify-center">
        <ComingSoonLogo provider={provider} />
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-foreground">{provider.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{provider.subtitle}</div>
      </div>
      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {t("card.comingSoon")}
      </span>
    </div>
  );
}

function ComingSoonLogo({ provider }: { provider: ComingSoonProviderInfo }) {
  switch (provider.id) {
    case "gemini":
      return <GeminiLogo />;
    case "deepseek":
      return <DeepSeekLogo />;
    case "minimax":
      return <MiniMaxLogo />;
    default:
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
          <span className="text-xs font-semibold tracking-tight text-foreground">
            {provider.mark}
          </span>
        </div>
      );
  }
}

function SetupGuidance({
  provider,
  status,
  isSelected,
  onRefresh,
}: {
  provider: ProviderInfo;
  status: ProviderStatus | undefined;
  isSelected: boolean;
  onRefresh: () => void;
}) {
  const { t } = useTranslation("providers");
  const installed = status?.cli_installed ?? false;
  const authenticated = status?.authenticated ?? false;
  const [loginLaunched, setLoginLaunched] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoginError(null);
    try {
      await tauriProvider.launchLogin(provider.id);
      setLoginLaunched(true);
    } catch (e) {
      // Surface it. Previously we swallowed every error which made the
      // onboarding screen look completely unresponsive to users whose
      // `claude`/`codex` CLI was on a PATH the .app bundle couldn't see.
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[provider-picker] launchLogin(${provider.id}) failed:`, msg);
      setLoginError(msg);
    }
  };

  return (
    <div className="rounded-xl border border-black/[0.08] bg-secondary/50 p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">{t("setup.headline", { provider: provider.name })}</p>

      <div className="space-y-2">
        <StatusRow
          ok={installed}
          okLabel={t("setup.cliInstalled", { cli: provider.cliName })}
          notOkLabel={t("setup.cliNotFound", { cli: provider.cliName })}
        />
        <StatusRow
          ok={authenticated}
          okLabel={t("setup.signedIn")}
          notOkLabel={t("setup.notSignedIn")}
        />
      </div>

      {!installed && (
        <div className="flex items-start gap-2 text-sm">
          <Terminal className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-muted-foreground">
            {t("setup.installHint", { cli: provider.cliName })}{" "}
            <button
              onClick={() => tauriSystem.openUrl(provider.installUrl)}
              className="text-foreground underline underline-offset-2 font-medium"
            >
              {t("setup.installGuide")}
              <ExternalLink className="inline h-3 w-3 ml-0.5 -mt-0.5" />
            </button>
          </div>
        </div>
      )}

      {installed && !authenticated && !loginLaunched && (
        <Button
          onClick={handleSignIn}
          className="rounded-full"
          size="sm"
        >
          {t("setup.signInWith", { provider: provider.name })}
        </Button>
      )}

      {installed && !authenticated && loginLaunched && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-3.5 w-3.5" />
            <span>{t("setup.waiting")}</span>
          </div>
          <button
            onClick={handleSignIn}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {t("setup.openBrowserAgain")}
          </button>
        </div>
      )}

      {loginError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
          <div className="font-medium mb-0.5">{t("setup.launchErrorTitle", { cli: provider.cliName })}</div>
          <div className="text-destructive/80">{loginError}</div>
        </div>
      )}

      {!installed && (
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1 h-7 px-3 rounded-full border border-border bg-background text-foreground text-xs font-medium hover:bg-secondary transition-colors"
        >
          {t("setup.installedCheckAgain")}
        </button>
      )}

      {isSelected && (
        <p className="text-xs text-muted-foreground">
          {t("setup.canContinueHint")}
        </p>
      )}
    </div>
  );
}

function StatusRow({ ok, okLabel, notOkLabel }: { ok: boolean; okLabel: string; notOkLabel: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <Check className="h-3.5 w-3.5 text-[#00a240] shrink-0" />
      ) : (
        <CircleDashed className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>
        {ok ? okLabel : notOkLabel}
      </span>
    </div>
  );
}

function ClaudeLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
      <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
    </svg>
  );
}

function OpenAILogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.047 6.047 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function GeminiLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
      <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" />
    </svg>
  );
}

function DeepSeekLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
      <path d="M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45" />
    </svg>
  );
}

function MiniMaxLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
      <path d="M11.43 3.92a.86.86 0 1 0-1.718 0v14.236a1.999 1.999 0 0 1-3.997 0V9.022a.86.86 0 1 0-1.718 0v3.87a1.999 1.999 0 0 1-3.997 0V11.49a.57.57 0 0 1 1.139 0v1.404a.86.86 0 0 0 1.719 0V9.022a1.999 1.999 0 0 1 3.997 0v9.134a.86.86 0 0 0 1.719 0V3.92a1.998 1.998 0 1 1 3.996 0v11.788a.57.57 0 1 1-1.139 0zm10.572 3.105a2 2 0 0 0-1.999 1.997v7.63a.86.86 0 0 1-1.718 0V3.923a1.999 1.999 0 0 0-3.997 0v16.16a.86.86 0 0 1-1.719 0V18.08a.57.57 0 1 0-1.138 0v2a1.998 1.998 0 0 0 3.996 0V3.92a.86.86 0 0 1 1.719 0v12.73a1.999 1.999 0 0 0 3.996 0V9.023a.86.86 0 1 1 1.72 0v6.686a.57.57 0 0 0 1.138 0V9.022a2 2 0 0 0-1.998-1.997" />
    </svg>
  );
}
