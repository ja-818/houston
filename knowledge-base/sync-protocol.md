# Sync Protocol

Contract for WebSocket sync between desktop app + mobile companion. Brokered by Cloudflare Worker at `desktop-mobile-bridge/`.

Canonical TypeScript types: `ui/sync-protocol/`. Consumed by `app/` + `mobile/`. Rust crate `engine/houston-sync` models envelope only — payloads opaque JSON.

## Actors
| Actor | Role |
|-------|------|
| Desktop | Source of truth. Produces `desktop → mobile`. |
| Mobile | Read/write companion. Produces `mobile → desktop`. |
| Relay | CF Worker + Durable Object. Pairs peers in a "room". |

One desktop + one mobile per room. Third connection rejected with `error` code `room_full`.

## Pairing flow
1. Desktop generates 32-byte `pairingToken` (hex, 64 chars) via `engine/houston-sync::generate_token()`.
2. Desktop connects `wss://relay.gethouston.ai/sync/{token}?role=desktop` (or `ws://localhost:8787/...` dev).
3. Desktop renders QR of WS URL (mobile side adds `?role=mobile`).
4. Mobile scans QR, connects same room.
5. Both present → relay emits `peer_connected` each way. Bidirectional flow begins.

## Envelope
Every wire msg = JSON:
```ts
interface SyncMessage<T = unknown> {
  type: string;                           // discriminator
  from: "desktop" | "mobile" | "relay";
  ts: string;                             // ISO 8601
  payload: T;
}
```

Unknown `type` → MUST ignore, never throw.

## Desktop → Mobile

- **`agent_list`** — on peer_connected, on request_agents, on roster change. `{workspaceName, conversations, agentNames}`
- **`chat_history`** — response to request_chat_history. `{agentId, sessionKey, feedItems}`
- **`feed_item`** — streamed real-time. `{agentId, sessionKey, item}`
- **`session_status`** — session state transition. `{agentId, sessionKey, status, error?}`
- **`mission_created`** — successful create_mission. `{msgId, conversationId, sessionKey, conversation}` — mobile swaps optimistic pending for real conversation
- **`mission_error`** — failed create_mission. `{msgId, message}` — mobile clears pending

## Mobile → Desktop

- **`request_agents`** — `{}`
- **`request_chat_history`** — `{agentId, sessionKey}`
- **`send_message`** — append user msg + trigger processing. `{agentId, sessionKey, text, msgId}` (msgId client-generated, used for dedupe)
- **`create_mission`** — start new conversation. `{agentId, text, msgId}` (msgId echoed in mission_created/_error)

## Relay → either side

- **`peer_connected`** — `{peer}`
- **`peer_disconnected`** — `{peer}`
- **`error`** — `{message, code: "room_full" | "invalid_message" | "peer_not_connected"}`

## Synthetic (desktop-local, NOT wire)

**`connection`** — Rust client pushes to internal broadcast channel. Renderer reacts to WS lifecycle. Never serialised. `{state: "connected" | "reconnecting" | "disconnected"}`.

Renderer MUST NOT rely on `from` to distinguish synthetic from wire — synthetic delivered on separate in-process channel.

## Connection lifecycle
1. Desktop opens WS. Rust emits `connection {state: "connected"}` locally.
2. Relay pairs peers → `peer_connected` each side.
3. Disconnect → Rust transitions `reconnecting`, backoff retries. Permanent fail → `disconnected`, stops.
4. Still-connected peer gets `peer_disconnected` from relay.

## Msg IDs + dedupe

`send_message` + `create_mission` carry client-generated `msgId` (see `newMsgId()` in `@houston-ai/sync-protocol`).

Mobile SHOULD:
1. Optimistically append user_message locally on send, tagged with msgId.
2. Drop echoed `feed_item` of `feed_type === "user_message"` whose text matches still-pending optimistic entry from last 10s. Avoids duplicate rendering when desktop session runner emits user msg back through normal pipeline.
3. Clear optimistic pending for `create_mission` on `mission_created` or `mission_error` matching msgId.

Desktop authoritative. Reconciliation resolves in favor of desktop.

## Error codes
| Code | Meaning |
|------|---------|
| `room_full` | Third client tried to join full room |
| `invalid_message` | Envelope bad JSON or missing required fields |
| `peer_not_connected` | Msg sent but counterpart not in room |

Unknown codes → treat as generic, log don't crash.
