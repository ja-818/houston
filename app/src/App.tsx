import "./styles/globals.css";
import { ToastContainer } from "@houston-ai/core";
import type { Toast } from "@houston-ai/core";
import { useState, useEffect, useCallback, useRef } from "react";
import { Check, X, Plus } from "lucide-react";
import houstonIconWhite from "./assets/houston-icon-white.svg";

import { tauriSlack, tauriSystem } from "./lib/tauri";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  Button,
  Spinner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from "@houston-ai/core";
import { TabBar } from "@houston-ai/layout";
import { useHoustonInit } from "./hooks/use-houston-init";
import { useSessionEvents } from "./hooks/use-session-events";
import { useAgentInvalidation } from "./hooks/use-agent-invalidation";
import { useWorkspaceStore } from "./stores/workspaces";
import { useAgentStore } from "./stores/agents";
import { useAgentCatalogStore } from "./stores/agent-catalog";
import { useUIStore } from "./stores/ui";
import { useActivity } from "./hooks/queries";
import { Sidebar } from "./components/shell/sidebar";
import { CreateAgentDialog } from "./components/shell/create-workspace-dialog";
import { AgentRenderer } from "./components/shell/experience-renderer";
import { Dashboard } from "./components/dashboard";
import { WorkspaceConnections } from "./components/space-connections";
import { DetailPanelProvider } from "./components/shell/detail-panel-context";

export default function App() {
  useHoustonInit();
  useSessionEvents();
  useAgentInvalidation();

  // Intercept all link clicks and open in system browser
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      e.preventDefault();
      tauriSystem.openUrl(href);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const wsLoading = useWorkspaceStore((s) => s.loading);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const createWorkspace = useWorkspaceStore((s) => s.create);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrent);
  const loadAgents = useAgentStore((s) => s.loadAgents);
  const currentAgent = useAgentStore((s) => s.current);
  const agentLoading = useAgentStore((s) => s.loading);
  const getById = useAgentCatalogStore((s) => s.getById);
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);
  const onStartMission = useUIStore((s) => s.onStartMission);
  const missionPanelOpen = useUIStore((s) => s.missionPanelOpen);
  const setCreateAgentDialogOpen = useUIStore((s) => s.setCreateAgentDialogOpen);
  const [panelContainer, setPanelContainer] = useState<HTMLDivElement | null>(null);

  const agentDef = currentAgent ? getById(currentAgent.configId) : undefined;
  const tabs = agentDef?.config.tabs ?? [];
  const { data: activities } = useActivity(currentAgent?.folderPath);
  const needsYouCount = (activities ?? []).filter((a) => a.status === "needs_you").length;

  // Auto-correct viewMode if it doesn't match any tab on the current agent
  const isAgentView = viewMode !== "dashboard" && viewMode !== "connections";
  useEffect(() => {
    if (isAgentView && tabs.length > 0 && !tabs.some((t) => t.id === viewMode)) {
      setViewMode(agentDef?.config.defaultTab ?? tabs[0].id);
    }
  }, [isAgentView, tabs, viewMode, setViewMode, agentDef]);

  const mappedToasts: Toast[] = toasts.map((t) => ({
    id: t.id,
    message: t.description ? `${t.title}: ${t.description}` : t.title,
    variant: (t.title.startsWith("Error") ? "error" : "info") as Toast["variant"],
    action: t.action,
  }));

  if (agentLoading || wsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground text-sm">Starting...</p>
      </div>
    );
  }

  // No workspaces yet — full screen welcome
  if (workspaces.length === 0) {
    return <WelcomeScreen
      onCreate={async (name) => {
        try {
          const ws = await createWorkspace(name);
          setCurrentWorkspace(ws);
          await loadAgents(ws.id);
        } catch {
          const reload = useWorkspaceStore.getState().loadWorkspaces;
          await reload();
          const reloaded = useWorkspaceStore.getState().workspaces;
          if (reloaded.length > 0) {
            setCurrentWorkspace(reloaded[0]);
            await loadAgents(reloaded[0].id);
          }
        }
      }}
      toasts={mappedToasts}
      onDismissToast={dismissToast}
    />;
  }

  return (
    <DetailPanelProvider value={panelContainer}>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar>
          <div className="flex-1 flex min-w-0 overflow-hidden">
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {viewMode === "dashboard" ? (
                <Dashboard />
              ) : viewMode === "connections" ? (
                <WorkspaceConnections />
              ) : currentAgent && agentDef && tabs.length > 0 ? (
                <>
                  <TabBar
                    title={currentAgent.name}
                    tabs={tabs.map((t) => ({
                      id: t.id,
                      label: t.label,
                      badge: t.badge === "activity" ? needsYouCount : undefined,
                    }))}
                    activeTab={viewMode}
                    onTabChange={setViewMode}
                    actions={
                      <div className="flex items-center gap-2">
                        {currentAgent && (
                          <SlackButton
                            agentPath={currentAgent.folderPath}
                            agentName={currentAgent.name}
                          />
                        )}
                        {onStartMission && (
                          <Button
                            onClick={() => {
                              setViewMode("activity");
                              setTimeout(() => {
                                useUIStore.getState().onStartMission?.();
                              }, 50);
                            }}
                          >
                            <img src={houstonIconWhite} alt="" className="size-4" />
                            New mission
                          </Button>
                        )}
                      </div>
                    }
                  />
                  <main className="flex-1 min-h-0 overflow-hidden">
                    <AgentRenderer
                      agentDef={agentDef}
                      agent={currentAgent}
                      tabs={tabs}
                      activeTabId={viewMode}
                    />
                  </main>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Empty className="border-0">
                    <EmptyHeader>
                      <EmptyTitle>No agents yet</EmptyTitle>
                      <EmptyDescription>
                        Build your AI team and ship the impossible.
                      </EmptyDescription>
                    </EmptyHeader>
                    <Button
                      className="mt-4 rounded-full"
                      onClick={() => setCreateAgentDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      New Agent
                    </Button>
                  </Empty>
                </div>
              )}
            </main>
            {missionPanelOpen && (
              <div
                ref={setPanelContainer}
                className="h-full border-l border-border overflow-hidden"
                style={{ width: "45%", minWidth: 380 }}
              />
            )}
          </div>
        </Sidebar>

        <CreateAgentDialog />
        <ToastContainer toasts={mappedToasts} onDismiss={dismissToast} />
      </div>
    </DetailPanelProvider>
  );
}

function SlackButton({ agentPath, agentName }: { agentPath: string; agentName: string }) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [channelName, setChannelName] = useState<string | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    setStatus("idle");
    setChannelName(null);
    abortRef.current = false;
    tauriSlack.getStatus(agentPath).then((s) => {
      if (s.connected) {
        setStatus("connected");
        setChannelName(s.channel_name ?? null);
      }
    }).catch(() => {});
  }, [agentPath]);

  const handleConnect = useCallback(async () => {
    abortRef.current = false;
    setStatus("connecting");
    try {
      const result = await tauriSlack.connect(agentPath, agentName);
      if (!abortRef.current) {
        setStatus("connected");
        setChannelName(result.channel_name);
      }
    } catch (e) {
      if (!abortRef.current) {
        console.error("[slack] connect failed:", e);
      }
      setStatus("idle");
    }
  }, [agentPath, agentName]);

  const handleCancel = useCallback(() => {
    abortRef.current = true;
    setStatus("idle");
  }, []);

  const handleDisconnect = useCallback(async () => {
    await tauriSlack.disconnect(agentPath);
    setStatus("idle");
    setChannelName(null);
  }, [agentPath]);

  if (status === "connected") {
    return (
      <Button
        variant="ghost"
        onClick={handleDisconnect}
        title={`Connected to #${channelName}. Click to disconnect.`}
      >
        <Check className="size-4" />
        Slack connected
      </Button>
    );
  }

  if (status === "connecting") {
    return (
      <Button variant="ghost" onClick={handleCancel} className="group">
        <span className="group-hover:hidden"><Spinner className="size-4" /></span>
        <X className="size-4 hidden group-hover:block" />
        Connecting Slack
      </Button>
    );
  }

  return (
    <Button variant="ghost" onClick={handleConnect}>
      Connect Slack
    </Button>
  );
}

function WelcomeScreen({
  onCreate,
  toasts,
  onDismissToast,
}: {
  onCreate: (name: string) => Promise<void>;
  toasts: Toast[];
  onDismissToast: (id: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wsName, setWsName] = useState("Personal");

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyTitle>Welcome to Houston</EmptyTitle>
          <EmptyDescription>
            Create your first workspace to get started.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          className="mt-4 rounded-full"
          onClick={() => setDialogOpen(true)}
        >
          Create your first workspace
        </Button>
      </Empty>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Name your workspace</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!wsName.trim()) return;
              await onCreate(wsName.trim());
              setDialogOpen(false);
            }}
            className="space-y-4 pt-2"
          >
            <Input
              autoFocus
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              placeholder="e.g. Personal, Work, Acme Corp"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!wsName.trim()}
                className="rounded-full"
              >
                Create workspace
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
    </div>
  );
}
