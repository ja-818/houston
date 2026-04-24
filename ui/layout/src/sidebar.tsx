import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { ScrollArea } from "@houston-ai/core";
import { SidebarNavItem } from "./sidebar-nav";
import { SidebarItemRow } from "./sidebar-item-row";

export interface SidebarItem {
  id: string;
  name: string;
  icon?: ReactNode;
}

export interface SidebarNavItemEntry {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
  /** Optional right-aligned slot (e.g. a "Beta" badge). */
  trailing?: ReactNode;
}

export interface SidebarProps {
  logo?: ReactNode;
  /** Header area rendered at the very top (e.g., space/org switcher) */
  header?: ReactNode;
  /** Nav items rendered below the header and above the items list */
  navItems?: SidebarNavItemEntry[];
  /** ID of the currently active nav item (for highlighting) */
  activeNavId?: string;
  items: SidebarItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  sectionLabel?: string;
  /** Footer area rendered at the very bottom of the sidebar */
  footer?: ReactNode;
  children?: ReactNode;
}

export function AppSidebar({
  logo,
  header,
  navItems,
  activeNavId,
  items,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
  sectionLabel,
  footer,
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

  const showLogo = logo && !header;

  return (
    <>
      <aside className="w-[220px] bg-sidebar text-sidebar-foreground flex flex-col h-full shrink-0">
        {/* Header slot (e.g., WorkspaceSwitcher) */}
        {header}

        {/* Legacy logo area (only when no header) */}
        {showLogo && (
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">{logo}</div>
          </div>
        )}

        {/* Nav items */}
        {navItems && navItems.length > 0 && (
          <nav className="px-2 py-1 space-y-0.5">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                trailing={item.trailing}
                active={
                  activeNavId !== undefined
                    ? item.id === activeNavId
                    : item.active
                }
                onClick={item.onClick}
              />
            ))}
          </nav>
        )}

        {/* Section label + add button */}
        {(sectionLabel || onAdd) && (
          <div className="px-3 pt-3 pb-1 flex items-center justify-between">
            {sectionLabel && (
              <span className="text-xs font-medium text-muted-foreground">
                {sectionLabel}
              </span>
            )}
            {onAdd && (
              <button
                onClick={onAdd}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Items list */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-0.5 pb-2">
            {items.map((item) => (
              <SidebarItemRow
                key={item.id}
                item={item}
                isActive={item.id === selectedId}
                isEditing={editingId === item.id}
                editValue={editValue}
                hasMenu={hasMenu}
                onSelect={onSelect}
                onKeyDown={handleKeyDown}
                onEditChange={setEditValue}
                onCommitRename={commitRename}
                onCancelEdit={() => setEditingId(null)}
                onStartRename={onRename ? startRename : undefined}
                onDelete={onDelete}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Footer slot (e.g., update notification) */}
        {footer}
      </aside>

      {children}
    </>
  );
}
