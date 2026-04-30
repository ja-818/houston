import type { KeyboardEvent } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  cn,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@houston-ai/core";
import type { SidebarItem } from "./sidebar";
import { sidebarItemRowClasses } from "./sidebar-classes";

export interface SidebarItemRowLabels {
  moreActions?: string;
  renameItem?: string;
  deleteItem?: string;
}

const DEFAULT_LABELS: Required<SidebarItemRowLabels> = {
  moreActions: "More actions",
  renameItem: "Rename",
  deleteItem: "Delete",
};

export interface SidebarItemRowProps {
  item: SidebarItem;
  isActive: boolean;
  isEditing: boolean;
  editValue: string;
  hasMenu: boolean;
  onSelect: (id: string) => void;
  onKeyDown: (e: KeyboardEvent, id: string) => void;
  onEditChange: (value: string) => void;
  onCommitRename: (id: string) => void;
  onCancelEdit: () => void;
  onStartRename?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
  labels?: SidebarItemRowLabels;
}

export function SidebarItemRow({
  item,
  isActive,
  isEditing,
  editValue,
  hasMenu,
  onSelect,
  onKeyDown,
  onEditChange,
  onCommitRename,
  onCancelEdit,
  onStartRename,
  onDelete,
  labels,
}: SidebarItemRowProps) {
  const l = { ...DEFAULT_LABELS, ...labels };

  return (
    <div
      className={cn(
        sidebarItemRowClasses.root,
        isActive ? "bg-accent" : "hover:bg-accent/50",
      )}
    >
      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={() => onCommitRename(item.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitRename(item.id);
            if (e.key === "Escape") onCancelEdit();
          }}
          className={sidebarItemRowClasses.editInput}
        />
      ) : (
        <button
          onClick={() => onSelect(item.id)}
          onKeyDown={(e) => onKeyDown(e, item.id)}
          className={cn(
            sidebarItemRowClasses.selectButton,
            isActive ? "text-foreground" : "text-accent-foreground",
          )}
        >
          {item.icon && (
            <span className={sidebarItemRowClasses.icon}>{item.icon}</span>
          )}
          <span className={sidebarItemRowClasses.name}>{item.name}</span>
        </button>
      )}

      {!isEditing && (item.trailing || hasMenu) && (
        <div className={sidebarItemRowClasses.actions}>
          {item.trailing && (
            <span className={sidebarItemRowClasses.trailing}>
              {item.trailing}
            </span>
          )}
          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label={l.moreActions}
                  className={sidebarItemRowClasses.menuButton}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                {onStartRename && (
                  <DropdownMenuItem
                    onClick={() => onStartRename(item.id, item.name)}
                  >
                    {l.renameItem}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(item.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    {l.deleteItem}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}
