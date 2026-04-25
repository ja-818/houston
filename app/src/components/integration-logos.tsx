import { useState } from "react";
import { useComposioApps } from "../hooks/queries";

interface Props {
  /** Composio toolkit slugs (e.g. `["gmail", "slack"]`). */
  toolkits: string[];
  /** Render as small 16px pips (default true). */
  small?: boolean;
}

/**
 * Row of Composio app logos for a given list of toolkit slugs. Resolves
 * names + logo URLs via `useComposioApps`; falls back to the Google
 * favicon endpoint when the catalog doesn't know the slug.
 */
export function IntegrationLogos({ toolkits, small = true }: Props) {
  const { data: apps } = useComposioApps();
  if (toolkits.length === 0) return null;

  const size = small ? "size-4" : "size-5";

  return (
    <div className="flex items-center gap-1.5">
      {toolkits.map((slug) => {
        const entry = apps?.find((a) => a.toolkit === slug);
        const name = entry?.name ?? slug;
        const logoUrl = entry?.logo_url || fallbackLogo(slug);
        return (
          <LogoPip key={slug} name={name} logoUrl={logoUrl} className={size} />
        );
      })}
    </div>
  );
}

function LogoPip({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string;
  className: string;
}) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span
        className={`${className} rounded-[4px] bg-accent flex items-center justify-center text-[9px] font-semibold text-muted-foreground`}
        title={name}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={logoUrl}
      alt={name}
      title={name}
      className={`${className} rounded-[4px] object-contain`}
      onError={() => setBroken(true)}
    />
  );
}

function fallbackLogo(toolkit: string): string {
  return `https://www.google.com/s2/favicons?domain=${toolkit}.com&sz=128`;
}
