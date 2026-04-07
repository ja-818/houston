import { useState, useEffect, useCallback, useRef } from "react";
import { AIBoard } from "@houston-ai/board";
import type { KanbanItem } from "@houston-ai/board";
import type { FeedItem } from "@houston-ai/chat";
import { AgentAvatar } from "@houston-ai/core";
import { useFeedStore } from "../../stores/feeds";
import { useUIStore } from "../../stores/ui";
import { useActivity, useDeleteActivity, useUpdateActivity, useCreateActivity } from "../../hooks/queries";
import { tauriActivity, tauriChat } from "../../lib/tauri";
import type { TabProps } from "../../lib/types";
import houstonIcon from "../../assets/houston-icon.svg";

function ThinkingIndicator() {
  return (
    <div className="py-2 flex items-center gap-2">
      <img
        src={houstonIcon}
        alt="Houston"
        className="size-6 rounded-full animate-pulse"
      />
    </div>
  );
}

export default function BoardTab({ workspace }: TabProps) {
  const path = workspace.folderPath;
  const { data: rawItems } = useActivity(path);
  const deleteActivity = useDeleteActivity(path);
  const updateActivity = useUpdateActivity(path);
  const createActivity = useCreateActivity(path);
  const setOnStartMission = useUIStore((s) => s.setOnStartMission);
  const setMissionPanelOpen = useUIStore((s) => s.setMissionPanelOpen);
  const openerRef = useRef<(() => void) | null>(null);

  const items: KanbanItem[] = (rawItems ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: t.description,
    status: t.status,
    updatedAt: t.updated_at ?? new Date().toISOString(),
  }));

  // Read and consume pending selection from Mission Control
  const pendingId = useUIStore((s) => s.activityPanelId);
  const clearPending = useUIStore((s) => s.setActivityPanelId);
  const [selectedId, setSelectedId] = useState<string | null>(pendingId);
  useEffect(() => {
    if (pendingId) {
      setSelectedId(pendingId);
      clearPending(null);
    }
  }, [pendingId, clearPending]);

  const feedItems = useFeedStore((s) => s.items);
  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);
  const [loadingState, setLoading] = useState<Record<string, boolean>>({});

  // Register the "Start a Mission" handler in the UI store for the TabBar
  const handleOpenerReady = useCallback(
    (opener: () => void) => {
      openerRef.current = opener;
      setOnStartMission(opener);
    },
    [setOnStartMission],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => setOnStartMission(null);
  }, [setOnStartMission]);

  const loadHistory = useCallback(
    async (sessionKey: string) => {
      const history = await tauriChat.loadHistory(path, sessionKey);
      return history as FeedItem[];
    },
    [path],
  );

  const handleDelete = useCallback(
    async (item: KanbanItem) => {
      await deleteActivity.mutateAsync(item.id);
      if (selectedId === item.id) setSelectedId(null);
    },
    [deleteActivity, selectedId],
  );

  const handleApprove = useCallback(
    async (item: KanbanItem) => {
      await updateActivity.mutateAsync({ activityId: item.id, update: { status: "done" } });
    },
    [updateActivity],
  );

  const handleCreateConversation = useCallback(
    async (text: string) => {
      const title = text.length > 80 ? text.slice(0, 77) + "..." : text;
      const item = await createActivity.mutateAsync({ title, description: text });
      const sessionKey = `activity-${item.id}`;
      pushFeedItem(sessionKey, { feed_type: "user_message", data: text });
      setLoading((prev) => ({ ...prev, [sessionKey]: true }));
      await updateActivity.mutateAsync({ activityId: item.id, update: { status: "running" } });
      tauriChat.send(path, text, sessionKey);
      return item.id;
    },
    [path, pushFeedItem, createActivity, updateActivity],
  );

  const handleSendMessage = useCallback(
    async (sessionKey: string, text: string) => {
      pushFeedItem(sessionKey, { feed_type: "user_message", data: text });
      setLoading((prev) => ({ ...prev, [sessionKey]: true }));
      if (sessionKey.startsWith("activity-")) {
        const activityId = sessionKey.replace("activity-", "");
        tauriActivity.update(path, activityId, { status: "running" }).catch(console.error);
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
      isLoading={loadingState}
      onDelete={handleDelete}
      onApprove={handleApprove}
      onCreateConversation={handleCreateConversation}
      onSendMessage={handleSendMessage}
      onLoadHistory={loadHistory}
      onNewPanelOpenerReady={handleOpenerReady}
      onPanelOpenChange={setMissionPanelOpen}
      thinkingIndicator={<ThinkingIndicator />}
      panelAvatar={
        <AgentAvatar src={houstonIcon} alt="Houston" size="sm" />
      }
    />
  );
}
