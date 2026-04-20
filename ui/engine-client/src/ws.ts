/**
 * Managed WebSocket with auto-reconnect and typed event handlers.
 *
 * Usage:
 * ```ts
 * const ws = new EngineWebSocket(client);
 * const off = ws.onEvent((event) => { ... });
 * ws.subscribe(["session:key1", "toast", "auth"]);
 * ws.connect();
 * ```
 *
 * The engine topic map (see `engine/houston-engine-protocol/src/lib.rs::event_topic`):
 * - `session:{session_key}` — FeedItem, SessionStatus
 * - `auth` — AuthRequired
 * - `toast` — Toast, CompletionToast
 * - `events` — EventReceived, EventProcessed
 * - `scheduler` — HeartbeatFired, CronFired
 * - `routines:{agent_path}` — RoutinesChanged, RoutineRunsChanged
 * - `agent:{agent_path}` — ActivityChanged, SkillsChanged, FilesChanged,
 *    ConfigChanged, ContextChanged, LearningsChanged, ConversationsChanged
 * - `composio` — ComposioCliReady, ComposioCliFailed
 * - `sync` — SyncConnection, SyncMessage
 */

import type { EngineEnvelope } from "./types";
import type { HoustonClient } from "./client";

type EnvelopeHandler = (env: EngineEnvelope) => void;
type EventHandler = (event: unknown) => void;

/** Convenience topic helpers. */
export const topics = {
  session: (sessionKey: string) => `session:${sessionKey}`,
  agent: (agentPath: string) => `agent:${agentPath}`,
  routines: (agentPath: string) => `routines:${agentPath}`,
  auth: "auth",
  toast: "toast",
  events: "events",
  scheduler: "scheduler",
  composio: "composio",
  sync: "sync",
} as const;

export class EngineWebSocket {
  private socket: WebSocket | null = null;
  private envelopeHandlers: Set<EnvelopeHandler> = new Set();
  private eventHandlers: Set<EventHandler> = new Set();
  private reconnectAttempts = 0;
  private shouldRun = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** Topics the caller wants subscribed. Re-sent on every reconnect. */
  private subscribed: Set<string> = new Set();

  constructor(private client: HoustonClient) {}

  connect(): void {
    this.shouldRun = true;
    this.open();
  }

  disconnect(): void {
    this.shouldRun = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
  }

  /** Raw envelope handler — called for every frame. */
  on(_: "event", handler: EnvelopeHandler): () => void {
    this.envelopeHandlers.add(handler);
    return () => this.envelopeHandlers.delete(handler);
  }

  /**
   * Typed event handler — called once per `HoustonEvent` (kind:"event"
   * frames, payload is the tagged event object). Non-event frames are
   * filtered out. Lag markers (`{type:"Lag",...}`) pass through.
   */
  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  send(envelope: EngineEnvelope): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(envelope));
    }
  }

  /** Subscribe to topics. Idempotent — re-sent on reconnect. */
  subscribe(newTopics: string[]): void {
    const fresh = newTopics.filter((t) => !this.subscribed.has(t));
    for (const t of newTopics) this.subscribed.add(t);
    if (fresh.length === 0) return;
    this.sendSub(fresh);
  }

  /** Unsubscribe from topics. */
  unsubscribe(stale: string[]): void {
    const toDrop = stale.filter((t) => this.subscribed.has(t));
    for (const t of stale) this.subscribed.delete(t);
    if (toDrop.length === 0) return;
    this.sendEnvelope({ op: "unsub", topics: toDrop });
  }

  private sendSub(list: string[]): void {
    this.sendEnvelope({ op: "sub", topics: list });
  }

  private sendEnvelope(payload: unknown): void {
    this.send({
      v: 1,
      id: crypto.randomUUID(),
      kind: "req",
      ts: Date.now(),
      payload,
    });
  }

  private open(): void {
    const ws = new WebSocket(this.client.wsUrl());
    this.socket = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      // Re-subscribe to all live topics.
      if (this.subscribed.size > 0) {
        this.sendSub(Array.from(this.subscribed));
      }
    };

    ws.onmessage = (ev) => {
      try {
        const env = JSON.parse(ev.data) as EngineEnvelope;
        for (const h of this.envelopeHandlers) h(env);
        if (env.kind === "event") {
          for (const h of this.eventHandlers) h(env.payload);
        }
      } catch {
        // Ignore malformed frames.
      }
    };

    ws.onclose = () => {
      if (!this.shouldRun) return;
      const delay = Math.min(30_000, 500 * 2 ** this.reconnectAttempts);
      this.reconnectAttempts += 1;
      this.reconnectTimer = setTimeout(() => this.open(), delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }
}
