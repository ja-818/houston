/**
 * @houston-ai/sync-protocol
 *
 * Shared TypeScript contract for the Houston desktop <-> mobile WebSocket
 * sync protocol. Zero runtime dependencies. No React, no Node-only APIs.
 *
 * This package is the single source of truth for message shapes that flow
 * over the relay. The Rust side (crates/houston-sync) only types the
 * envelope and treats payloads as opaque JSON; desktop and mobile both
 * import from this package for typed payloads.
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** Who sent (or is described by) a sync message. */
export type SyncPeer = "desktop" | "mobile" | "relay";

/** Connection state reported synthetically by the desktop Rust client. */
export type ConnectionState = "connected" | "reconnecting" | "disconnected";

/**
 * Accepted agent/session status values.
 *
 * NOTE: Backend emits "done" in some paths, so it is included here. The
 * `status` field on Conversation / SessionStatusPayload is typed as plain
 * `string` at the wire boundary so unknown future values don't crash the
 * type checker — narrow to AgentStatus in UI code where needed.
 */
export type AgentStatus =
  | "running"
  | "completed"
  | "failed"
  | "idle"
  | "needs_you"
  | "queue"
  | "cancelled"
  | "done";

/** A conversation surfaced to mobile for the mission-control list. */
export interface Conversation {
  id: string;
  title: string;
  description?: string;
  agentName: string;
  agentColor?: string;
  /** One of AgentStatus but kept wide at the boundary. */
  status: string;
  updatedAt: string;
  agentPath: string;
}

/** Minimal agent identifier used to populate filter dropdowns on mobile. */
export interface AgentNameEntry {
  id: string;
  name: string;
}

/**
 * Wire-level feed item. Intentionally widened compared to the discriminated
 * union in @houston-ai/chat — the protocol must tolerate future feed_type
 * additions without blocking mobile clients that haven't shipped yet.
 */
export interface FeedItem {
  feed_type: string;
  data: unknown;
}

/**
 * Generic sync message envelope. `type` carries the discriminator; consumers
 * narrow `payload` by checking `type`.
 */
export interface SyncMessage<T = unknown> {
  type: string;
  from: SyncPeer;
  ts: string;
  payload: T;
}

// ---------------------------------------------------------------------------
// Desktop -> Mobile payloads
// ---------------------------------------------------------------------------

export interface AgentListPayload {
  workspaceName: string;
  conversations: Conversation[];
  agentNames: AgentNameEntry[];
}

export interface ChatHistoryPayload {
  agentId: string;
  sessionKey: string;
  feedItems: FeedItem[];
}

export interface FeedItemPayload {
  agentId: string;
  sessionKey: string;
  item: FeedItem;
}

export interface SessionStatusPayload {
  agentId: string;
  sessionKey: string;
  /** One of AgentStatus but kept wide at the boundary. */
  status: string;
  error?: string;
}

export interface MissionCreatedPayload {
  msgId: string;
  conversationId: string;
  sessionKey: string;
  conversation: Conversation;
}

export interface MissionErrorPayload {
  msgId: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Mobile -> Desktop payloads
// ---------------------------------------------------------------------------

// Intentionally an empty object rather than `Record<string, never>` so the
// shape serialises as `{}` over the wire.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RequestAgentsPayload {}

export interface RequestChatHistoryPayload {
  agentId: string;
  sessionKey: string;
}

export interface SendMessagePayload {
  agentId: string;
  sessionKey: string;
  text: string;
  msgId: string;
}

export interface CreateMissionPayload {
  agentId: string;
  text: string;
  msgId: string;
}

// ---------------------------------------------------------------------------
// Relay -> either side payloads
// ---------------------------------------------------------------------------

export interface PeerConnectedPayload {
  peer: SyncPeer;
}

export interface PeerDisconnectedPayload {
  peer: SyncPeer;
}

export type RelayErrorCode =
  | "room_full"
  | "invalid_message"
  | "peer_not_connected";

export interface RelayErrorPayload {
  message: string;
  code: RelayErrorCode;
}

// ---------------------------------------------------------------------------
// Synthetic payloads (NOT wire-forwarded)
// ---------------------------------------------------------------------------

/**
 * Emitted by the desktop Rust sync client onto its in-process broadcast
 * channel. This message stays local to the desktop — it is NOT sent over
 * the WebSocket to the relay or the mobile peer.
 */
export interface ConnectionPayload {
  state: ConnectionState;
}

// ---------------------------------------------------------------------------
// Message type string constants
// ---------------------------------------------------------------------------

/**
 * Canonical message type strings. Consumers should import this constant
 * rather than sprinkling string literals so that renames are a single edit.
 */
export const SYNC_MSG_TYPES = {
  // Desktop -> Mobile
  AGENT_LIST: "agent_list",
  CHAT_HISTORY: "chat_history",
  FEED_ITEM: "feed_item",
  SESSION_STATUS: "session_status",
  MISSION_CREATED: "mission_created",
  MISSION_ERROR: "mission_error",

  // Mobile -> Desktop
  REQUEST_AGENTS: "request_agents",
  REQUEST_CHAT_HISTORY: "request_chat_history",
  SEND_MESSAGE: "send_message",
  CREATE_MISSION: "create_mission",

  // Relay -> either
  PEER_CONNECTED: "peer_connected",
  PEER_DISCONNECTED: "peer_disconnected",
  ERROR: "error",

  // Synthetic (desktop-local)
  CONNECTION: "connection",
} as const;

export type SyncMsgType = (typeof SYNC_MSG_TYPES)[keyof typeof SYNC_MSG_TYPES];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a session key for a given activity id. */
export function sessionKeyForActivity(activityId: string): string {
  return `activity-${activityId}`;
}

/**
 * Inverse of {@link sessionKeyForActivity}. Returns the activity id when the
 * key begins with the "activity-" prefix, otherwise `null`.
 *
 * Uses `startsWith` + `slice` rather than `.replace()` because `.replace()`
 * would happily strip the prefix from the middle of a string.
 */
export function activityIdFromSessionKey(key: string): string | null {
  const PREFIX = "activity-";
  return key.startsWith(PREFIX) ? key.slice(PREFIX.length) : null;
}

/**
 * Generate a unique message id. Uses `crypto.randomUUID()` when available,
 * falls back to a time+random combination for older runtimes.
 */
export function newMsgId(): string {
  const cryptoObj: Crypto | undefined =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: Crypto }).crypto
      : undefined;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** ISO 8601 timestamp for "now". */
export function nowIso(): string {
  return new Date().toISOString();
}
