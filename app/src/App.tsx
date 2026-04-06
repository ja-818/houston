import "./styles/globals.css";
import { ToastContainer } from "@houston-ai/core";
import type { Toast } from "@houston-ai/core";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  Button,
} from "@houston-ai/core";
import { TabBar } from "@houston-ai/layout";
import { useHoustonInit } from "./hooks/use-houston-init";
import { useSessionEvents } from "./hooks/use-session-events";
import { useSpaceStore } from "./stores/spaces";
import { useWorkspaceStore } from "./stores/workspaces";
import { useExperienceStore } from "./stores/experiences";
import { useUIStore } from "./stores/ui";
import { Sidebar } from "./components/shell/sidebar";
import { CreateWorkspaceDialog } from "./components/shell/create-workspace-dialog";
import { ExperienceRenderer } from "./components/shell/experience-renderer";
import { Dashboard } from "./components/dashboard";
import { SpaceConnections } from "./components/space-connections";

export default function App() {
  useHoustonInit();
  useSessionEvents();

  const spaceLoading = useSpaceStore((s) => s.loading);
  const spaces = useSpaceStore((s) => s.spaces);
  const createSpace = useSpaceStore((s) => s.create);
  const setCurrentSpace = useSpaceStore((s) => s.setCurrent);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const current = useWorkspaceStore((s) => s.current);
  const loading = useWorkspaceStore((s) => s.loading);
  const getById = useExperienceStore((s) => s.getById);
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  const experience = current ? getById(current.experienceId) : undefined;
  const tabs = experience?.manifest.tabs ?? [];

  const mappedToasts: Toast[] = toasts.map((t) => ({
    id: t.id,
    message: t.description ? `${t.title}: ${t.description}` : t.title,
    variant: (t.title.startsWith("Error") ? "error" : "info") as Toast["variant"],
    action: t.action,
  }));

  if (loading || spaceLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground text-sm">Starting...</p>
      </div>
    );
  }

  // No spaces yet — full screen welcome
  if (spaces.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>Welcome to Houston</EmptyTitle>
            <EmptyDescription>
              Create your first space to get started.
            </EmptyDescription>
          </EmptyHeader>
          <Button
            className="mt-4 rounded-full"
            onClick={async () => {
              const space = await createSpace("Personal");
              setCurrentSpace(space);
              await loadWorkspaces(space.id);
            }}
          >
            Create your first space
          </Button>
        </Empty>
        <ToastContainer toasts={mappedToasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar>
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {viewMode === "dashboard" ? (
            <Dashboard />
          ) : viewMode === "connections" ? (
            <SpaceConnections />
          ) : current && experience && tabs.length > 0 ? (
            <>
              <TabBar
                title={current.name}
                tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
                activeTab={viewMode}
                onTabChange={setViewMode}
              />
              <main className="flex-1 min-h-0 overflow-hidden">
                <ExperienceRenderer
                  experience={experience}
                  workspace={current}
                  tabs={tabs}
                  activeTabId={viewMode}
                />
              </main>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Empty className="border-0">
                <EmptyHeader>
                  <EmptyTitle>No AI Workspaces yet</EmptyTitle>
                  <EmptyDescription>
                    Create your first AI Workspace to get started.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </main>
      </Sidebar>

      <CreateWorkspaceDialog />
      <ToastContainer toasts={mappedToasts} onDismiss={dismissToast} />
    </div>
  );
}
