import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "@houston-ai/core";
import { useWorkspaceStore } from "../stores/workspaces";
import { useExperienceStore } from "../stores/experiences";
import { useUIStore } from "../stores/ui";

export function Dashboard() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const setCurrent = useWorkspaceStore((s) => s.setCurrent);
  const getById = useExperienceStore((s) => s.getById);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const setDialogOpen = useUIStore((s) => s.setCreateWorkspaceDialogOpen);

  const handleSelect = (wsId: string) => {
    const ws = workspaces.find((w) => w.id === wsId);
    if (!ws) return;
    setCurrent(ws);
    const exp = getById(ws.experienceId);
    setViewMode(exp?.manifest.defaultTab ?? "chat");
  };

  if (workspaces.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground text-sm mb-4">
          No AI Workspaces yet.
        </p>
        <button
          onClick={() => setDialogOpen(true)}
          className="text-sm font-medium text-foreground bg-foreground text-background rounded-full h-9 px-4 hover:opacity-90 transition-opacity"
        >
          Create your first AI Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-[28px] font-normal text-foreground mb-6">
          Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => {
            const exp = getById(ws.experienceId);
            return (
              <Card
                key={ws.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-black/5"
                onClick={() => handleSelect(ws.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {ws.name}
                  </CardTitle>
                  {exp && (
                    <CardDescription className="text-xs">
                      {exp.manifest.name}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-xs rounded-full">
                    AI Workspace
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
