import type { KeyboardEvent, ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@deck-ui/core";

export interface SidebarProps {
  logo?: ReactNode;
  items: { id: string; name: string }[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  onDelete?: (id: string) => void;
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
  sectionLabel,
  children,
}: SidebarProps) {
  const handleKeyDown = (e: KeyboardEvent, id: string) => {
    if (onDelete && (e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault();
      onDelete(id);
    }
  };

  return (
    <>
      <aside className="w-[200px] bg-secondary flex flex-col h-full shrink-0 border-r border-border">
        {/* Header: logo + add button */}
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

        {/* Section label */}
        {sectionLabel && (
          <div className="px-4 pt-3 pb-1.5">
            <span className="text-[12px] text-muted-foreground">{sectionLabel}</span>
          </div>
        )}

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-2">
          {items.map((item) => {
            const isActive = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-lg text-[13px] transition-colors duration-100 truncate",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-accent-foreground hover:bg-accent/50",
                )}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </aside>

      {children}
    </>
  );
}
