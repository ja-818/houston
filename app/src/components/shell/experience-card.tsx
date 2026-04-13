import { useState } from "react";
import { Button } from "@houston-ai/core";
import { Download, Check, Sparkles } from "lucide-react";
import type { AgentConfig, StoreListing } from "../../lib/types";
import { AgentAvatar } from "./agent-avatar";
export { AgentAvatar, AgentMiniAvatar, HoustonThinkingIndicator, getAgentIcon, getAgentIconColor, getHoustonLogo, isLightColor } from "./agent-avatar";

interface AgentCardProps {
  config: AgentConfig;
  onSelect: (id: string) => void;
}

export function AgentCard({ config, onSelect }: AgentCardProps) {
  return (
    <button
      onClick={() => onSelect(config.id)}
      className="flex items-start gap-4 rounded-2xl bg-[#f5f5f5] p-4 text-left transition-colors duration-200 hover:bg-[#ebebeb]"
    >
      <AgentAvatar config={config} size="md" />
      <div className="flex flex-col gap-0.5 min-w-0 pt-0.5">
        <span className="text-sm font-semibold text-foreground">
          {config.name}
        </span>
        <span className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {config.description}
        </span>
        {config.author && (
          <span className="text-[11px] text-muted-foreground/50 mt-1">
            By {config.author}
          </span>
        )}
      </div>
    </button>
  );
}

interface StoreAgentCardProps {
  listing: StoreListing;
  isInstalled: boolean;
  onInstall: (listing: StoreListing) => Promise<void>;
  onSelect: (id: string) => void;
}

export function StoreAgentCard({
  listing,
  isInstalled,
  onInstall,
  onSelect,
}: StoreAgentCardProps) {
  const [installing, setInstalling] = useState(false);

  const handleInstall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setInstalling(true);
    try {
      await onInstall(listing);
    } finally {
      setInstalling(false);
    }
  };

  const handleClick = () => {
    if (isInstalled) onSelect(listing.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-4 rounded-2xl bg-[#f5f5f5] p-4 text-left transition-colors duration-200 ${
        isInstalled ? "cursor-pointer hover:bg-[#ebebeb]" : ""
      }`}
    >
      <StoreAvatar listing={listing} />
      <div className="flex flex-col gap-0.5 min-w-0 pt-0.5 flex-1">
        <span className="text-sm font-semibold text-foreground">
          {listing.name}
        </span>
        <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {listing.description}
        </span>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-muted-foreground/50">
            By {listing.author}
          </span>
          <span className="text-[11px] text-muted-foreground/50">
            {formatInstalls(listing.installs)}
          </span>
        </div>
        <div className="mt-2">
          {isInstalled ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <Check className="h-3.5 w-3.5" />
              Installed
            </span>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 rounded-full text-xs px-3"
              disabled={installing}
              onClick={handleInstall}
            >
              <Download className="h-3 w-3 mr-1" />
              {installing ? "Installing..." : "Install"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StoreAvatar({ listing }: { listing: StoreListing }) {
  if (listing.icon_url) {
    return (
      <div className="h-14 w-14 shrink-0 rounded-full border border-black/10 flex items-center justify-center p-2.5 bg-white">
        <img
          src={listing.icon_url}
          alt={listing.name}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }
  const Icon = Sparkles;
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100">
      <Icon className="h-6 w-6 text-gray-600" />
    </div>
  );
}

function formatInstalls(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k installs`;
  return `${count} install${count !== 1 ? "s" : ""}`;
}
