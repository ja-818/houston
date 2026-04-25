// Chat history + send-message hooks for a specific session.
//
// User messages are handled with an *optimistic* local overlay because
// the engine persists the user_message asynchronously (spawned tokio
// task waiting on Claude CLI's SessionId emit, 1-3 s window). Without
// the overlay the user's bubble disappears while we wait for the server
// to agree that they sent anything.
//
// The overlay lives in a module-scoped Map keyed by sessionKey so a
// remount of the chat view doesn't lose it. Entries are dropped once
// the refetched server history contains a matching user_message.

import { useEffect, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Activity } from "@houston-ai/engine-client";
import { topics } from "@houston-ai/engine-client";
import { getEngine, getWs, useEngineReady } from "../lib/engine";

interface ChatEntry {
  feed_type: string;
  data: unknown;
}

// ---------------------------------------------------------------------
// Optimistic-overlay store
// ---------------------------------------------------------------------

interface OptimisticMsg {
  id: string;
  sessionKey: string;
  text: string;
  sentAt: number;
}

const pending = new Map<string, OptimisticMsg[]>();
const listeners = new Set<() => void>();
let version = 0;

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function snapshot(): number {
  return version;
}

function notify(): void {
  version++;
  listeners.forEach((l) => l());
}

function pushPending(sessionKey: string, text: string): string {
  const id =
    globalThis.crypto && "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  const arr = pending.get(sessionKey) ?? [];
  arr.push({ id, sessionKey, text, sentAt: Date.now() });
  pending.set(sessionKey, arr);
  notify();
  return id;
}

function dropPending(sessionKey: string, id: string): void {
  const arr = pending.get(sessionKey);
  if (!arr) return;
  const next = arr.filter((m) => m.id !== id);
  if (next.length === 0) pending.delete(sessionKey);
  else pending.set(sessionKey, next);
  notify();
}

function reconcilePending(sessionKey: string, serverItems: ChatEntry[]): void {
  const arr = pending.get(sessionKey);
  if (!arr?.length) return;
  // Drop any optimistic entry whose text appears as a user_message in
  // the server history (same text, still pending for too long also
  // drops — 30 s cap).
  const texts = new Set(
    serverItems
      .filter((e) => e.feed_type === "user_message")
      .map((e) => String(e.data)),
  );
  const now = Date.now();
  const surviving = arr.filter(
    (m) => !texts.has(m.text) && now - m.sentAt < 30_000,
  );
  if (surviving.length !== arr.length) {
    if (surviving.length === 0) pending.delete(sessionKey);
    else pending.set(sessionKey, surviving);
    notify();
  }
}

// ---------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------

export function useChatHistory(
  agentPath: string | null,
  sessionKey: string | null,
  options: { isActive?: boolean } = {},
) {
  const ready = useEngineReady();
  useEffect(() => {
    if (!ready || !sessionKey) return;
    const t = topics.session(sessionKey);
    getWs().subscribe([t]);
    return () => getWs().unsubscribe([t]);
  }, [ready, sessionKey]);

  const query = useQuery({
    queryKey: ["chat", sessionKey, agentPath],
    enabled: ready && !!agentPath && !!sessionKey,
    queryFn: async () =>
      await getEngine().loadChatHistory(agentPath!, sessionKey!),
    // Backstop polling: while a session is "running" (agent is
    // actively writing), refetch every 2s. The WS firehose is the
    // primary delivery mechanism and usually wins; this is the
    // belt-and-suspenders for when the tunnel chain or iOS suspension
    // eats an event. As soon as the conversation status flips off
    // "running", the caller passes `isActive: false` and polling
    // stops — no battery drain in steady state.
    refetchInterval: options.isActive ? 2_000 : false,
  });

  // Subscribe to the optimistic overlay and reconcile whenever the
  // server query refetches.
  useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => {
    if (!sessionKey || !query.data) return;
    reconcilePending(sessionKey, query.data);
  }, [sessionKey, query.data]);

  const pendingForSession = sessionKey ? pending.get(sessionKey) ?? [] : [];
  const merged: ChatEntry[] = [
    ...(query.data ?? []),
    ...pendingForSession.map((m) => ({
      feed_type: "user_message" as const,
      data: m.text,
    })),
  ];

  return { ...query, data: merged };
}

export function useSendMessage(agentPath: string, sessionKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prompt: string) => {
      return await getEngine().startSession(agentPath, {
        sessionKey,
        prompt,
      });
    },
    onMutate: (prompt: string) => {
      const id = pushPending(sessionKey, prompt);
      return { id };
    },
    onError: (_err, _prompt, ctx) => {
      if (ctx?.id) dropPending(sessionKey, ctx.id);
    },
    onSettled: () => {
      // Refresh so we pick up the server's official user_message +
      // streaming responses. `reconcilePending` inside useChatHistory
      // drops the overlay once the server copy lands.
      qc.invalidateQueries({ queryKey: ["chat", sessionKey] });
    },
  });
}

const TITLE_MAX = 40;

/** Derive a short activity title from the user's first message —
 *  mirrors desktop's `createMission` autoTitle so the row on the
 *  board is informative without a manual rename. */
export function autoTitleFromText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return "New mission";
  if (trimmed.length <= TITLE_MAX) return trimmed;
  const slice = trimmed.slice(0, TITLE_MAX);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${base.trimEnd()}...`;
}

export interface CreateMissionResult {
  activity: Activity;
  sessionKey: string;
}

/** Draft-mode "first send": create the activity + start the session in
 *  one shot, seeding an optimistic message under the NEW session key
 *  so the destination chat view has something to render immediately on
 *  mount. Caller is responsible for navigating to the new session key
 *  after `mutateAsync` resolves. */
export function useCreateMission(agentPath: string) {
  return useMutation({
    mutationFn: async (prompt: string): Promise<CreateMissionResult> => {
      const trimmed = prompt.trim();
      const activity = await getEngine().createActivity(agentPath, {
        title: autoTitleFromText(trimmed),
        description: trimmed,
      });
      const sessionKey = `activity-${activity.id}`;
      // Seed the optimistic overlay BEFORE startSession so the
      // destination view sees the user's message the instant it
      // mounts, even before the engine's FeedItem echo arrives.
      pushPending(sessionKey, trimmed);
      await getEngine().startSession(agentPath, {
        sessionKey,
        prompt: trimmed,
      });
      return { activity, sessionKey };
    },
  });
}
