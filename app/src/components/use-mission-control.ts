import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { KanbanItem } from "@houston-ai/board";
import type { FeedItem } from "@houston-ai/chat";
import { useHoustonEvent } from "@houston-ai/core";
import type { HoustonEvent } from "@houston-ai/core";
import { useFeedStore } from "../stores/feeds";
import { tauriConversations, tauriTasks, tauriChat } from "../lib/tauri";
import type { Workspace } from "../lib/types";

export function useMissionControl(workspaces: Workspace[]) {
  const feedItems = useFeedStore((s) => s.items);
  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);

  const [items, setItems] = useState<KanbanItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const wsMapRef = useRef<Record<string, string>>({});

  const paths = useMemo(
    () => workspaces.map((ws) => ws.folderPath),
    [workspaces],
  );

  const loadAll = useCallback(async () => {
    if (paths.length === 0) return;
    try {
      const convos = await tauriConversations.listAll(paths);
      const map: Record<string, string> = {};
      setItems(
        convos
          .filter((c) => c.type === "task" && c.status)
          .map((c) => {
            map[c.id] = c.workspace_path;
            return {
              id: c.id,
              title: c.title,
              subtitle: c.workspace_name,
              group: c.workspace_name,
              status: c.status!,
              updatedAt: c.updated_at ?? new Date().toISOString(),
              metadata: { workspacePath: c.workspace_path },
            };
          }),
      );
      wsMapRef.current = map;
    } catch (e) {
      console.error("[mission-control] Failed to load:", e);
    }
  }, [paths]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleEvent = useCallback(
    (payload: HoustonEvent) => {
      if (payload.type === "SessionStatus") {
        const { session_key, status } = payload.data as {
          session_key: string;
          status: string;
        };
        if (status === "completed" || status === "error") {
          setLoading((prev) => ({ ...prev, [session_key]: false }));
        }
        if (status === "completed" && session_key.startsWith("task-")) {
          const taskId = session_key.replace("task-", "");
          setItems((prev) =>
            prev.map((i) =>
              i.id === taskId ? { ...i, status: "needs_you" } : i,
            ),
          );
          const wsPath = wsMapRef.current[taskId];
          if (wsPath) {
            tauriTasks
              .update(wsPath, taskId, { status: "needs_you" })
              .catch(console.error);
          }
        }
      } else if (
        payload.type === "IssuesChanged" ||
        payload.type === "ConversationsChanged"
      ) {
        loadAll();
      }
    },
    [loadAll],
  );
  useHoustonEvent<HoustonEvent>("houston-event", handleEvent);

  // History loader for AIBoard — resolves workspace path from task ID
  const loadHistory = useCallback(
    async (sessionKey: string): Promise<FeedItem[]> => {
      const taskId = sessionKey.replace("task-", "");
      const wsPath = wsMapRef.current[taskId];
      if (!wsPath) return [];
      const history = await tauriChat.loadHistory(wsPath, sessionKey);
      return history as FeedItem[];
    },
    [],
  );

  const handleDelete = useCallback(
    async (item: KanbanItem) => {
      const wsPath = wsMapRef.current[item.id];
      if (!wsPath) return;
      await tauriTasks.delete(wsPath, item.id);
      if (selectedId === item.id) setSelectedId(null);
      await loadAll();
    },
    [selectedId, loadAll],
  );

  const handleApprove = useCallback(
    async (item: KanbanItem) => {
      const wsPath = wsMapRef.current[item.id];
      if (!wsPath) return;
      await tauriTasks.update(wsPath, item.id, { status: "done" });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "done" } : i,
        ),
      );
    },
    [],
  );

  const handleSendMessage = useCallback(
    async (sessionKey: string, text: string) => {
      const taskId = sessionKey.replace("task-", "");
      const wsPath = wsMapRef.current[taskId];
      if (!wsPath) return;
      pushFeedItem(sessionKey, { feed_type: "user_message", data: text });
      setLoading((prev) => ({ ...prev, [sessionKey]: true }));
      setItems((prev) =>
        prev.map((i) =>
          i.id === taskId ? { ...i, status: "running" } : i,
        ),
      );
      tauriTasks.update(wsPath, taskId, { status: "running" }).catch(console.error);
      tauriChat.send(wsPath, text, sessionKey);
    },
    [pushFeedItem],
  );

  const handleCreate = useCallback(
    async (workspacePath: string, text: string) => {
      const title = text.length > 80 ? text.slice(0, 77) + "..." : text;
      const task = await tauriTasks.create(workspacePath, title, text);
      const sessionKey = `task-${task.id}`;
      pushFeedItem(sessionKey, { feed_type: "user_message", data: text });
      setLoading((prev) => ({ ...prev, [sessionKey]: true }));
      await tauriTasks.update(workspacePath, task.id, { status: "running" });
      tauriChat.send(workspacePath, text, sessionKey);
      await loadAll();
      setSelectedId(task.id);
    },
    [pushFeedItem, loadAll],
  );

  return {
    items,
    selectedId,
    setSelectedId,
    loading,
    feedItems,
    loadHistory,
    handleDelete,
    handleApprove,
    handleSendMessage,
    handleCreate,
  };
}
