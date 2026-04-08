import { useState, useEffect, useCallback, useRef } from "react";
import { AIBoard } from "@houston-ai/board";
import type { KanbanItem } from "@houston-ai/board";
import type { FeedItem } from "@houston-ai/chat";

import { useFeedStore } from "../../stores/feeds";
import { useUIStore } from "../../stores/ui";
import { useActivity, useDeleteActivity, useUpdateActivity, useCreateActivity } from "../../hooks/queries";
import { tauriActivity, tauriChat, tauriAttachments, withAttachmentPaths } from "../../lib/tauri";
import { useFileToolRenderer } from "../../hooks/use-file-tool-renderer";
import type { TabProps } from "../../lib/types";
import { useDetailPanelContainer } from "../shell/detail-panel-context";
import { getHoustonLogo } from "../shell/experience-card";

// Module-level so it persists across component remounts (tab switches)
const summarizedActivityIds = new Set<string>();

function ThinkingIndicator({ color }: { color?: string }) {
  const logo = getHoustonLogo(color);
  return (
    <div className="py-2 flex items-center gap-2">
      <span
        className="size-6 rounded-full flex items-center justify-center animate-pulse"
        style={{ backgroundColor: color ?? "#e5e5e5" }}
      >
        <img src={logo} alt="" className="size-3.5 object-contain" />
      </span>
    </div>
  );
}


export default function BoardTab({ agent }: TabProps) {
  const panelContainer = useDetailPanelContainer();
  const path = agent.folderPath;
  const { isSpecialTool, renderToolResult, renderTurnSummary } = useFileToolRenderer(path);
  const { data: rawItems } = useActivity(path);
  const deleteActivity = useDeleteActivity(path);
  const updateActivity = useUpdateActivity(path);
  const createActivity = useCreateActivity(path);
  const setOnStartMission = useUIStore((s) => s.setOnStartMission);
  const setMissionPanelOpen = useUIStore((s) => s.setMissionPanelOpen);
  const addToast = useUIStore((s) => s.addToast);
  const handleNotice = useCallback(
    (message: string) => addToast({ title: message }),
    [addToast],
  );
  const openerRef = useRef<(() => void) | null>(null);

  const items: KanbanItem[] = (rawItems ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: t.description,
    status: t.status,
    updatedAt: t.updated_at ?? new Date().toISOString(),
    group: t.routine_id ? "routine" : undefined,
    metadata: {
      ...(t.session_key ? { sessionKey: t.session_key } : {}),
      ...(t.routine_id ? { routineId: t.routine_id } : {}),
    },
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
  // Call Haiku once per activity to generate a concise title + description.
  // Skip if already summarized (title no longer matches the raw user message).
  useEffect(() => {
    if (!rawItems) return;
    for (const activity of rawItems) {
      if (activity.status !== "running") continue;
      if (summarizedActivityIds.has(activity.id)) continue;

      // The original title is the description truncated to 80 chars.
      // If they diverge, Haiku already ran — skip.
      const desc = activity.description ?? "";
      const originalTitle = desc.length > 80 ? desc.slice(0, 77) + "..." : desc;
      if (activity.title !== originalTitle) continue;

      summarizedActivityIds.add(activity.id);
      tauriChat
        .summarize(desc)
        .then(({ title, description }) => {
          tauriActivity
            .update(path, activity.id, { title, description })
            .catch(console.error);
        })
        .catch(console.error);
    }
  }, [rawItems, path]);

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
    async (text: string, files: File[]) => {
      const title = text.length > 80 ? text.slice(0, 77) + "..." : text;
      const item = await createActivity.mutateAsync({ title, description: text });
      const sessionKey = `activity-${item.id}`;
      const visible = files.length > 0
        ? `${text}${text ? "\n\n" : ""}Attached: ${files.map((f) => f.name).join(", ")}`
        : text;
      pushFeedItem(sessionKey, { feed_type: "user_message", data: visible });
      setLoading((prev) => ({ ...prev, [sessionKey]: true }));
      await updateActivity.mutateAsync({ activityId: item.id, update: { status: "running" } });
      const paths = await tauriAttachments.save(`activity-${item.id}`, files);
      const prompt = withAttachmentPaths(text, paths);
      tauriChat.send(path, prompt, sessionKey);
      return item.id;
    },
    [path, pushFeedItem, createActivity, updateActivity],
  );

  // Derive the session key for an activity, using custom key if set by routine runner
  const sessionKeyFor = useCallback(
    (activityId: string) => {
      const item = (rawItems ?? []).find((t) => t.id === activityId);
      return item?.session_key ?? `activity-${activityId}`;
    },
    [rawItems],
  );

  const handleStopSession = useCallback(
    (sessionKey: string) => {
      tauriChat.stop(sessionKey).catch(console.error);
    },
    [],
  );

  const handleSendMessage = useCallback(
    async (sessionKey: string, text: string, files: File[]) => {
      const visible = files.length > 0
        ? `${text}${text ? "\n\n" : ""}Attached: ${files.map((f) => f.name).join(", ")}`
        : text;
      pushFeedItem(sessionKey, { feed_type: "user_message", data: visible });
      setLoading((prev) => ({ ...prev, [sessionKey]: true }));
      // Find the activity ID from the session key to update its status
      const activity = (rawItems ?? []).find(
        (t) => (t.session_key ?? `activity-${t.id}`) === sessionKey,
      );
      if (activity) {
        tauriActivity.update(path, activity.id, { status: "running" }).catch(console.error);
      }
      // Scope by activity id so attachments outlive vacations and are wiped
      // when the activity (conversation) is deleted.
      const scopeId = activity ? `activity-${activity.id}` : sessionKey;
      const paths = await tauriAttachments.save(scopeId, files);
      const prompt = withAttachmentPaths(text, paths);
      tauriChat.send(path, prompt, sessionKey);
    },
    [path, pushFeedItem, rawItems],
  );

  return (
    <AIBoard
      items={items}
      selectedId={selectedId}
      onSelect={setSelectedId}
      panelContainer={panelContainer}
      feedItems={feedItems}
      isLoading={loadingState}
      sessionKeyFor={sessionKeyFor}
      onDelete={handleDelete}
      onApprove={handleApprove}
      onCreateConversation={handleCreateConversation}
      onSendMessage={handleSendMessage}
      onLoadHistory={loadHistory}
      onNewPanelOpenerReady={handleOpenerReady}
      onPanelOpenChange={setMissionPanelOpen}
      onStopSession={handleStopSession}
      isSpecialTool={isSpecialTool}
      renderToolResult={renderToolResult}
      renderTurnSummary={renderTurnSummary}
      onNotice={handleNotice}
      thinkingIndicator={<ThinkingIndicator color={agent.color} />}
      panelAgentName={agent.name}
      panelAvatar={
        <span
          className="size-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: agent.color ?? "#e5e5e5" }}
        >
          <img src={getHoustonLogo(agent.color)} alt="Houston" className="size-6 object-contain" />
        </span>
      }
    />
  );
}
