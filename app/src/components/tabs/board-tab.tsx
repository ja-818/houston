import { useState, useEffect, useCallback } from "react";
import { KanbanBoard } from "@houston-ai/board";
import type { KanbanItem } from "@houston-ai/board";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  Button,
  useHoustonEvent,
} from "@houston-ai/core";
import type { HoustonEvent } from "@houston-ai/core";
import { SplitView } from "@houston-ai/layout";
import { Plus } from "lucide-react";
import { tauriTasks } from "../../lib/tauri";
import { ContentArea } from "../shell/content-area";
import type { TabProps } from "../../lib/types";
import { NewConversationDialog } from "./new-conversation-dialog";
import { BoardDetail } from "./board-detail";

const COLUMNS = [
  { id: "queue", label: "Queue", statuses: ["queue"] },
  { id: "running", label: "Running", statuses: ["running"] },
  { id: "needs_you", label: "Needs you", statuses: ["needs_you"] },
  { id: "done", label: "Done", statuses: ["done"] },
];

export default function BoardTab({ workspace }: TabProps) {
  const [items, setItems] = useState<KanbanItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const path = workspace.folderPath;

  const loadTasks = useCallback(async () => {
    try {
      const tasks = await tauriTasks.list(path);
      setItems(
        tasks.map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: t.description,
          status: t.status,
          updatedAt: new Date().toISOString(),
        })),
      );
    } catch (e) {
      console.error("[board] Failed to load tasks:", e);
    }
  }, [path]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Auto-refresh when session status changes (task might move columns)
  const handleEvent = useCallback(
    (payload: HoustonEvent) => {
      if (
        payload.type === "SessionStatus" ||
        payload.type === "IssuesChanged" ||
        payload.type === "ConversationsChanged"
      ) {
        loadTasks();
      }
    },
    [loadTasks],
  );
  useHoustonEvent<HoustonEvent>("houston-event", handleEvent);

  const handleCreate = useCallback(
    async (title: string, description: string) => {
      await tauriTasks.create(path, title, description || undefined);
      await loadTasks();
    },
    [path, loadTasks],
  );

  const handleDelete = useCallback(
    async (item: KanbanItem) => {
      await tauriTasks.delete(path, item.id);
      if (selectedId === item.id) setSelectedId(null);
      await loadTasks();
    },
    [path, selectedId, loadTasks],
  );

  const handleApprove = useCallback(
    async (item: KanbanItem) => {
      await tauriTasks.update(path, item.id, { status: "done" });
      await loadTasks();
    },
    [path, loadTasks],
  );

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;

  const newButton = (
    <Button
      onClick={() => setDialogOpen(true)}
      className="rounded-full gap-1.5"
      size="sm"
    >
      <Plus className="size-4" />
      New conversation
    </Button>
  );

  const emptyState = (
    <Empty className="border-0">
      <EmptyHeader>
        <EmptyTitle>No conversations yet</EmptyTitle>
        <EmptyDescription>
          Start one to delegate work to your AI agent.
        </EmptyDescription>
      </EmptyHeader>
      <div className="mt-4">{newButton}</div>
    </Empty>
  );

  const board = (
    <div className="flex flex-col h-full">
      {items.length > 0 && (
        <div className="shrink-0 flex items-center justify-between px-3 pt-3">
          {newButton}
        </div>
      )}
      <KanbanBoard
        columns={COLUMNS}
        items={items}
        selectedId={selectedId}
        runningStatuses={["running"]}
        approveStatuses={["needs_you"]}
        onSelect={(item) => setSelectedId(item.id)}
        onDelete={handleDelete}
        onApprove={handleApprove}
        emptyState={emptyState}
      />
    </div>
  );

  const content = selectedItem ? (
    <SplitView
      left={board}
      right={
        <BoardDetail
          key={selectedItem.id}
          item={selectedItem}
          workspacePath={path}
          onClose={() => setSelectedId(null)}
          onTaskUpdated={loadTasks}
        />
      }
    />
  ) : (
    board
  );

  return (
    <ContentArea>
      {content}
      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
      />
    </ContentArea>
  );
}
