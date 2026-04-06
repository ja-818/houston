import "./styles/globals.css";
import { ToastContainer } from "@houston-ai/core";
import type { Toast } from "@houston-ai/core";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@houston-ai/core";
import { TabBar } from "@houston-ai/layout";
import { useHoustonInit } from "./hooks/use-houston-init";
import { useSessionEvents } from "./hooks/use-session-events";
import { useOrganizationStore } from "./stores/organizations";
import { useWorkspaceStore } from "./stores/workspaces";
import { useExperienceStore } from "./stores/experiences";
import { useUIStore } from "./stores/ui";
import { Sidebar } from "./components/shell/sidebar";
import { CreateWorkspaceDialog } from "./components/shell/create-workspace-dialog";
import { ExperienceRenderer } from "./components/shell/experience-renderer";
import { Dashboard } from "./components/dashboard";
import { OrgConnections } from "./components/org-connections";

export default function App() {
  useHoustonInit();
  useSessionEvents();

  const orgLoading = useOrganizationStore((s) => s.loading);
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
    message: t.title,
    variant: "info" as const,
  }));

  if (loading || orgLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground text-sm">Starting...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar>
        <main className="flex-1 flex flex-col min-w-0">
          {viewMode === "dashboard" ? (
            <Dashboard />
          ) : viewMode === "connections" ? (
            <OrgConnections />
          ) : current && experience && tabs.length > 0 ? (
            <>
              <TabBar
                title={current.name}
                tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
                activeTab={viewMode}
                onTabChange={setViewMode}
              />
              <main className="flex-1 min-h-0">
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
                  <EmptyTitle>Select a workspace</EmptyTitle>
                  <EmptyDescription>
                    Pick an AI Workspace from the sidebar or create a new one.
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
