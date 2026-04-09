import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AIBoard } from "@houston-ai/board";
import type { KanbanItem } from "@houston-ai/board";
import type { FeedItem } from "@houston-ai/chat";

import { useFeedStore } from "../../stores/feeds";
import { useUIStore } from "../../stores/ui";
import {
  useActivity,
  useDeleteActivity,
  useUpdateActivity,
  useCreateActivity,
  useConnectedToolkits,
  useConnections,
} from "../../hooks/queries";
import { tauriActivity, tauriChat, tauriAttachments, tauriSystem, withAttachmentPaths } from "../../lib/tauri";
import { useFileToolRenderer } from "../../hooks/use-file-tool-renderer";
import { COMPOSIO_PROBE_SLUGS } from "../../lib/composio-catalog";
import {
  ComposioLinkCard,
  parseComposioToolkitFromHref,
} from "../composio-link-card";
import type { TabProps } from "../../lib/types";
import { useDetailPanelContainer } from "../shell/detail-panel-context";
import { getHoustonLogo } from "../shell/experience-card";

// Module-level so it persists across component remounts (tab switches)
const summarizedActivityIds = new Set<string>();

// Stable empty reference so the feed store selector doesn't return a new
// object every render when this agent has no feeds yet (which would otherwise
// trigger "getSnapshot should be cached" / infinite loop in React).
const EMPTY_FEED_BUCKET: Record<string, never> = Object.freeze({});

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
  const missionPanelOpen = useUIStore((s) => s.missionPanelOpen);
  const addToast = useUIStore((s) => s.addToast);
  const handleNotice = useCallback(
    (message: string) => addToast({ title: message }),
    [addToast],
  );
  const handleOpenLink = useCallback((url: string) => {
    tauriSystem.openUrl(url).catch(console.error);
  }, []);

  // Connection state for inline Composio connect cards. Mirrors the
  // wiring in chat-tab.tsx — both surfaces read from the same shared
  // TanStack Query cache.
  const { data: composioStatus } = useConnections();
  const probeSlugs = useMemo(
    () => (composioStatus?.status === "ok" ? COMPOSIO_PROBE_SLUGS : []),
    [composioStatus?.status],
  );
  const { data: connectedList } = useConnectedToolkits(probeSlugs);
  const connectedSet = useMemo(
    () => new Set(connectedList ?? []),
    [connectedList],
  );
  const renderLink = useCallback(
    ({ href, onOpen }: { href: string; onOpen: () => void }) => {
      const toolkit = parseComposioToolkitFromHref(href);
      if (!toolkit) return undefined;
      return (
        <ComposioLinkCard
          toolkit={toolkit}
          isConnected={connectedSet.has(toolkit)}
          onOpen={onOpen}
        />
      );
    },
    [connectedSet],
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
      // Only navigate if the user isn't already viewing a conversation
      // and hasn't opened the New Mission panel.
      if (!selectedId && !missionPanelOpen) setSelectedId(pendingId);
      clearPending(null);
    }
  }, [pendingId, clearPending, selectedId, missionPanelOpen]);

  // Scope to this agent only — cross-agent bleeding is structurally blocked
  // because AIBoard can only see this agent's slice of the feed store.
  // Return the bucket directly (may be undefined) and fall back to a stable
  // EMPTY_FEED_BUCKET constant below. Selectors must return stable references
  // or React will loop.
  const feedBucket = useFeedStore((s) => s.items[path]);
  const feedItems = feedBucket ?? EMPTY_FEED_BUCKET;
  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);
  const [loadingState, setLoading] = useState<Record<string, boolean>>({});
  // A session is "loading" from the user's perspective whenever its activity
  // is running — not just when WE started it from this component. This catches
  // sessions kicked off elsewhere (onboarding, routines, Mission Control, agent
  // writes) so the ChatPanel shows the Thinking indicator instead of an empty
  // chat while the first streaming event is in flight. Once feed items arrive,
  // ChatPanel's deriveStatus takes over based on feed contents.
  const effectiveLoading = useMemo(() => {
    const out: Record<string, boolean> = { ...loadingState };
    for (const a of rawItems ?? []) {
      if (a.status === "running") {
        const key = a.session_key ?? `activity-${a.id}`;
        out[key] = true;
      }
    }
    return out;
  }, [loadingState, rawItems]);
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
      pushFeedItem(path, sessionKey, { feed_type: "user_message", data: visible });
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
      tauriChat.stop(path, sessionKey).catch(console.error);
    },
    [path],
  );

  const handleSendMessage = useCallback(
    async (sessionKey: string, text: string, files: File[]) => {
      const visible = files.length > 0
        ? `${text}${text ? "\n\n" : ""}Attached: ${files.map((f) => f.name).join(", ")}`
        : text;
      pushFeedItem(path, sessionKey, { feed_type: "user_message", data: visible });
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
      isLoading={effectiveLoading}
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
      onOpenLink={handleOpenLink}
      renderLink={renderLink}
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
