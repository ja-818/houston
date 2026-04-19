# Houston Sync Protocol

This document is the authoritative contract for the WebSocket sync channel
between the Houston desktop app and the Houston mobile companion, brokered by
the Cloudflare Worker relay (`relay/`).

The canonical TypeScript types live in `packages/sync-protocol/` and are
consumed by both `app/` (desktop renderer) and `mobile/`. The Rust crate
`crates/houston-sync` only models the message envelope — it treats payloads
as opaque JSON and never interprets them.

## Actors

| Actor    | Role                                                                    |
|----------|-------------------------------------------------------------------------|
| Desktop  | Source of truth for workspace data. Produces `desktop -> mobile` msgs.  |
| Mobile   | Read/write companion. Produces `mobile -> desktop` msgs.                |
| Relay    | Cloudflare Worker + Durable Object pairing the two peers in a "room".   |

Only one desktop and one mobile can occupy a room at a time. The relay rejects
a third connection with `error` / `room_full`.

## Pairing Flow

1. Desktop generates a cryptographically random 32-byte `pairingToken`
   (hex-encoded, 64 chars) via `crates/houston-sync` -> `generate_token()`.
2. Desktop connects to
   `wss://relay.gethouston.ai/sync/{pairingToken}?role=desktop`
   (or `ws://localhost:8787/...` in dev).
3. Desktop renders a QR code encoding the full WebSocket URL (mobile side
   adds `?role=mobile`).
4. Mobile scans the QR and connects to the same room.
5. Once both peers are present, the relay emits `peer_connected` in each
   direction. From that point, messages flow bidirectionally.

## Envelope

Every wire message is JSON with exactly these fields:

```ts
interface SyncMessage<T = unknown> {
  type: string;                           // discriminator
  from: "desktop" | "mobile" | "relay";   // sender (or describer)
  ts: string;                             // ISO 8601 timestamp
  payload: T;                             // shape depends on `type`
}
```

Unknown `type` values MUST be ignored by receivers — never throw.

## Message Catalog

### Desktop -> Mobile

#### `agent_list`
Sent on `peer_connected`, on `request_agents`, and whenever the conversation
list or agent roster changes.
```ts
payload: {
  workspaceName: string;
  conversations: Conversation[];
  agentNames: AgentNameEntry[];
}
```

#### `chat_history`
Sent in response to `request_chat_history`.
```ts
payload: {
  agentId: string;
  sessionKey: string;
  feedItems: FeedItem[];
}
```

#### `feed_item`
Streamed in real time as new feed items are produced on the desktop.
```ts
payload: {
  agentId: string;
  sessionKey: string;
  item: FeedItem;
}
```

#### `session_status`
Emitted whenever a running session transitions state.
```ts
payload: {
  agentId: string;
  sessionKey: string;
  status: AgentStatus;   // kept wide at the wire boundary
  error?: string;
}
```

#### `mission_created`
Sent in response to a successful `create_mission`. Tells the mobile it can
swap its optimistic pending entry for the real conversation.
```ts
payload: {
  msgId: string;            // echoes the CreateMissionPayload.msgId
  conversationId: string;
  sessionKey: string;
  conversation: Conversation;
}
```

#### `mission_error`
Sent when `create_mission` fails. Lets mobile clear pending state.
```ts
payload: {
  msgId: string;
  message: string;
}
```

### Mobile -> Desktop

#### `request_agents`
Request a fresh `agent_list`.
```ts
payload: {}
```

#### `request_chat_history`
Request the chat history for a given session.
```ts
payload: {
  agentId: string;
  sessionKey: string;
}
```

#### `send_message`
Append a user message to an existing session and trigger agent processing.
```ts
payload: {
  agentId: string;
  sessionKey: string;
  text: string;
  msgId: string;    // client-generated; used for dedupe (see below)
}
```

#### `create_mission`
Start a brand-new conversation with an agent.
```ts
payload: {
  agentId: string;
  text: string;
  msgId: string;    // client-generated; echoed back in mission_created/_error
}
```

### Relay -> either side

#### `peer_connected`
Sent to the already-present peer when the other side joins the room.
```ts
payload: { peer: "desktop" | "mobile" }
```

#### `peer_disconnected`
Sent when the other peer drops.
```ts
payload: { peer: "desktop" | "mobile" }
```

#### `error`
```ts
payload: {
  message: string;
  code: "room_full" | "invalid_message" | "peer_not_connected";
}
```

## Synthetic messages (desktop-local, NOT over the wire)

### `connection`
The desktop Rust client (`crates/houston-sync`) pushes this onto its internal
broadcast channel so the renderer can react to WebSocket lifecycle events.
This message is never serialised or sent to the relay.
```ts
payload: { state: "connected" | "reconnecting" | "disconnected" }
```

## Connection Lifecycle

1. Desktop opens the WebSocket. Rust emits `connection { state: "connected" }`
   locally.
2. Relay pairs the peers and emits `peer_connected` to each side.
3. On disconnect, the Rust client transitions to `reconnecting` and attempts
   a backoff reconnect. If the reconnect fails permanently, it emits
   `disconnected` and stops.
4. The peer that is still connected receives `peer_disconnected` from the
   relay so its UI can reflect the missing counterpart.

The renderer must not rely on the `from` field to distinguish synthetic
`connection` messages from wire traffic — the synthetic message is not
delivered via the WebSocket, it is emitted on a separate in-process channel.

## Client Message IDs and Dedupe

`send_message` and `create_mission` both carry a client-generated `msgId`
(see `newMsgId()` in `@houston-ai/sync-protocol`).

The mobile client SHOULD:
1. Optimistically append the user_message locally as soon as the user hits
   send, tagged with the `msgId`.
2. Drop any echoed `feed_item` of `feed_type === "user_message"` whose text
   matches a still-pending optimistic entry from the last 10 seconds. This
   avoids duplicate rendering when the desktop's session runner emits the
   user message back through the normal feed pipeline.
3. Clear optimistic pending state for `create_mission` on receipt of either
   `mission_created` or `mission_error` with the matching `msgId`.

The desktop is authoritative: any reconciliation differences resolve in
favour of what the desktop emits.

## Error Codes

| code                   | meaning                                                                        |
|------------------------|--------------------------------------------------------------------------------|
| `room_full`            | A third client tried to join a room already holding desktop + mobile.          |
| `invalid_message`      | Envelope failed JSON decoding or was missing required fields.                  |
| `peer_not_connected`   | A message was sent but the counterpart peer is not currently in the room.      |

Receivers MUST treat unknown `code` values as generic errors and log rather
than crash.
