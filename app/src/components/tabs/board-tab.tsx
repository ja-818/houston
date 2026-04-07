import { useState, useEffect, useCallback } from "react";
import { AIBoard } from "@houston-ai/board";
import type { KanbanItem } from "@houston-ai/board";
import type { FeedItem } from "@houston-ai/chat";
import { useFeedStore } from "../../stores/feeds";
import { useUIStore } from "../../stores/ui";
import { tauriTasks, tauriChat } from "../../lib/tauri";
import type { TabProps } from "../../lib/types";

export default function BoardTab({ workspace }: TabProps) {
  const [items, setItems] = useState<KanbanItem[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const path = workspace.folderPath;

  // Read and consume pending selection from Mission Control
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

  const sessionStatusVersion = useUIStore((s) => s.sessionStatusVersion);
  useEffect(() => {
    if (sessionStatusVersion > 0) loadTasks();
  }, [sessionStatusVersion, loadTasks]);

  const loadHistory = useCallback(
    async (sessionKey: string) => {
      const history = await tauriChat.loadHistory(path, sessionKey);
      return history as FeedItem[];
    },
    [path],
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
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "done" } : i)),
      );
    },
    [path],
  );

  const handleCreateConversation = useCallback(
    async (text: string) => {
      const title = text.length > 80 ? text.slice(0, 77) + "..." : text;
      const task = await tauriTasks.create(path, title, text);
      const sessionKey = `task-${task.id}`;
      pushFeedItem(sessionKey, { feed_type: "user_message", data: text });
      setLoading((prev) => ({ ...prev, [sessionKey]: true }));
      await tauriTasks.update(path, task.id, { status: "running" });
      await loadTasks();
      tauriChat.send(path, text, sessionKey);
      return task.id;
    },
    [path, pushFeedItem, loadTasks],
  );

  const handleSendMessage = useCallback(
    async (sessionKey: string, text: string) => {
      pushFeedItem(sessionKey, { feed_type: "user_message", data: text });
      setLoading((prev) => ({ ...prev, [sessionKey]: true }));
      if (sessionKey.startsWith("task-")) {
        const taskId = sessionKey.replace("task-", "");
        setItems((prev) =>
          prev.map((i) => (i.id === taskId ? { ...i, status: "running" } : i)),
        );
        tauriTasks.update(path, taskId, { status: "running" }).catch(console.error);
      }
      tauriChat.send(path, text, sessionKey);
    },
    [path, pushFeedItem],
  );

  return (
    <AIBoard
      items={items}
      selectedId={selectedId}
      onSelect={setSelectedId}
      feedItems={feedItems}
      isLoading={loading}
      onDelete={handleDelete}
      onApprove={handleApprove}
      onCreateConversation={handleCreateConversation}
      onSendMessage={handleSendMessage}
      onLoadHistory={loadHistory}
    />
  );
}
