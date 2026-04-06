import type { ReactNode } from "react";
import { LayoutDashboard, Link2, Plus } from "lucide-react";
import { Button, ScrollArea } from "@houston-ai/core";
import { useOrganizationStore } from "../../stores/organizations";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useExperienceStore } from "../../stores/experiences";
import { useUIStore } from "../../stores/ui";
import { OrgSwitcher, SidebarNavItem } from "./sidebar-parts";

export function Sidebar({ children }: { children: ReactNode }) {
  const orgs = useOrganizationStore((s) => s.organizations);
  const currentOrg = useOrganizationStore((s) => s.current);
  const setCurrentOrg = useOrganizationStore((s) => s.setCurrent);
  const createOrg = useOrganizationStore((s) => s.create);

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const current = useWorkspaceStore((s) => s.current);
  const setCurrent = useWorkspaceStore((s) => s.setCurrent);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);

  const getById = useExperienceStore((s) => s.getById);
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const setDialogOpen = useUIStore((s) => s.setCreateWorkspaceDialogOpen);

  const sorted = [...workspaces].sort((a, b) => {
    const aTime = a.lastOpenedAt ?? a.createdAt;
    const bTime = b.lastOpenedAt ?? b.createdAt;
    return bTime.localeCompare(aTime);
  });

  const handleOrgSwitch = async (orgId: string) => {
    if (orgId === currentOrg?.id) return;
    const org = orgs.find((o) => o.id === orgId);
    if (!org) return;
    setCurrentOrg(org);
    await loadWorkspaces(org.id);
  };

  const handleCreateOrg = async () => {
    const name = window.prompt("Organization name");
    if (!name?.trim()) return;
    const org = await createOrg(name.trim());
    setCurrentOrg(org);
    await loadWorkspaces(org.id);
  };

  const handleSelectWorkspace = (wsId: string) => {
    const ws = workspaces.find((w) => w.id === wsId);
    if (!ws) return;
    setCurrent(ws);
    const exp = getById(ws.experienceId);
    setViewMode(exp?.manifest.defaultTab ?? "chat");
  };

  const isTopLevel = viewMode === "dashboard" || viewMode === "connections";

  return (
    <div className="flex h-full">
      <aside className="w-[200px] flex-shrink-0 bg-secondary border-r border-border flex flex-col">
        <OrgSwitcher
          orgs={orgs}
          currentId={currentOrg?.id ?? null}
          currentName={currentOrg?.name ?? "Select org"}
          onSwitch={handleOrgSwitch}
          onCreate={handleCreateOrg}
        />

        <nav className="px-2 py-1 space-y-0.5">
          <SidebarNavItem
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Dashboard"
            active={viewMode === "dashboard"}
            onClick={() => setViewMode("dashboard")}
          />
          <SidebarNavItem
            icon={<Link2 className="h-4 w-4" />}
            label="Connections"
            active={viewMode === "connections"}
            onClick={() => setViewMode("connections")}
          />
        </nav>

        <div className="border-t border-border mx-2 my-1" />

        <div className="px-3 pt-2 pb-1">
          <span className="text-xs font-medium text-muted-foreground">
            Your AI Workspaces
          </span>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-0.5 pb-2">
            {sorted.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws.id)}
                className={`w-full text-left text-sm py-1.5 px-2.5 rounded-lg transition-colors truncate ${
                  !isTopLevel && current?.id === ws.id
                    ? "bg-accent font-medium text-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                {ws.name}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="px-2 pb-3 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground rounded-lg"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New AI Workspace
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
