import { useState, type ReactNode } from "react";
import { LayoutDashboard, Blend, Settings, Smartphone } from "lucide-react";
import { Badge, ConfirmDialog } from "@houston-ai/core";
import { AppSidebar, WorkspaceSwitcher } from "@houston-ai/layout";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useAgentStore } from "../../stores/agents";
import { useAgentCatalogStore } from "../../stores/agent-catalog";
import { useUIStore } from "../../stores/ui";
import { analytics } from "../../lib/analytics";
import { AgentMiniAvatar } from "./experience-card";
import { UpdateChecker } from "./update-checker";
import { PairDeviceDialog } from "./pair-device-dialog";
import { CreateWorkspaceDialog } from "../../App";

export function Sidebar({ children }: { children: ReactNode }) {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.current);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrent);

  const agents = useAgentStore((s) => s.agents);
  const currentAgent = useAgentStore((s) => s.current);
  const setCurrentAgent = useAgentStore((s) => s.setCurrent);
  const loadAgents = useAgentStore((s) => s.loadAgents);
  const renameAgent = useAgentStore((s) => s.rename);
  const deleteAgent = useAgentStore((s) => s.delete);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);

  const getById = useAgentCatalogStore((s) => s.getById);
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const setDialogOpen = useUIStore((s) => s.setCreateAgentDialogOpen);

  const sorted = [...agents].sort((a, b) => {
    const aTime = a.lastOpenedAt ?? a.createdAt;
    const bTime = b.lastOpenedAt ?? b.createdAt;
    return bTime.localeCompare(aTime);
  });

  const items = sorted.map((a) => ({
    id: a.id,
    name: a.name,
    icon: <AgentMiniAvatar color={a.color} />,
  }));
  const isTopLevel = viewMode === "dashboard" || viewMode === "connections" || viewMode === "settings";

  const handleWorkspaceSwitch = async (wsId: string) => {
    if (wsId === currentWorkspace?.id) return;
    const ws = workspaces.find((s) => s.id === wsId);
    if (!ws) return;
    setCurrentWorkspace(ws);
    await loadAgents(ws.id);
  };

  const handleCreateWorkspace = () => {
    setCreateWsOpen(true);
  };


  const handleSelectAgent = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    setCurrentAgent(agent);
    const def = getById(agent.configId);
    const tab = def?.config.defaultTab ?? "chat";
    analytics.track("tab_switched", { tab });
    setViewMode(tab);
  };

  const handleRename = async (agentId: string, newName: string) => {
    if (!currentWorkspace) return;
    await renameAgent(currentWorkspace.id, agentId, newName);
  };

  const handleDelete = (agentId: string) => {
    setPendingDeleteId(agentId);
  };

  const confirmDelete = async () => {
    if (!currentWorkspace || !pendingDeleteId) return;
    await deleteAgent(currentWorkspace.id, pendingDeleteId);
    setPendingDeleteId(null);
  };

  return (
    <>
    <ConfirmDialog
      open={pendingDeleteId !== null}
      onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
      title="Delete agent?"
      description="This will permanently delete the agent and all its data. This cannot be undone."
      confirmLabel="Delete"
      onConfirm={confirmDelete}
    />
    <CreateWorkspaceDialog open={createWsOpen} onOpenChange={setCreateWsOpen} />
    <PairDeviceDialog isOpen={pairOpen} onClose={() => setPairOpen(false)} />
    <div className="flex h-full flex-1 min-w-0">
      <AppSidebar
        header={
          <WorkspaceSwitcher
            workspaces={workspaces}
            currentId={currentWorkspace?.id ?? null}
            currentName={currentWorkspace?.name ?? "Select workspace"}
            onSwitch={handleWorkspaceSwitch}
            onCreate={handleCreateWorkspace}
          />
        }
        navItems={[
          {
            id: "dashboard",
            label: "Mission Control",
            icon: <LayoutDashboard className="h-4 w-4" />,
            onClick: () => setViewMode("dashboard"),
          },
          {
            id: "connections",
            label: "Integrations",
            icon: <Blend className="h-4 w-4" />,
            onClick: () => setViewMode("connections"),
          },
          {
            id: "settings",
            label: "Settings",
            icon: <Settings className="h-4 w-4" />,
            onClick: () => setViewMode("settings"),
          },
          {
            id: "connect-phone",
            label: "Connect phone",
            icon: <Smartphone className="h-4 w-4" />,
            trailing: (
              <Badge
                variant="outline"
                className="h-4 px-1.5 text-[9px] font-semibold tracking-wider text-muted-foreground"
              >
                BETA
              </Badge>
            ),
            onClick: () => setPairOpen(true),
          },
        ]}
        activeNavId={isTopLevel ? viewMode : undefined}
        sectionLabel="Your Agents"
        items={items}
        selectedId={!isTopLevel ? currentAgent?.id ?? null : null}
        onSelect={handleSelectAgent}
        onAdd={() => setDialogOpen(true)}
        onRename={handleRename}
        onDelete={handleDelete}
        footer={<UpdateChecker />}
      >
        <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
          {children}
        </div>
      </AppSidebar>
    </div>
    </>
  );
}
