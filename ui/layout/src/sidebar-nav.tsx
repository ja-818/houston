import type { ReactNode } from "react";
import { cn } from "@houston-ai/core";

export interface SidebarNavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  /** Optional right-aligned slot (e.g. a "Beta" badge, a count). */
  trailing?: ReactNode;
}

export function SidebarNavItem({
  icon,
  label,
  active,
  onClick,
  trailing,
}: SidebarNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 text-sm py-1.5 px-2.5 rounded-lg transition-colors",
        active
          ? "bg-accent font-medium text-foreground"
          : "text-foreground hover:bg-accent",
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {trailing}
    </button>
  );
}
