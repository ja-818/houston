/**
 * Houston Sync Relay — Cloudflare Worker + Durable Object
 *
 * Routes WebSocket connections to a SyncRoom keyed by pairing token.
 * Each room holds exactly 2 peers (desktop + mobile) and forwards
 * messages between them.
 */

type Role = "desktop" | "mobile";

interface Env {
  SYNC_ROOM: DurableObjectNamespace;
}

interface RelayMessage {
  type: string;
  from: string;
  ts: string;
  payload: unknown;
}

// ── Helpers ──────────────────────────────────────────────────────────

function relayMessage(type: string, payload: unknown): string {
  const msg: RelayMessage = {
    type,
    from: "relay",
    ts: new Date().toISOString(),
    payload,
  };
  return JSON.stringify(msg);
}

function otherRole(role: Role): Role {
  return role === "desktop" ? "mobile" : "desktop";
}

function isValidRole(value: string | null): value is Role {
  return value === "desktop" || value === "mobile";
}

// ── SyncRoom Durable Object ─────────────────────────────────────────

export class SyncRoom implements DurableObject {
  private desktop: WebSocket | null = null;
  private mobile: WebSocket | null = null;

  constructor(
    private state: DurableObjectState,
    private env: Env,
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const role = url.searchParams.get("role");

    if (!isValidRole(role)) {
      return new Response("Missing or invalid ?role= param (desktop|mobile)", {
        status: 400,
      });
    }

    // Check if the upgrade header is present
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }

    // Check if the role slot is already taken
    if (this[role] !== null) {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.state.acceptWebSocket(server);
      server.send(relayMessage("error", { message: `Role "${role}" is already connected`, code: "room_full" }));
      server.close(4000, "room_full");
      return new Response(null, { status: 101, webSocket: client });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept with hibernation API, tag with role
    this.state.acceptWebSocket(server, [role]);
    this[role] = server;

    // Notify the other peer
    const peer = this[otherRole(role)];
    if (peer) {
      peer.send(relayMessage("peer_connected", { peer: role }));
      // Also tell the new connector that their peer is already here
      server.send(relayMessage("peer_connected", { peer: otherRole(role) }));
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const role = this.roleFor(ws);
    if (!role) return;

    // Validate JSON
    if (typeof message !== "string") {
      ws.send(relayMessage("error", { message: "Binary messages not supported", code: "invalid_message" }));
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      ws.send(relayMessage("error", { message: "Invalid JSON", code: "invalid_message" }));
      return;
    }

    // Forward to the other peer
    const target = this[otherRole(role)];
    if (!target) {
      ws.send(relayMessage("error", { message: "Peer is not connected", code: "peer_not_connected" }));
      return;
    }

    // Forward the raw message string as-is (preserving original payload)
    target.send(message);
  }

  async webSocketClose(ws: WebSocket, code: number, _reason: string, _wasClean: boolean): Promise<void> {
    this.handleDisconnect(ws, code);
  }

  async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
    this.handleDisconnect(ws, 1011);
  }

  // ── Private ────────────────────────────────────────────────────────

  private roleFor(ws: WebSocket): Role | null {
    const tags = this.state.getTags(ws);
    const tag = tags[0];
    if (tag === "desktop" || tag === "mobile") return tag;
    return null;
  }

  private handleDisconnect(ws: WebSocket, code: number): void {
    const role = this.roleFor(ws);
    if (!role) return;

    // Clear the slot
    this[role] = null;

    // Notify remaining peer
    const peer = this[otherRole(role)];
    if (peer) {
      peer.send(relayMessage("peer_disconnected", { peer: role }));
    }

    // Attempt clean close
    try {
      ws.close(code, "disconnected");
    } catch {
      // Already closed
    }
  }
}

// ── Worker Entry ────────────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "houston-relay" }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // Match /sync/{token}
    const match = url.pathname.match(/^\/sync\/([a-zA-Z0-9_-]+)$/);
    if (!match) {
      return new Response("Not found", { status: 404, headers: CORS_HEADERS });
    }

    const token = match[1];
    const id = env.SYNC_ROOM.idFromName(token);
    const room = env.SYNC_ROOM.get(id);
    return room.fetch(request);
  },
} satisfies ExportedHandler<Env>;
