import type { ReactNode } from "react";
import { LayoutDashboard, Blend, Settings } from "lucide-react";
import { Button } from "@houston-ai/core";
import { AppSidebar, SpaceSwitcher } from "@houston-ai/layout";
import { useSpaceStore } from "../../stores/spaces";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useExperienceStore } from "../../stores/experiences";
import { useUIStore } from "../../stores/ui";

export function Sidebar({ children }: { children: ReactNode }) {
  const spaces = useSpaceStore((s) => s.spaces);
  const currentSpace = useSpaceStore((s) => s.current);
  const setCurrentSpace = useSpaceStore((s) => s.setCurrent);
  const createSpace = useSpaceStore((s) => s.create);

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const current = useWorkspaceStore((s) => s.current);
  const setCurrent = useWorkspaceStore((s) => s.setCurrent);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const renameWs = useWorkspaceStore((s) => s.rename);
  const deleteWs = useWorkspaceStore((s) => s.delete);

  const getById = useExperienceStore((s) => s.getById);
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const setDialogOpen = useUIStore((s) => s.setCreateWorkspaceDialogOpen);

  const sorted = [...workspaces].sort((a, b) => {
    const aTime = a.lastOpenedAt ?? a.createdAt;
    const bTime = b.lastOpenedAt ?? b.createdAt;
    return bTime.localeCompare(aTime);
  });

  const items = sorted.map((ws) => ({ id: ws.id, name: ws.name }));
  const isTopLevel = viewMode === "dashboard" || viewMode === "connections";

  const handleSpaceSwitch = async (spaceId: string) => {
    if (spaceId === currentSpace?.id) return;
    const space = spaces.find((s) => s.id === spaceId);
    if (!space) return;
    setCurrentSpace(space);
    await loadWorkspaces(space.id);
  };

  const handleCreateSpace = async () => {
    const name = window.prompt("Space name");
    if (!name?.trim()) return;
    const space = await createSpace(name.trim());
    setCurrentSpace(space);
    await loadWorkspaces(space.id);
  };

  const handleSelectWorkspace = (wsId: string) => {
    const ws = workspaces.find((w) => w.id === wsId);
    if (!ws) return;
    setCurrent(ws);
    const exp = getById(ws.experienceId);
    setViewMode(exp?.manifest.defaultTab ?? "chat");
  };

  const handleRename = async (wsId: string, newName: string) => {
    if (!currentSpace) return;
    await renameWs(currentSpace.id, wsId, newName);
  };

  const handleDelete = async (wsId: string) => {
    if (!currentSpace) return;
    if (!window.confirm("Delete this workspace? This cannot be undone.")) return;
    await deleteWs(currentSpace.id, wsId);
  };

  return (
    <div className="flex h-full flex-1 min-w-0">
      <AppSidebar
        header={
          <SpaceSwitcher
            spaces={spaces}
            currentId={currentSpace?.id ?? null}
            currentName={currentSpace?.name ?? "Select space"}
            onSwitch={handleSpaceSwitch}
            onCreate={handleCreateSpace}
            trailing={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 rounded-lg"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Button>
            }
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
            label: "Apps",
            icon: <Blend className="h-4 w-4" />,
            onClick: () => setViewMode("connections"),
          },
        ]}
        activeNavId={isTopLevel ? viewMode : undefined}
        sectionLabel="Your AI Workspaces"
        items={items}
        selectedId={!isTopLevel ? current?.id ?? null : null}
        onSelect={handleSelectWorkspace}
        onAdd={() => setDialogOpen(true)}
        onRename={handleRename}
        onDelete={handleDelete}
      >
        <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
          {children}
        </div>
      </AppSidebar>
    </div>
  );
}
