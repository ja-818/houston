import { useState, useMemo, lazy, Suspense } from "react";
import { Search } from "lucide-react";
import { Input } from "@deck-ui/core";
import { ThemeSwitcher } from "./components/theme-switcher";
import { SCREENS, PRIMITIVES } from "./sidebar-groups";

/* ------------------------------------------------------------------ */
/* Lazy page imports                                                   */
/* ------------------------------------------------------------------ */

const pages: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  /* Screens */
  chat: lazy(() =>
    import("./pages/chat/chat-panel").then((m) => ({ default: m.ChatPanelPage })),
  ),
  kanban: lazy(() =>
    import("./pages/board/kanban-board").then((m) => ({ default: m.KanbanBoardPage })),
  ),
  files: lazy(() =>
    import("./pages/screens/files").then((m) => ({ default: m.FilesScreen })),
  ),
  instructions: lazy(() =>
    import("./pages/screens/instructions").then((m) => ({ default: m.InstructionsScreen })),
  ),
  channels: lazy(() =>
    import("./pages/screens/channels").then((m) => ({ default: m.ChannelsScreen })),
  ),
  connections: lazy(() =>
    import("./pages/connections/connections-view").then((m) => ({ default: m.ConnectionsViewPage })),
  ),
  events: lazy(() =>
    import("./pages/events/event-feed").then((m) => ({ default: m.EventFeedPage })),
  ),
  memory: lazy(() =>
    import("./pages/memory/memory-browser").then((m) => ({ default: m.MemoryBrowserPage })),
  ),
  routines: lazy(() =>
    import("./pages/screens/routines").then((m) => ({ default: m.RoutinesScreen })),
  ),
  layout: lazy(() =>
    import("./pages/screens/layout").then((m) => ({ default: m.LayoutScreen })),
  ),
  /* Primitives */
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
    import("./pages/core/separator").then((m) => ({ default: m.SeparatorPage })),
  ),
  stepper: lazy(() =>
    import("./pages/core/stepper").then((m) => ({ default: m.StepperPage })),
  ),
};

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export function App() {
  const [activePage, setActivePage] = useState("chat");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { screens: SCREENS, primitives: PRIMITIVES };
    return {
      screens: SCREENS.filter((s) => s.label.toLowerCase().includes(q)),
      primitives: PRIMITIVES.filter((s) => s.label.toLowerCase().includes(q)),
    };
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
          {filtered.screens.length > 0 && (
            <>
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Screens
              </p>
              {filtered.screens.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  active={activePage === item.id}
                  onSelect={setActivePage}
                />
              ))}
            </>
          )}
          {filtered.primitives.length > 0 && (
            <>
              <p className="px-2 py-1.5 mt-3 text-xs font-medium text-muted-foreground">
                Primitives
              </p>
              {filtered.primitives.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  active={activePage === item.id}
                  onSelect={setActivePage}
                />
              ))}
            </>
          )}
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

function SidebarItem({
  item,
  active,
  onSelect,
}: {
  item: { id: string; label: string };
  active: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] transition-colors duration-100 truncate ${
        active
          ? "bg-accent text-foreground font-medium"
          : "text-accent-foreground hover:bg-accent/50"
      }`}
    >
      {item.label}
    </button>
  );
}
