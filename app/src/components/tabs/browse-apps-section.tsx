import { useState, useMemo, useCallback } from "react";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { COMPOSIO_CATALOG, type ComposioApp } from "../../lib/composio-catalog";
import { tauriConnections, tauriSystem } from "../../lib/tauri";
import { useComposioRefetchOnReturn } from "../../hooks/use-composio-refetch-on-return";

interface BrowseAppsSectionProps {
  connectedToolkits: Set<string>;
}

const PAGE_SIZE = 100;

export function BrowseAppsSection({ connectedToolkits }: BrowseAppsSectionProps) {
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [connecting, setConnecting] = useState<string | null>(null);
  const markWaitingForAuth = useComposioRefetchOnReturn();

  const { data: apiApps } = useQuery({
    queryKey: ["composio-apps"],
    queryFn: () => tauriConnections.listApps(),
    staleTime: 1000 * 60 * 60,
  });

  const catalog: ComposioApp[] = useMemo(() => {
    if (apiApps && apiApps.length > 0) {
      return apiApps.map((a) => ({
        toolkit: a.toolkit,
        name: a.name,
        description: a.description,
        logoUrl: a.logo_url || fallbackLogo(a.toolkit),
      }));
    }
    return COMPOSIO_CATALOG;
  }, [apiApps]);

  const available = useMemo(() => {
    const unconnected = catalog.filter(
      (app) => !connectedToolkits.has(app.toolkit),
    );
    if (!search.trim()) return unconnected;
    const q = search.toLowerCase();
    return unconnected.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q),
    );
  }, [catalog, connectedToolkits, search]);

  // When searching, show all matches. Otherwise paginate.
  const isSearching = search.trim().length > 0;
  const visibleApps = isSearching ? available : available.slice(0, visible);
  const hasMore = !isSearching && visible < available.length;

  const handleConnect = useCallback(
    async (toolkit: string) => {
      setConnecting(toolkit);
      try {
        const { redirect_url } = await tauriConnections.connectApp(toolkit);
        tauriSystem.openUrl(redirect_url);
        // Targeted polling for this slug — see useComposioRefetchOnReturn
        // for the full rationale. Poll until Composio's backend flips
        // the toolkit to connected, then invalidate the main query so
        // this Browse grid and every other surface updates at once.
        markWaitingForAuth(toolkit);
      } catch {
        // Error already shown via invoke toast
      } finally {
        setConnecting(null);
      }
    },
    [markWaitingForAuth],
  );

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-foreground">
          Browse all apps
        </h2>
        <span className="text-xs text-muted-foreground">
          {available.length} {available.length === 1 ? "app" : "apps"}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search apps..."
          className="w-full h-9 pl-9 pr-3 rounded-full border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {/* Grid */}
      {available.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No matching apps found.
        </p>
      )}
      {available.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {visibleApps.map((app) => (
              <AppCard
                key={app.toolkit}
                app={app}
                connecting={connecting === app.toolkit}
                onConnect={handleConnect}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="inline-flex items-center gap-1 h-8 px-4 rounded-full border border-border bg-background text-foreground text-xs font-medium hover:bg-secondary transition-colors duration-200"
              >
                Load more ({available.length - visible} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function AppCard({
  app,
  connecting,
  onConnect,
}: {
  app: ComposioApp;
  connecting: boolean;
  onConnect: (toolkit: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const initial = app.name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-black/5 hover:bg-accent/50 transition-colors">
      {!imgError ? (
        <img
          src={app.logoUrl}
          alt={app.name}
          className="size-8 rounded-lg object-contain shrink-0"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="size-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">
            {initial}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate">
          {app.name}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {app.description}
        </p>
      </div>
      <button
        onClick={() => onConnect(app.toolkit)}
        disabled={connecting}
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-border bg-background text-foreground text-xs font-medium hover:bg-secondary transition-colors duration-200 disabled:opacity-50 shrink-0"
      >
        {connecting ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <>
            Connect
            <ExternalLink className="size-3" />
          </>
        )}
      </button>
    </div>
  );
}

function fallbackLogo(toolkit: string): string {
  return `https://www.google.com/s2/favicons?domain=${toolkit}.com&sz=128`;
}
