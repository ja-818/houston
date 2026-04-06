import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Badge,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  Button,
} from "@houston-ai/core";
import { ArrowLeft } from "lucide-react";
import { tauriTasks } from "../lib/tauri";
import type { Workspace } from "../lib/types";

interface TaskRow {
  id: string;
  title: string;
  status: string;
  updated_at?: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  running: "default",
  needs_you: "destructive",
  done: "secondary",
  queue: "outline",
  cancelled: "outline",
};

const STATUS_LABEL: Record<string, string> = {
  running: "Running",
  needs_you: "Needs you",
  done: "Done",
  queue: "Queued",
  cancelled: "Cancelled",
};

function formatRelative(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface Props {
  workspace: Workspace;
  onBack: () => void;
  onSelect: (taskId: string) => void;
}

export function DashboardConversations({ workspace, onBack, onSelect }: Props) {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await tauriTasks.list(workspace.folderPath);
      setTasks(
        result.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          updated_at: t.updated_at,
        })),
      );
    } catch (e) {
      console.error("[dashboard] Failed to load tasks:", e);
    } finally {
      setLoading(false);
    }
  }, [workspace.folderPath]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="size-4" />
        All workspaces
      </button>

      <h1 className="text-[28px] font-normal text-foreground mb-6">
        {workspace.name}
      </h1>

      {loading ? null : tasks.length === 0 ? (
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>No conversations yet</EmptyTitle>
            <EmptyDescription>
              Open this workspace to start delegating work.
            </EmptyDescription>
          </EmptyHeader>
          <Button
            className="mt-4 rounded-full"
            onClick={() => onSelect("")}
          >
            Open workspace
          </Button>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-black/5 px-4 py-3"
              onClick={() => onSelect(task.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium truncate">
                  {task.title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {task.updated_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(task.updated_at)}
                    </span>
                  )}
                  <Badge
                    variant={STATUS_VARIANT[task.status] ?? "outline"}
                    className="rounded-full text-xs"
                  >
                    {STATUS_LABEL[task.status] ?? task.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
