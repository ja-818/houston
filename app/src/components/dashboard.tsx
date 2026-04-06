import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  Button,
} from "@houston-ai/core";
import { ContentArea } from "./shell/content-area";
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
      <ContentArea centered>
        <div className="flex-1 flex items-center justify-center">
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>No AI Workspaces yet</EmptyTitle>
              <EmptyDescription>
                Create your first AI Workspace to get started.
              </EmptyDescription>
            </EmptyHeader>
            <Button
              className="mt-4 rounded-full"
              onClick={() => setDialogOpen(true)}
            >
              Create your first AI Workspace
            </Button>
          </Empty>
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea centered maxWidth="max-w-5xl">
      <div className="flex-1 overflow-auto p-8">
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
    </ContentArea>
  );
}
