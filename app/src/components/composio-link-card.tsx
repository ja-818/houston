import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { useComposioApps } from "../hooks/queries";
import { useComposioRefetchOnReturn } from "../hooks/use-composio-refetch-on-return";

interface ComposioLinkCardProps {
  toolkit: string;
  /**
   * True if this toolkit is currently connected in the user's Composio
   * account. Resolved from the shared `useConnectedToolkits` query in
   * the parent (chat-tab / board-tab).
   */
  isConnected: boolean;
  /**
   * Default open-URL handler from the chat's link renderer. Called when
   * the user clicks Connect — opens the authorization URL in the
   * system browser.
   */
  onOpen: () => void;
}

/**
 * Rich inline card rendered in place of plain markdown links when the
 * agent outputs a Composio connect URL tagged with
 * `#houston_toolkit=<slug>`. Shows the app's logo + name and reflects
 * live connection state:
 *
 *   - Connected → green "Connected" pill, click is a no-op
 *   - Not connected → "Connect" button that opens the OAuth URL and,
 *     when the Houston window regains focus (user returned from the
 *     browser), invalidates the probe query so the card flips to
 *     Connected. OAuth flows vary from 5s to 60s+ so a fixed timeout
 *     would always be wrong — focus-driven invalidation updates
 *     precisely when the user looks at the card.
 */
export function ComposioLinkCard({
  toolkit,
  isConnected,
  onOpen,
}: ComposioLinkCardProps) {
  const [opening, setOpening] = useState(false);
  const { data: apiApps } = useComposioApps();
  const markWaitingForAuth = useComposioRefetchOnReturn();

  // When the probe comes back connected, clear the local spinner.
  useEffect(() => {
    if (isConnected) setOpening(false);
  }, [isConnected]);

  const app = (() => {
    const fromApi = apiApps?.find((a) => a.toolkit === toolkit);
    if (fromApi) {
      return {
        toolkit: fromApi.toolkit,
        name: fromApi.name,
        description: fromApi.description,
        logoUrl: fromApi.logo_url || fallbackLogo(fromApi.toolkit),
      };
    }
    return {
      toolkit,
      name: toolkit,
      description: "Composio integration",
      logoUrl: fallbackLogo(toolkit),
    };
  })();

  const handleConnect = useCallback(() => {
    setOpening(true);
    markWaitingForAuth(toolkit);
    onOpen();
    // Safety net: if the user never returns focus and never completes
    // auth (closes the browser tab), clear the spinner after 90s so
    // the button becomes clickable again. The polling loop in
    // `useComposioRefetchOnReturn` stops itself at 60s.
    window.setTimeout(() => setOpening(false), 90_000);
  }, [onOpen, markWaitingForAuth, toolkit]);

  return (
    <span className="not-prose inline-flex my-1 max-w-full align-middle">
      <span className="inline-flex items-center gap-3 px-3 py-2.5 rounded-xl border border-black/5 bg-background min-w-0">
        <AppLogo app={app} />
        <span className="flex-1 min-w-0 flex flex-col">
          <span className="text-[13px] font-medium text-foreground truncate">
            {app.name}
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            {isConnected ? "Already connected" : app.description}
          </span>
        </span>
        {isConnected ? (
          <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium shrink-0">
            <Check className="size-3" />
            Connected
          </span>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={opening}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-border bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 shrink-0"
          >
            {opening ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <>
                Connect
                <ExternalLink className="size-3" />
              </>
            )}
          </button>
        )}
      </span>
    </span>
  );
}

function AppLogo({ app }: { app: { name: string; logoUrl: string } }) {
  const [imgError, setImgError] = useState(false);
  const initial = app.name.charAt(0).toUpperCase();
  if (imgError) {
    return (
      <span className="size-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-muted-foreground">
          {initial}
        </span>
      </span>
    );
  }
  return (
    <img
      src={app.logoUrl}
      alt={app.name}
      className="size-8 rounded-lg object-contain shrink-0"
      onError={() => setImgError(true)}
    />
  );
}

/**
 * Parse a Composio redirect URL for the `#houston_toolkit=<slug>`
 * fragment that agents append per the system prompt. Returns the slug
 * or `null` if the URL doesn't carry one.
 */
export function parseComposioToolkitFromHref(href: string): string | null {
  try {
    const url = new URL(href);
    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    if (!hash) return null;
    const params = new URLSearchParams(hash);
    const slug = params.get("houston_toolkit");
    return slug && slug.length > 0 ? slug : null;
  } catch {
    return null;
  }
}

function fallbackLogo(toolkit: string): string {
  return `https://www.google.com/s2/favicons?domain=${toolkit}.com&sz=128`;
}
