/**
 * Unified subscription helpers.
 *
 * Events flow over the engine WebSocket (topic-scoped). The only calls that
 * still use Tauri IPC are OS-level events (`app-activated`,
 * `sync-connection`) that the webview emits locally without going through
 * the engine.
 *
 * Callers should NOT import `listen` from `@tauri-apps/api/event` — go
 * through this module so any future transport switch stays in one place.
 */

import type { HoustonEvent } from "@houston-ai/core";
import { topics } from "@houston-ai/engine-client";
import { getEngineWs } from "./engine";
import { legacyEmit, legacyListen } from "./os-bridge";

type Unsub = () => void;

/**
 * Topics every frontend needs regardless of agent.
 *
 * `*` is the firehose — see `engine/houston-engine-server/src/ws.rs`.
 * The desktop app listens to every session and every agent path, so we
 * subscribe to everything rather than track per-agent / per-session
 * subscriptions. Remote/headless clients that only care about a narrow
 * slice can sub to specific topics instead.
 */
const BROAD_TOPICS: readonly string[] = [
  "*",
  topics.auth,
  topics.toast,
  topics.events,
  topics.scheduler,
  topics.composio,
  topics.sync,
];

function toHandler<T>(handler: (ev: T) => void) {
  return (payload: unknown) => handler(payload as T);
}

function ensureBroadSubscription(): void {
  const ws = getEngineWs();
  ws.subscribe([...BROAD_TOPICS]);
}

/**
 * Subscribe to every `HoustonEvent` emitted by the backend.
 *
 * The caller still needs to request agent- and session-scoped topics via
 * [`subscribeAgentTopics`] / [`subscribeSession`] — broad (non-scoped)
 * topics are subscribed automatically on first call.
 */
export function subscribeHoustonEvents(handler: (ev: HoustonEvent) => void): Unsub {
  ensureBroadSubscription();
  const ws = getEngineWs();
  return ws.onEvent(toHandler(handler));
}

/** Subscribe to the agent-scoped topics (`agent:<path>`, `routines:<path>`). */
export function subscribeAgentTopics(agentPath: string): Unsub {
  const ws = getEngineWs();
  const t = [topics.agent(agentPath), topics.routines(agentPath)];
  ws.subscribe(t);
  return () => ws.unsubscribe(t);
}

/** Subscribe to a single session topic (`session:<key>`). */
export function subscribeSession(sessionKey: string): Unsub {
  const ws = getEngineWs();
  const t = [topics.session(sessionKey)];
  ws.subscribe(t);
  return () => ws.unsubscribe(t);
}

/**
 * Listen to a raw Tauri event. Use for events that have no engine counterpart:
 * - `app-activated` (OS window resume)
 * - `sync-connection` (internal desktop-local dispatch by `useSyncResponder`)
 */
export function listenOsEvent<T>(event: string, handler: (ev: T) => void): Unsub {
  let off: Unsub | undefined;
  legacyListen<T>(event, (tauriEv) => handler(tauriEv.payload))
    .then((fn) => {
      off = fn;
    })
    .catch(() => {});
  return () => {
    off?.();
  };
}

/** Re-export `legacyEmit` so callers don't need to reach into os-bridge. */
export function emitOsEvent(event: string, payload?: unknown): Promise<void> {
  return legacyEmit(event, payload);
}
