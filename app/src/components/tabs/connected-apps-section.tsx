import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { tauriConnections, tauriSystem } from "../../lib/tauri";

interface ConnectedAppsSectionProps {
  connectedToolkits: Set<string>;
}

export function ConnectedAppsSection({
  connectedToolkits,
}: ConnectedAppsSectionProps) {
  const { t } = useTranslation("integrations");
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
            description: t("connected.title"),
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
        <h2 className="text-sm font-medium text-foreground">{t("connected.title")}</h2>
        <span className="text-xs text-muted-foreground">
          {t("connected.count", { count: connectedApps.length })}
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
  const { t } = useTranslation("integrations");
  const [imgError, setImgError] = useState(false);
  const initial = app.name.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => tauriSystem.openUrl(composioAppUrl(app.toolkit))}
      title={t("connected.manageOn", { name: app.name })}
      className="group w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary hover:bg-black/[0.05] transition-colors focus-visible:outline-none focus-visible:bg-black/[0.05]"
    >
      {!imgError ? (
        <img
          src={app.logoUrl}
          alt={app.name}
          className="size-8 rounded-lg object-contain shrink-0 bg-background"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="size-8 rounded-lg bg-background flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">
            {initial}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate flex items-center gap-1.5">
          {app.name}
          <span
            className="size-1.5 rounded-full bg-emerald-500 shrink-0"
            aria-label={t("connected.dotAria")}
          />
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {app.description}
        </p>
      </div>
      <ExternalLink className="size-3.5 text-muted-foreground/60 shrink-0 group-hover:text-muted-foreground transition-colors" />
    </button>
  );
}

function fallbackLogo(toolkit: string): string {
  return `https://www.google.com/s2/favicons?domain=${toolkit}.com&sz=128`;
}
