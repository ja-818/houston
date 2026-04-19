import { useEffect } from "react";
import { syncClient } from "@/lib/sync-client";
import { useMobileStore } from "@/lib/store";
import type { FeedItem, ConnectionState } from "@/lib/types";
import {
  SYNC_MSG_TYPES,
  activityIdFromSessionKey,
  sessionKeyForActivity,
  type AgentListPayload,
  type ChatHistoryPayload,
  type ConnectionPayload,
  type FeedItemPayload,
  type SessionStatusPayload,
} from "@houston-ai/sync-protocol";

/** Window (ms) within which an echoed user message is considered a duplicate. */
const OPTIMISTIC_DEDUPE_WINDOW_MS = 10_000;

export function useSync(): void {
  const setConnectionState = useMobileStore((s) => s.setConnectionState);
  const setConversations = useMobileStore((s) => s.setConversations);
  const setAgentNames = useMobileStore((s) => s.setAgentNames);
  const setWorkspaceName = useMobileStore((s) => s.setWorkspaceName);
  const setChatHistory = useMobileStore((s) => s.setChatHistory);
  const appendFeedItem = useMobileStore((s) => s.appendFeedItem);
  const removeOptimisticMessage = useMobileStore(
    (s) => s.removeOptimisticMessage,
  );

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Tri-state connection lifecycle from the client (open/close/peer events).
    unsubs.push(
      syncClient.on("connection_state", (payload: unknown) => {
        const p = payload as { state: ConnectionState };
        setConnectionState(p.state);
      }),
    );

    // Desktop-side CONNECTION message (synthetic, but if it reaches us
    // we fine-tune on it).
    unsubs.push(
      syncClient.on(SYNC_MSG_TYPES.CONNECTION, (payload: unknown) => {
        const p = payload as ConnectionPayload;
        if (p?.state) setConnectionState(p.state);
      }),
    );

    unsubs.push(
      syncClient.on(SYNC_MSG_TYPES.AGENT_LIST, (payload: unknown) => {
        const p = payload as AgentListPayload;
        setWorkspaceName(p.workspaceName);
        setConversations(p.conversations ?? []);
        setAgentNames(p.agentNames ?? []);
      }),
    );

    unsubs.push(
      syncClient.on(SYNC_MSG_TYPES.CHAT_HISTORY, (payload: unknown) => {
        const p = payload as ChatHistoryPayload;
        setChatHistory((p.feedItems ?? []) as FeedItem[]);
      }),
    );

    // Real-time feed items from desktop.
    // Deduplicate user_message echoes against the optimistic buffer.
    unsubs.push(
      syncClient.on(SYNC_MSG_TYPES.FEED_ITEM, (payload: unknown) => {
        const p = payload as FeedItemPayload;
        const state = useMobileStore.getState();
        const currentId = state.currentConvoId;
        if (!currentId || p.sessionKey !== sessionKeyForActivity(currentId)) {
          return;
        }

        const item = p.item as FeedItem;
        if (item.feed_type === "user_message") {
          const cutoff = Date.now() - OPTIMISTIC_DEDUPE_WINDOW_MS;
          const match = state.optimisticUserMessages.find(
            (m) => m.text === item.data && m.sentAt >= cutoff,
          );
          if (match) {
            // Echo of our own optimistic send — drop it, clear the buffer entry.
            removeOptimisticMessage(match.msgId);
            return;
          }
        }

        appendFeedItem(item);
      }),
    );

    // Session status changes — update conversation status in the list.
    unsubs.push(
      syncClient.on(SYNC_MSG_TYPES.SESSION_STATUS, (payload: unknown) => {
        const p = payload as SessionStatusPayload;
        const convos = useMobileStore.getState().conversations;
        const activityId = activityIdFromSessionKey(p.sessionKey);
        if (!activityId) return;
        const updated = convos.map((c) =>
          c.id === activityId ? { ...c, status: p.status } : c,
        );
        setConversations(updated);
      }),
    );

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [
    setConnectionState,
    setConversations,
    setAgentNames,
    setWorkspaceName,
    setChatHistory,
    appendFeedItem,
    removeOptimisticMessage,
  ]);
}
