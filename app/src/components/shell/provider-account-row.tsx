import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import type { ProviderInfo, ComingSoonProviderInfo } from "../../lib/providers";
import {
  ClaudeLogo,
  OpenAILogo,
  GeminiLogo,
  DeepSeekLogo,
  MiniMaxLogo,
} from "./provider-logos";

function ProviderLogo({ provider }: { provider: ProviderInfo }) {
  switch (provider.id) {
    case "anthropic":
      return <ClaudeLogo />;
    case "openai":
      return <OpenAILogo />;
    case "gemini":
      return <GeminiLogo />;
    default:
      return (
        <span className="text-[10px] font-semibold tracking-tight text-muted-foreground">
          {provider.name.slice(0, 1).toUpperCase()}
        </span>
      );
  }
}

function ComingSoonLogo({ provider }: { provider: ComingSoonProviderInfo }) {
  switch (provider.id) {
    case "deepseek":
      return <DeepSeekLogo />;
    case "minimax":
      return <MiniMaxLogo />;
    default:
      return (
        <span className="text-[10px] font-semibold tracking-tight text-muted-foreground">
          {provider.mark}
        </span>
      );
  }
}

export function ProviderAccountRow({
  provider,
  connected,
  pending,
  onConnect,
  onSignOut,
}: {
  provider: ProviderInfo;
  connected: boolean;
  pending: boolean;
  onConnect: () => void;
  onSignOut: () => void;
}) {
  const { t } = useTranslation("providers");

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary">
      <div className="size-8 rounded-lg bg-background flex items-center justify-center shrink-0">
        <ProviderLogo provider={provider} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate">{provider.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {connected ? t("card.connected") : provider.subtitle}
        </p>
      </div>
      <button
        type="button"
        onClick={connected ? onSignOut : onConnect}
        disabled={pending}
        className="text-[12px] font-medium px-2.5 py-1 rounded-md border border-input bg-background hover:bg-black/[0.05] transition-colors disabled:opacity-60 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 shrink-0"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : connected ? (
          t("row.signOut")
        ) : (
          t("row.connect")
        )}
      </button>
    </div>
  );
}

export function ComingSoonRow({ provider }: { provider: ComingSoonProviderInfo }) {
  const { t } = useTranslation("providers");
  return (
    <div
      aria-disabled="true"
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary opacity-60 cursor-not-allowed select-none"
    >
      <div className="size-8 rounded-lg bg-background flex items-center justify-center shrink-0">
        <ComingSoonLogo provider={provider} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate">{provider.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{provider.subtitle}</p>
      </div>
      <span className="rounded-full bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground shrink-0">
        {t("card.comingSoon")}
      </span>
    </div>
  );
}
