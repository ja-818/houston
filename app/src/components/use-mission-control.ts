import { useState, useCallback, useMemo, useRef } from "react";
import type { KanbanItem } from "@houston-ai/board";
import type { FeedItem } from "@houston-ai/chat";
import { useFeedStore } from "../stores/feeds";
import { useAllConversations } from "../hooks/queries";
import { tauriActivity, tauriChat } from "../lib/tauri";
import type { Workspace } from "../lib/types";

export function useMissionControl(workspaces: Workspace[]) {
  const feedItems = useFeedStore((s) => s.items);
  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const wsMapRef = useRef<Record<string, string>>({});

  const paths = useMemo(
    () => workspaces.map((ws) => ws.folderPath),
    [workspaces],
  );

  const { data: convos } = useAllConversations(paths);

  const items: KanbanItem[] = useMemo(() => {
    if (!convos) return [];
    const map: Record<string, string> = {};
    const result = convos
      .filter((c) => c.type === "activity" && c.status)
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
      });
    wsMapRef.current = map;
    return result;
  }, [convos]);

  const loadHistory = useCallback(
    async (sessionKey: string): Promise<FeedItem[]> => {
      const activityId = sessionKey.replace("activity-", "");
      const wsPath = wsMapRef.current[activityId];
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
      await tauriActivity.delete(wsPath, item.id);
      if (selectedId === item.id) setSelectedId(null);
    },
    [selectedId],
  );

  const handleApprove = useCallback(
    async (item: KanbanItem) => {
      const wsPath = wsMapRef.current[item.id];
      if (!wsPath) return;
      await tauriActivity.update(wsPath, item.id, { status: "done" });
    },
    [],
  );

  const handleSendMessage = useCallback(
    async (sessionKey: string, text: string) => {
      const activityId = sessionKey.replace("activity-", "");
      const wsPath = wsMapRef.current[activityId];
      if (!wsPath) return;
      pushFeedItem(sessionKey, { feed_type: "user_message", data: text });
      setLoading((prev) => ({ ...prev, [sessionKey]: true }));
      tauriActivity.update(wsPath, activityId, { status: "running" }).catch(console.error);
      tauriChat.send(wsPath, text, sessionKey);
    },
    [pushFeedItem],
  );

  const handleCreate = useCallback(
    async (workspacePath: string, text: string) => {
      const title = text.length > 80 ? text.slice(0, 77) + "..." : text;
      const item = await tauriActivity.create(workspacePath, title, text);
      const sessionKey = `activity-${item.id}`;
      pushFeedItem(sessionKey, { feed_type: "user_message", data: text });
      setLoading((prev) => ({ ...prev, [sessionKey]: true }));
      await tauriActivity.update(workspacePath, item.id, { status: "running" });
      tauriChat.send(workspacePath, text, sessionKey);
      setSelectedId(item.id);
    },
    [pushFeedItem],
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
