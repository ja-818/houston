import { useEffect } from "react";
import { AppSidebar, TabBar, SplitView } from "@deck-ui/layout";
import { KanbanBoard } from "@deck-ui/board";
import { ChatPanel } from "@deck-ui/chat";
import { EventFeed } from "@deck-ui/events";
import { MemoryBrowser } from "@deck-ui/memory";
import { SkillsGrid } from "@deck-ui/skills";
import { RoutinesGrid } from "@deck-ui/routines";
import { ConnectionsView } from "@deck-ui/connections";
import { MessageSquare } from "lucide-react";
import { useUIStore, type ViewMode } from "./stores/ui";
import { useProjectStore } from "./stores/projects";
import { useIssueStore } from "./stores/issues";
import { useFeedStore } from "./stores/feeds";
import { useEventStore } from "./stores/events";
import { useMemoryStore } from "./stores/memory";
import { useSessionEvents } from "./hooks/use-session-events";
import type { KanbanItem, KanbanColumn as KanbanColumnConfig } from "@deck-ui/board";

const COLUMNS: KanbanColumnConfig[] = [
  { id: "running", label: "Running", statuses: ["running"] },
  { id: "needs_you", label: "Needs You", statuses: ["needs_you"] },
  { id: "done", label: "Done", statuses: ["done", "cancelled"] },
];

const TABS = [
  { id: "activity", label: "Activity" },
  { id: "events", label: "Events" },
  { id: "memory", label: "Memory" },
  { id: "skills", label: "Skills" },
  { id: "routines", label: "Routines" },
  { id: "connections", label: "Connections" },
];

export function App() {
  const { viewMode, setViewMode, chatOpen, setChatOpen } = useUIStore();
  const { projects, currentProject, loadProjects, selectProject, addProject } =
    useProjectStore();
  const { issues, loadIssues } = useIssueStore();
  const feedItems = useFeedStore((s) => s.items);
  const events = useEventStore((s) => s.events);
  const { memories, loading: memoriesLoading, loadMemories } = useMemoryStore();

  useSessionEvents();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (currentProject) {
      loadIssues(currentProject.id);
      loadMemories(currentProject.id);
    }
  }, [currentProject, loadIssues, loadMemories]);

  const kanbanItems: KanbanItem[] = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    subtitle: issue.description,
    status: issue.status,
    updatedAt: issue.updated_at,
  }));

  const mainContent = (
    <div className="flex flex-col flex-1 min-h-0">
      <TabBar
        title={currentProject?.name ?? "No project"}
        tabs={TABS}
        activeTab={viewMode}
        onTabChange={(id) => setViewMode(id as ViewMode)}
        actions={
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="inline-flex items-center gap-1.5 rounded-full h-9 px-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <MessageSquare className="size-4" />
            Chat
          </button>
        }
      />
      <div className="flex-1 min-h-0 overflow-auto">
        {viewMode === "activity" && (
          <KanbanBoard
            columns={COLUMNS}
            items={kanbanItems}
            runningStatuses={["running"]}
            approveStatuses={["needs_you"]}
            emptyState={
              <p className="text-muted-foreground text-sm">
                No tasks yet. Open Chat to create one.
              </p>
            }
          />
        )}
        {viewMode === "events" && (
          <EventFeed events={events} emptyMessage="No events yet." />
        )}
        {viewMode === "memory" && (
          <MemoryBrowser
            memories={memories}
            loading={memoriesLoading}
            emptyMessage="No memories yet."
          />
        )}
        {viewMode === "skills" && (
          <SkillsGrid skills={[]} loading={false} onSkillClick={() => {}} />
        )}
        {viewMode === "routines" && (
          <RoutinesGrid routines={[]} onSelectRoutine={() => {}} />
        )}
        {viewMode === "connections" && (
          <ConnectionsView
            result={{ status: "ok", connections: [] }}
            loading={false}
            onRetry={() => {}}
            onManage={() => {}}
          />
        )}
      </div>
    </div>
  );

  const chatPanel = (
    <ChatPanel
      sessionKey="main"
      feedItems={feedItems["main"] ?? []}
      isLoading={false}
      onSend={(text) => {
        console.log("Send:", text);
        // TODO: invoke start_session Tauri command
      }}
      placeholder="Ask anything..."
      emptyState={
        <p className="text-muted-foreground text-sm">Start a conversation.</p>
      }
    />
  );

  return (
    <div className="h-screen flex bg-background text-foreground">
      <AppSidebar
        logo={<span className="text-sm font-semibold">{{APP_NAME_TITLE}}</span>}
        items={projects.map((p) => ({ id: p.id, name: p.name }))}
        selectedId={currentProject?.id}
        onSelect={selectProject}
        onAdd={addProject}
        sectionLabel="Projects"
      >
        {chatOpen ? (
          <SplitView left={mainContent} right={chatPanel} />
        ) : (
          <div className="flex-1 flex flex-col min-h-0">{mainContent}</div>
        )}
      </AppSidebar>
    </div>
  );
}
