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

const iconStyle: Record<string, { bg: string; fg: string }> = {
  Bot: { bg: "bg-gray-900", fg: "text-white" },
  Search: { bg: "bg-blue-100", fg: "text-blue-600" },
  GitPullRequest: { bg: "bg-violet-100", fg: "text-violet-600" },
  PenLine: { bg: "bg-amber-100", fg: "text-amber-600" },
  LayoutGrid: { bg: "bg-emerald-100", fg: "text-emerald-600" },
  BarChart3: { bg: "bg-sky-100", fg: "text-sky-600" },
  Headphones: { bg: "bg-rose-100", fg: "text-rose-600" },
  Users: { bg: "bg-indigo-100", fg: "text-indigo-600" },
  Container: { bg: "bg-orange-100", fg: "text-orange-600" },
};

const defaultStyle = { bg: "bg-gray-100", fg: "text-gray-600" };

export function getExperienceIcon(name?: string): LucideIcon {
  return iconMap[name ?? ""] ?? Sparkles;
}

export function getExperienceIconStyle(name?: string) {
  return iconStyle[name ?? ""] ?? defaultStyle;
}

interface ExperienceCardProps {
  manifest: ExperienceManifest;
  onSelect: (id: string) => void;
}

export function ExperienceCard({ manifest, onSelect }: ExperienceCardProps) {
  const Icon = getExperienceIcon(manifest.icon);
  const style = getExperienceIconStyle(manifest.icon);

  return (
    <button
      onClick={() => onSelect(manifest.id)}
      className="flex items-start gap-4 rounded-2xl border border-black/5 p-4 text-left transition-colors duration-200 hover:bg-gray-50/80"
    >
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${style.bg}`}
      >
        <Icon className={`h-6 w-6 ${style.fg}`} />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0 pt-0.5">
        <span className="text-sm font-semibold text-foreground">
          {manifest.name}
        </span>
        <span className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {manifest.description}
        </span>
        {manifest.author && (
          <span className="text-[11px] text-muted-foreground/50 mt-1">
            By {manifest.author}
          </span>
        )}
      </div>
    </button>
  );
}
