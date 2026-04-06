import { useState, useEffect, useCallback } from "react";
import { AIBoard } from "@houston-ai/board";
import type { KanbanItem } from "@houston-ai/board";
import { useHoustonEvent } from "@houston-ai/core";
import type { HoustonEvent } from "@houston-ai/core";
import { useFeedStore } from "../../stores/feeds";
import { useUIStore } from "../../stores/ui";
import { tauriTasks, tauriChat } from "../../lib/tauri";
import type { TabProps } from "../../lib/types";

export default function BoardTab({ workspace }: TabProps) {
  const [items, setItems] = useState<KanbanItem[]>([]);
  const path = workspace.folderPath;

  // Read and consume pending selection from dashboard drill-down
  const pendingId = useUIStore((s) => s.taskPanelId);
  const clearPending = useUIStore((s) => s.setTaskPanelId);
  const [selectedId, setSelectedId] = useState<string | null>(pendingId);
  useEffect(() => {
    if (pendingId) {
      setSelectedId(pendingId);
      clearPending(null);
    }
  }, [pendingId, clearPending]);
  const feedItems = useFeedStore((s) => s.items);
  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);

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

  const handleCreateConversation = useCallback(
    async (text: string) => {
      pushFeedItem("new-conversation", { feed_type: "user_message", data: text });
      const title = text.length > 80 ? text.slice(0, 77) + "..." : text;
      const task = await tauriTasks.create(path, title, text);
      await tauriTasks.update(path, task.id, { status: "running" });
      await tauriChat.send(path, text, `task-${task.id}`);
      await loadTasks();
      return task.id;
    },
    [path, pushFeedItem, loadTasks],
  );

  const handleSendMessage = useCallback(
    async (sessionKey: string, text: string) => {
      pushFeedItem(sessionKey, { feed_type: "user_message", data: text });
      await tauriChat.send(path, text, sessionKey);
    },
    [path, pushFeedItem],
  );

  return (
    <AIBoard
      items={items}
      selectedId={selectedId}
      onSelect={setSelectedId}
      feedItems={feedItems}
      onDelete={handleDelete}
      onApprove={handleApprove}
      onCreateConversation={handleCreateConversation}
      onSendMessage={handleSendMessage}
    />
  );
}
