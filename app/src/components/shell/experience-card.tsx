import {
  Bot,
  Search,
  GitPullRequest,
  PenLine,
  LayoutGrid,
  BarChart3,
  Headphones,
  Users,
  Container,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { ExperienceManifest } from "../../lib/types";

const iconMap: Record<string, LucideIcon> = {
  Bot,
  Search,
  GitPullRequest,
  PenLine,
  LayoutGrid,
  BarChart3,
  Headphones,
  Users,
  Container,
};

export function getExperienceIcon(name?: string): LucideIcon {
  return iconMap[name ?? ""] ?? Sparkles;
}

interface ExperienceCardProps {
  manifest: ExperienceManifest;
  onSelect: (id: string) => void;
}

export function ExperienceCard({ manifest, onSelect }: ExperienceCardProps) {
  const Icon = getExperienceIcon(manifest.icon);

  return (
    <button
      onClick={() => onSelect(manifest.id)}
      className="flex flex-col items-start gap-3 rounded-xl border border-black/5 p-5 text-left transition-all duration-200 hover:border-black/15 hover:shadow-sm"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
        <Icon className="h-5 w-5 text-gray-600" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">
          {manifest.name}
        </span>
        <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {manifest.description}
        </span>
      </div>
      {manifest.author && (
        <span className="text-[11px] text-muted-foreground/60 mt-auto pt-1">
          By {manifest.author}
        </span>
      )}
    </button>
  );
}
