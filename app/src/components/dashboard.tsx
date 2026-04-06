import { useState } from "react";
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
import { useWorkspaceStore } from "../stores/workspaces";
import { useExperienceStore } from "../stores/experiences";
import { useUIStore } from "../stores/ui";
import { DashboardConversations } from "./dashboard-conversations";
import type { Workspace } from "../lib/types";

export function Dashboard() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const setCurrent = useWorkspaceStore((s) => s.setCurrent);
  const getById = useExperienceStore((s) => s.getById);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const setTaskPanelId = useUIStore((s) => s.setTaskPanelId);
  const setDialogOpen = useUIStore((s) => s.setCreateWorkspaceDialogOpen);

  const [drilldown, setDrilldown] = useState<Workspace | null>(null);

  const handleConversationSelect = (ws: Workspace, taskId: string) => {
    setCurrent(ws);
    if (taskId) {
      setTaskPanelId(taskId);
      setViewMode("board");
    } else {
      const exp = getById(ws.experienceId);
      setViewMode(exp?.manifest.defaultTab ?? "chat");
    }
  };

  if (workspaces.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
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
    );
  }

  if (drilldown) {
    return (
      <div className="h-full overflow-auto">
        <DashboardConversations
          workspace={drilldown}
          onBack={() => setDrilldown(null)}
          onSelect={(taskId) => handleConversationSelect(drilldown, taskId)}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto w-full px-6 py-8">
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
                onClick={() => setDrilldown(ws)}
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
