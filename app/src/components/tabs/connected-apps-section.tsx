import { useMemo, useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { tauriConnections, tauriSystem } from "../../lib/tauri";

interface ConnectedAppsSectionProps {
  connectedToolkits: Set<string>;
}

export function ConnectedAppsSection({
  connectedToolkits,
}: ConnectedAppsSectionProps) {
  const { data: apiApps } = useQuery({
    queryKey: ["composio-apps"],
    queryFn: () => tauriConnections.listApps(),
    staleTime: 1000 * 60 * 60,
  });

  const connectedApps = useMemo(() => {
    const byToolkit = new Map(
      (apiApps ?? []).map((a) => [
        a.toolkit,
        {
          toolkit: a.toolkit,
          name: a.name,
          description: a.description,
          logoUrl: a.logo_url || fallbackLogo(a.toolkit),
        },
      ]),
    );
    return Array.from(connectedToolkits)
      .map(
        (slug) =>
          byToolkit.get(slug) ?? {
            toolkit: slug,
            name: slug,
            description: "Connected",
            logoUrl: fallbackLogo(slug),
          },
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [apiApps, connectedToolkits]);

  if (connectedApps.length === 0) {
    return null;
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-foreground">Connected</h2>
        <span className="text-xs text-muted-foreground">
          {connectedApps.length}{" "}
          {connectedApps.length === 1 ? "app" : "apps"}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {connectedApps.map((app) => (
          <ConnectedAppCard key={app.toolkit} app={app} />
        ))}
      </div>
    </section>
  );
}

interface AppInfo {
  toolkit: string;
  name: string;
  description: string;
  logoUrl: string;
}

function composioAppUrl(toolkit: string): string {
  return `https://dashboard.composio.dev/~/connect/apps/${toolkit}`;
}


function ConnectedAppCard({ app }: { app: AppInfo }) {
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
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
          <Check className="size-3" />
          Connected
        </span>
        <button
          onClick={() => tauriSystem.openUrl(composioAppUrl(app.toolkit))}
          className="inline-flex items-center justify-center size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={`Manage ${app.name} on Composio`}
        >
          <ExternalLink className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function fallbackLogo(toolkit: string): string {
  return `https://www.google.com/s2/favicons?domain=${toolkit}.com&sz=128`;
}
