import {
  Sparkles,
  Plus,
  LayoutGrid,
  Search,
  Code,
  Wand2,
  FileText,
  Users,
  Bot,
  Briefcase,
  MessageSquare,
  PenTool,
  BarChart3,
  Shield,
  Globe,
  Zap,
  BookOpen,
  Wrench,
  Brain,
  type LucideIcon,
} from "lucide-react";
import houstonIcon from "../../assets/houston-icon.svg";
import houstonIconWhite from "../../assets/houston-icon-white.svg";
import type { AgentConfig } from "../../lib/types";

const iconMap: Record<string, LucideIcon> = {
  Plus,
  LayoutGrid,
  Search,
  Code,
  Wand2,
  FileText,
  Users,
  Bot,
  Briefcase,
  MessageSquare,
  PenTool,
  BarChart3,
  Shield,
  Globe,
  Zap,
  BookOpen,
  Wrench,
  Brain,
  Sparkles,
};

/** Returns perceived luminance 0–1 for a hex color */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** True if color is light enough for dark foreground */
export function isLightColor(hex?: string): boolean {
  if (!hex) return true;
  return luminance(hex) >= 0.5;
}

/** Pick the right Houston logo SVG for a background color */
export function getHoustonLogo(bgColor?: string): string {
  if (!bgColor) return houstonIcon;
  return isLightColor(bgColor) ? houstonIcon : houstonIconWhite;
}

export function getAgentIcon(name?: string): LucideIcon {
  return iconMap[name ?? ""] ?? Sparkles;
}

export function getAgentIconColor(color?: string): string {
  return color ?? "#8b8b8b";
}

interface AgentAvatarProps {
  config: Pick<AgentConfig, "image" | "icon" | "name" | "color">;
  size?: "md" | "lg";
}

export function AgentAvatar({ config, size = "md" }: AgentAvatarProps) {
  const dim = size === "lg" ? "h-16 w-16" : "h-14 w-14";
  const iconDim = size === "lg" ? "h-7 w-7" : "h-6 w-6";
  const imgPad = size === "lg" ? "p-3" : "p-2.5";
  const bg = config.color ?? "#f5f5f5";

  if (config.image) {
    return (
      <div
        className={`${dim} shrink-0 rounded-full border border-black/10 flex items-center justify-center ${imgPad}`}
        style={{ backgroundColor: bg }}
      >
        <img
          src={config.image}
          alt={config.name ?? ""}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  const Icon = getAgentIcon(config.icon);
  const iconColor = getAgentIconColor(config.color);

  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full`}
      style={{ backgroundColor: bg + "1a" }}
    >
      <Icon className={iconDim} style={{ color: iconColor }} />
    </div>
  );
}

/** Mini avatar — colored circle with Houston helmet */
export function AgentMiniAvatar({ color }: { color?: string }) {
  const logo = getHoustonLogo(color);
  return (
    <span
      className="shrink-0 rounded-full flex items-center justify-center"
      style={{
        width: 20,
        height: 20,
        backgroundColor: color ?? "#e5e5e5",
      }}
    >
      <img src={logo} alt="" className="size-[13px] object-contain" />
    </span>
  );
}

/** Pulsing Houston logo — universal loading indicator for all agents */
export function HoustonThinkingIndicator() {
  return (
    <div className="py-2 flex items-center gap-2">
      <img src={houstonIcon} alt="" className="size-5 object-contain animate-pulse" />
    </div>
  );
}
