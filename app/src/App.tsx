import "./styles/globals.css";
import { ToastContainer } from "@houston-ai/core";
import type { Toast } from "@houston-ai/core";
import { useState, useEffect, useCallback } from "react";
import { Check } from "lucide-react";
import houstonIconBlack from "./assets/houston-icon.svg";

import { tauriSlack } from "./lib/tauri";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  Button,
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
import { Sidebar } from "./components/shell/sidebar";
import { CreateAgentDialog } from "./components/shell/create-workspace-dialog";
import { AgentRenderer } from "./components/shell/experience-renderer";
import { Dashboard } from "./components/dashboard";
import { WorkspaceConnections } from "./components/space-connections";

export default function App() {
  useHoustonInit();
  useSessionEvents();
  useAgentInvalidation();

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

  const agentDef = currentAgent ? getById(currentAgent.configId) : undefined;
  const tabs = agentDef?.config.tabs ?? [];

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
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar>
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {viewMode === "dashboard" ? (
            <Dashboard />
          ) : viewMode === "connections" ? (
            <WorkspaceConnections />
          ) : currentAgent && agentDef && tabs.length > 0 ? (
            <>
              <TabBar
                title={currentAgent.name}
                tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
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
                        variant="outline"
                        className="border-gray-950"
                        onClick={() => {
                          setViewMode("activity");
                          setTimeout(() => {
                            useUIStore.getState().onStartMission?.();
                          }, 50);
                        }}
                      >
                        <img src={houstonIconBlack} alt="" className="size-4" />
                        Start a Mission
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
                  <EmptyTitle>No Agents yet</EmptyTitle>
                  <EmptyDescription>
                    Create your first Agent to get started.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </main>
      </Sidebar>

      <CreateAgentDialog />
      <ToastContainer toasts={mappedToasts} onDismiss={dismissToast} />
    </div>
  );
}

function SlackButton({ agentPath, agentName }: { agentPath: string; agentName: string }) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [channelName, setChannelName] = useState<string | null>(null);

  useEffect(() => {
    setStatus("idle");
    setChannelName(null);
    tauriSlack.getStatus(agentPath).then((s) => {
      if (s.connected) {
        setStatus("connected");
        setChannelName(s.channel_name ?? null);
      }
    }).catch(() => {});
  }, [agentPath]);

  const handleConnect = useCallback(async () => {
    setStatus("connecting");
    try {
      const result = await tauriSlack.connect(agentPath, agentName);
      setStatus("connected");
      setChannelName(result.channel_name);
    } catch (e) {
      console.error("[slack] connect failed:", e);
      setStatus("idle");
    }
  }, [agentPath, agentName]);

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

  return (
    <Button
      variant="ghost"
      onClick={handleConnect}
      disabled={status === "connecting"}
    >
      {status === "connecting" ? "Connecting to Slack..." : "Connect Slack"}
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
