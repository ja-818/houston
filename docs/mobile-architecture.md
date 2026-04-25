# Mobile architecture

Houston's mobile companion is a **web app** served from `tunnel.gethouston.ai`. No native iOS or Android build — the same Cloudflare Worker that brokers mobile ↔ desktop traffic also hosts the PWA bundle. One origin, one deployment, first-party cookies + WebSockets.

```
┌──────────────┐        ┌────────────────────────┐        ┌──────────────────┐
│  Phone       │        │  Relay Worker          │        │  User's Mac      │
│  Safari      │◄──────►│  tunnel.gethouston.ai  │◄──────►│  houston-engine  │
│  (PWA)       │  HTTPS │  ┌─ index.ts           │  WSS   │  (loopback only) │
│              │        │  ├─ tunnel-do.ts (DO)  │        │  houston-tunnel  │
│              │        │  └─ assets: PWA bundle │        │  dials outbound  │
└──────────────┘        └────────────────────────┘        └──────────────────┘
```

The Mac never opens an inbound port. The engine's `houston-tunnel` client dials outbound to the Worker's Durable Object. Mobile HTTP + WS requests multiplex over that single link.

## First-boot bootstrap

1. Desktop engine starts, calls `POST tunnel.gethouston.ai/allocate`.
2. Relay returns `{tunnelId, tunnelToken, publicHost}`; engine caches in `<home>/tunnel.json`.
3. Subsequent boots reuse the cached identity.
4. If the first boot has no network, pairing stays dormant; the engine still runs local-only. Next boot retries.

Override the relay URL for local development via `HOUSTON_TUNNEL_URL` (e.g. pointing at `wrangler dev`).

## Pairing (one-time per device)

1. User opens desktop → Settings → Paired Devices. Desktop `POST /v1/tunnel/pairing` mints a 6-digit `userCode` and returns `code = "<tunnelId>-<userCode>"` + a QR of `https://tunnel.gethouston.ai/pair/<code>`.
2. User scans the QR on their phone. Safari opens the URL; the relay's `GET /pair/:code` 302s to `/?code=<code>` on the same origin so the bundled SPA's `PairScreen` picks the code up.
3. PWA `POST tunnel.gethouston.ai/pair/<code>` → relay forwards as a `pair_request` frame over the tunnel WS → desktop engine's `PairStore::redeem` mints a 48-char bearer, stores its SHA-256 hash in `engine_tokens`, returns plaintext.
4. PWA persists `{baseUrl, engineToken, deviceLabel, tunnelId}` in `localStorage`. All subsequent calls use `Authorization: Bearer <engineToken>` against `https://tunnel.gethouston.ai/e/<tunnelId>/v1/...`.

Pair codes are **idempotent** within their TTL: mobile can safely retry on transient errors and get the same token back. Retry-triggering codes (`network`, `desktop_offline`, `pair_timeout`) are retried automatically with exponential backoff; fatal codes (`code_unknown`, `code_consumed`, `code_malformed`) bail immediately.

## Runtime

- Mobile calls `HoustonClient` methods; every HTTP request is proxied through the relay's `TunnelRoom` Durable Object and reconstituted on the Mac by `houston-tunnel`'s loopback proxy.
- Mobile's `EngineWebSocket` opens a WS to `wss://tunnel.gethouston.ai/e/<tunnelId>/v1/ws`. The DO multiplexes it onto the desktop link as `ws_open` + `ws_message` frames; desktop connects a local WS to `ws://127.0.0.1:<enginePort>/v1/ws` and proxies bytes both ways.
- TanStack Query caches every response. `use-engine-invalidation.ts` listens to the engine's `HoustonEvent` fanout and invalidates matching query keys (mirrors the desktop's pattern).

## Reactivity safety net

Three layered defences keep the PWA in sync even when the multi-hop relay chain blips or iOS Safari throttles a backgrounded tab:

1. **WS event → query invalidation.** The fast path: any `FeedItem`, `SessionStatus`, `ActivityChanged`, `ConversationsChanged` event invalidates the matching TanStack keys.
2. **WS reconnect → refetch active queries.** Events emitted during a reconnect window are never replayed, so on every reconnect we refetch everything currently mounted.
3. **Tab visibility + active-session polling.** When the tab returns to visible, we refetch active queries (iOS may have paused JS). While a session is `running`, chat history polls every 2s regardless of WS state.

Together these guarantee the user never has to manually refresh after the agent finishes working, even if WS events were dropped.

## Tunnel resilience

- Desktop sends a `Ping` frame every 30s; relay DO sends one every 20s. Either side declares the link dead if no frame of any kind arrives in 75-90s and force-closes, triggering a reconnect.
- Desktop reconnects with exponential backoff up to 60s.
- If the relay rejects the tunnel token (401/403 on register) or fails 6 times in a row, `houston-tunnel` invalidates `tunnel.json` and re-allocates automatically — no user action needed.

## Security model

- Every mobile HTTP request carries a device-scoped bearer, NOT the engine's bootstrap token. Engine auth middleware SHA-256s the presented token and looks it up in `engine_tokens` where `revoked_at IS NULL`.
- Revoking a device in Settings → Paired Devices marks `revoked_at = now()`; any future request from that device 401s.
- The desktop's `tunnel_token` is an HMAC(tunnelId, TUNNEL_SHARED_SECRET). The shared secret lives only in the relay's Worker secrets storage. Engine never holds any credential a user couldn't mint themselves.
- Relay fails all in-flight mobile requests with 503 the moment the desktop's WS drops; mobile surfaces an "unreachable" banner and keeps serving cached reads.

## Files

| Purpose | Path |
|---|---|
| Tunnel client (outbound to relay) | `engine/houston-tunnel/` |
| Pair code store + HTTP routes | `engine/houston-engine-server/src/{pair_store.rs,routes/tunnel.rs}` |
| Relay Worker + Durable Object | `houston-relay/` |
| PWA source (React + Vite) | `mobile/` |
| Engine client library (shared with desktop) | `ui/engine-client/` |
