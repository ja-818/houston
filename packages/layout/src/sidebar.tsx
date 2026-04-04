import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { cn, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@deck-ui/core";

export interface SidebarProps {
  logo?: ReactNode;
  items: { id: string; name: string }[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  sectionLabel?: string;
  children?: ReactNode;
}

export function AppSidebar({
  logo,
  items,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
  sectionLabel,
  children,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const hasMenu = !!onDelete || !!onRename;

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const commitRename = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed && onRename) onRename(id, trimmed);
    setEditingId(null);
  };

  const handleKeyDown = (e: KeyboardEvent, id: string) => {
    if (onDelete && (e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault();
      onDelete(id);
    }
  };

  return (
    <>
      <aside className="w-[200px] bg-secondary flex flex-col h-full shrink-0 border-r border-border">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">{logo}</div>
          {onAdd && (
            <button
              onClick={onAdd}
              className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Plus className="size-4" strokeWidth={2} />
            </button>
          )}
        </div>

        {sectionLabel && (
          <div className="px-4 pt-3 pb-1.5">
            <span className="text-[12px] text-muted-foreground">{sectionLabel}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2">
          {items.map((item) => {
            const isActive = item.id === selectedId;
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "group flex items-center rounded-lg transition-colors duration-100",
                  isActive ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                {isEditing ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitRename(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(item.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 px-3 py-1.5 text-[13px] bg-background outline-none border border-border rounded-lg focus:border-foreground/30"
                  />
                ) : (
                  <button
                    onClick={() => onSelect(item.id)}
                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                    className={cn(
                      "flex-1 text-left px-3 py-1.5 text-[13px] truncate min-w-0",
                      isActive ? "text-foreground" : "text-accent-foreground",
                    )}
                  >
                    {item.name}
                  </button>
                )}

                {hasMenu && !isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="shrink-0 size-7 flex items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-accent transition-all mr-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="bottom">
                      {onRename && (
                        <DropdownMenuItem
                          onClick={() => startRename(item.id, item.name)}
                        >
                          Rename
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(item.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {children}
    </>
  );
}
