import { useState, useMemo, lazy, Suspense } from "react";
import { Search } from "lucide-react";
import { Input } from "@deck-ui/core";
import { ThemeSwitcher } from "./components/theme-switcher";
import { SidebarGroup } from "./components/sidebar-group";
import { GROUPS } from "./sidebar-groups";

/* ------------------------------------------------------------------ */
/* Lazy page imports                                                   */
/* ------------------------------------------------------------------ */

const pages: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  button: lazy(() =>
    import("./pages/core/button").then((m) => ({ default: m.ButtonPage })),
  ),
  badge: lazy(() =>
    import("./pages/core/badge").then((m) => ({ default: m.BadgePage })),
  ),
  card: lazy(() =>
    import("./pages/core/card").then((m) => ({ default: m.CardPage })),
  ),
  input: lazy(() =>
    import("./pages/core/input").then((m) => ({ default: m.InputPage })),
  ),
  dialog: lazy(() =>
    import("./pages/core/dialog").then((m) => ({ default: m.DialogPage })),
  ),
  empty: lazy(() =>
    import("./pages/core/empty").then((m) => ({ default: m.EmptyPage })),
  ),
  separator: lazy(() =>
    import("./pages/core/separator").then((m) => ({
      default: m.SeparatorPage,
    })),
  ),
  "kanban-board": lazy(() =>
    import("./pages/board/kanban-board").then((m) => ({
      default: m.KanbanBoardPage,
    })),
  ),
  "chat-panel": lazy(() =>
    import("./pages/chat/chat-panel").then((m) => ({
      default: m.ChatPanelPage,
    })),
  ),
  "channel-avatar": lazy(() =>
    import("./pages/chat/channel-avatar").then((m) => ({
      default: m.ChannelAvatarPage,
    })),
  ),
  "event-feed": lazy(() =>
    import("./pages/events/event-feed").then((m) => ({
      default: m.EventFeedPage,
    })),
  ),
  "memory-browser": lazy(() =>
    import("./pages/memory/memory-browser").then((m) => ({
      default: m.MemoryBrowserPage,
    })),
  ),
  "routines-grid": lazy(() =>
    import("./pages/routines/routines-grid").then((m) => ({
      default: m.RoutinesGridPage,
    })),
  ),
  "heartbeat-config": lazy(() =>
    import("./pages/routines/heartbeat-config").then((m) => ({
      default: m.HeartbeatConfigPage,
    })),
  ),
  "schedule-builder": lazy(() =>
    import("./pages/routines/schedule-builder").then((m) => ({
      default: m.ScheduleBuilderPage,
    })),
  ),
  "connections-view": lazy(() =>
    import("./pages/connections/connections-view").then((m) => ({
      default: m.ConnectionsViewPage,
    })),
  ),
  "channel-setup-form": lazy(() =>
    import("./pages/connections/channel-setup-form").then((m) => ({
      default: m.ChannelSetupFormPage,
    })),
  ),
  "tab-bar": lazy(() =>
    import("./pages/layout/tab-bar").then((m) => ({
      default: m.TabBarPage,
    })),
  ),
  "split-view": lazy(() =>
    import("./pages/layout/split-view").then((m) => ({
      default: m.SplitViewPage,
    })),
  ),
  "app-sidebar": lazy(() =>
    import("./pages/layout/app-sidebar").then((m) => ({
      default: m.AppSidebarPage,
    })),
  ),
};

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export function App() {
  const [activePage, setActivePage] = useState("button");
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(GROUPS.map((g) => g.label)),
  );

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          group.label.toLowerCase().includes(q),
      ),
    })).filter((group) => group.items.length > 0);
  }, [search]);

  const PageComponent = pages[activePage];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-[200px] bg-secondary flex flex-col h-full shrink-0 border-r border-border">
        <div className="px-2 pt-3 pb-1 flex items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="h-8 pl-7 pr-2 text-[13px]"
            />
          </div>
          <ThemeSwitcher />
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pt-1 pb-4">
          {filteredGroups.map((group) => (
            <SidebarGroup
              key={group.label}
              group={group}
              isOpen={search.trim() !== "" || openGroups.has(group.label)}
              onToggle={() => toggleGroup(group.label)}
              activePage={activePage}
              onSelect={setActivePage}
            />
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <Suspense
              fallback={
                <div className="text-sm text-muted-foreground">
                  Loading...
                </div>
              }
            >
              {PageComponent && <PageComponent />}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
