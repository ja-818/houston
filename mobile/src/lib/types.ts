/**
 * Shared type re-exports for the mobile companion.
 *
 * The sync protocol (envelope + payload shapes) lives in
 * `@houston-ai/sync-protocol`. Feed items on mobile are rendered through
 * `@houston-ai/chat`'s <ChatPanel />, which expects its own discriminated
 * `FeedItem` union — so we re-export that one from `@houston-ai/chat` rather
 * than the wider wire-level `FeedItem` from sync-protocol. The two shapes
 * are structurally compatible at the wire boundary.
 */

export type { FeedItem } from "@houston-ai/chat";
export type {
  Conversation,
  AgentNameEntry,
  SyncMessage,
  SyncPeer,
  ConnectionState,
  AgentStatus,
} from "@houston-ai/sync-protocol";
