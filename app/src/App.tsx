import "./styles/globals.css";
import { ToastContainer } from "@houston-ai/core";
import type { Toast } from "@houston-ai/core";
import { useState, useEffect, useCallback, useRef } from "react";
import { Check, X, Plus } from "lucide-react";
import { HoustonLogo } from "./components/shell/experience-card";

import { tauriSlack, tauriSystem, tauriStore } from "./lib/tauri";
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
  cn,
} from "@houston-ai/core";
import { TabBar } from "@houston-ai/layout";
import { useHoustonInit } from "./hooks/use-houston-init";
import { useSessionEvents } from "./hooks/use-session-events";
import { useAgentInvalidation } from "./hooks/use-agent-invalidation";
import { useWorkspaceStore } from "./stores/workspaces";
import { useAgentStore } from "./stores/agents";
import { useAgentCatalogStore } from "./stores/agent-catalog";
import { useUIStore } from "./stores/ui";
import { useActivity, useConnections, useComposioApps } from "./hooks/queries";
import { Sidebar } from "./components/shell/sidebar";
import { CreateAgentDialog } from "./components/shell/create-workspace-dialog";
import { AgentUpdateBanner } from "./components/shell/agent-update-banner";
import { UpdateChecker } from "./components/shell/update-checker";
import { analytics } from "./lib/analytics";
import { loadTheme } from "./lib/theme";
import { AgentRenderer } from "./components/shell/experience-renderer";
import { Dashboard } from "./components/dashboard";
import { IntegrationsView } from "./components/tabs/integrations-view";
import { SettingsView } from "./components/tabs/settings-view";
import { WorkspaceSetupFlow } from "./components/shell/workspace-setup-flow";
import { DetailPanelProvider } from "./components/shell/detail-panel-context";

export default function App() {
  useHoustonInit();
  useSessionEvents();
  useAgentInvalidation();
  // Prefetch Composio data on launch so the integrations tab opens instantly.
  useConnections();
  useComposioApps();

  // Track app launch + load theme
  useEffect(() => {
    analytics.track("app_launched");
    loadTheme();
  }, []);

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

  // Suppress the native WebView context menu (Reload / Back / Forward) in
  // production builds — it's a developer affordance that shouldn't be exposed
  // to end users. Left enabled in dev so Inspect Element still works.
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
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
  const boardActions = useUIStore((s) => s.boardActions);
  const missionPanelOpen = useUIStore((s) => s.missionPanelOpen);
  const setCreateAgentDialogOpen = useUIStore((s) => s.setCreateAgentDialogOpen);
  const [panelContainer, setPanelContainer] = useState<HTMLDivElement | null>(null);

  const agentDef = currentAgent ? getById(currentAgent.configId) : undefined;
  const tabs = agentDef?.config.tabs ?? [];
  const { data: activities } = useActivity(currentAgent?.folderPath);
  const needsYouCount = (activities ?? []).filter((a) => a.status === "needs_you").length;

  // Auto-correct viewMode if it doesn't match any tab on the current agent
  const isAgentView = viewMode !== "dashboard" && viewMode !== "connections" && viewMode !== "settings";
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

  // No workspaces yet — onboarding
  if (workspaces.length === 0) {
    return (
      <OnboardingFlow
        onCreate={async (name, provider, model) => {
          try {
            const ws = await createWorkspace(name, provider, model);
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
      />
    );
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
                <IntegrationsView title="Integrations" />
              ) : viewMode === "settings" ? (
                <SettingsView />
              ) : currentAgent && agentDef && tabs.length > 0 ? (
                <>
                  <TabBar
                    title={currentAgent.name}
                    tabs={tabs.map((t) => ({
                      id: t.id,
                      label: t.label,
                      badge: t.badge === "activity" ? needsYouCount : undefined,
                      disabled: t.disabled,
                      chip: t.chip,
                    }))}
                    activeTab={viewMode}
                    onTabChange={setViewMode}
                    actions={
                      <div className="flex items-center gap-2">
                        {currentAgent && (
                          <SlackButton
                            agentPath={currentAgent.folderPath}
                            agentName={currentAgent.name}
                            agentColor={currentAgent.color}
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
                            <HoustonLogo size={16} />
                            New mission
                          </Button>
                        )}
                        {boardActions.map((action) => (
                          <Button
                            key={action.id}
                            variant="secondary"
                            onClick={() => {
                              setViewMode("activity");
                              setTimeout(() => action.onClick(), 50);
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
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
        <AgentUpdateBanner />
        <UpdateChecker />
        <ToastContainer toasts={mappedToasts} onDismiss={dismissToast} />
      </div>
    </DetailPanelProvider>
  );
}

function SlackButton({ agentPath, agentName, agentColor }: { agentPath: string; agentName: string; agentColor?: string }) {
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
      const result = await tauriSlack.connect(agentPath, agentName, agentColor);
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

function OnboardingFlow({
  onCreate,
  toasts,
  onDismissToast,
}: {
  onCreate: (name: string, provider: string, model: string) => Promise<void>;
  toasts: Toast[];
  onDismissToast: (id: string) => void;
}) {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <HoustonLogo size={40} className="mb-2" />
        <h1 className="text-xl font-semibold mb-1">Welcome to Houston</h1>
        <p className="text-sm text-muted-foreground mb-6">Ship the impossible.</p>
        <Button className="rounded-full" onClick={() => setStarted(true)}>
          Get started
        </Button>
        <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <WorkspaceSetupFlow mode="page" onComplete={onCreate} />
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
    </div>
  );
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createWorkspace = useWorkspaceStore((s) => s.create);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrent);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const loadAgents = useAgentStore((s) => s.loadAgents);
  const loadConfigs = useAgentCatalogStore((s) => s.loadConfigs);
  const [tab, setTab] = useState<"new" | "github">("new");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importUrl, setImportUrl] = useState("");

  const handleClose = () => {
    onOpenChange(false);
    setTab("new");
    setImporting(false);
    setImportError("");
    setImportUrl("");
  };

  const handleImportWorkspace = async () => {
    const trimmed = importUrl.trim();
    if (!trimmed) return;
    setImportError("");
    setImporting(true);
    try {
      const result = await tauriStore.installWorkspaceFromGithub(trimmed);
      await loadConfigs();
      await loadWorkspaces();
      const allWs = useWorkspaceStore.getState().workspaces;
      const imported = allWs.find((w) => w.id === result.workspaceId);
      if (imported) {
        setCurrentWorkspace(imported);
        await loadAgents(imported.id);
      }
      handleClose();
    } catch (e) {
      setImportError(e instanceof Error ? e.message : String(e));
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New workspace</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 pb-2">
          {(["new", "github"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors",
                tab === t
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t === "new" ? "Create new" : "Import from GitHub"}
            </button>
          ))}
        </div>

        {tab === "new" ? (
          <WorkspaceSetupFlow
            mode="dialog"
            onComplete={async (name, provider, model) => {
              const ws = await createWorkspace(name, provider, model);
              setCurrentWorkspace(ws);
              await loadAgents(ws.id);
              handleClose();
            }}
          />
        ) : (
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">
              Import a workspace template from GitHub. This creates a workspace with all its agents ready to use.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={importUrl}
                onChange={(e) => { setImportUrl(e.target.value); setImportError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && importUrl.trim() && !importing) handleImportWorkspace(); }}
                placeholder="owner/repo"
                disabled={importing}
                autoFocus
                className="flex-1 h-9 px-3 rounded-full border border-border bg-background text-sm
                           placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring
                           disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <Button
                onClick={handleImportWorkspace}
                disabled={!importUrl.trim() || importing}
                className="rounded-full shrink-0"
              >
                {importing ? <Spinner className="size-4" /> : "Import"}
              </Button>
            </div>
            {importError && (
              <p className="text-xs text-destructive">{importError}</p>
            )}
            {importing && (
              <div className="flex flex-col items-center gap-2 py-4">
                <Spinner className="size-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Importing workspace and agents...</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
