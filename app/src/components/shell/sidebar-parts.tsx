import type { ReactNode } from "react";
import { Plus, ChevronDown, Settings } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@houston-ai/core";

export function OrgSwitcher({
  orgs,
  currentId,
  currentName,
  onSwitch,
  onCreate,
}: {
  orgs: { id: string; name: string }[];
  currentId: string | null;
  currentName: string;
  onSwitch: (orgId: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex items-center gap-1 px-2 pt-3 pb-1" data-tauri-drag-region>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:bg-accent rounded-lg py-1.5 px-2.5 transition-colors flex-1 min-w-0">
            <span className="truncate">{currentName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {orgs.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => onSwitch(org.id)}
              className={org.id === currentId ? "font-medium" : ""}
            >
              {org.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 rounded-lg">
        <Settings className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

export function SidebarNavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 text-sm py-1.5 px-2.5 rounded-lg transition-colors ${
        active
          ? "bg-accent font-medium text-foreground"
          : "text-foreground hover:bg-accent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
