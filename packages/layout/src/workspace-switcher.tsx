import type { ReactNode } from "react";
import { Plus, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@houston-ai/core";

export interface SpaceSwitcherProps {
  spaces: { id: string; name: string }[];
  currentId: string | null;
  currentName: string;
  onSwitch: (spaceId: string) => void;
  onCreate: () => void;
  /** Optional trailing element (e.g., settings button) */
  trailing?: ReactNode;
}

export function SpaceSwitcher({
  spaces,
  currentId,
  currentName,
  onSwitch,
  onCreate,
  trailing,
}: SpaceSwitcherProps) {
  return (
    <div
      className="flex items-center gap-1 px-2 pt-3 pb-1"
      data-tauri-drag-region
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:bg-accent rounded-lg py-1.5 px-2.5 transition-colors flex-1 min-w-0">
            <span className="truncate">{currentName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {spaces.map((space) => (
            <DropdownMenuItem
              key={space.id}
              onClick={() => onSwitch(space.id)}
              className={space.id === currentId ? "font-medium" : ""}
            >
              {space.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create space
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {trailing}
    </div>
  );
}
