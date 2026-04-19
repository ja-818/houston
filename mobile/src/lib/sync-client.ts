import type { SyncMessage, ConnectionState } from "@houston-ai/sync-protocol";
import { SYNC_MSG_TYPES, nowIso } from "@houston-ai/sync-protocol";

type MessageHandler = (payload: unknown) => void;

/**
 * WebSocket client for the Houston sync relay.
 * Connects to the relay URL obtained from QR code scanning
 * and handles bidirectional messaging with the desktop app.
 *
 * Emits `connection_state` with a ConnectionState payload on lifecycle
 * transitions so the UI can show a tri-state indicator.
 */
class SyncClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private _connected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string | null = null;
  private _connectionState: ConnectionState = "disconnected";

  /** Whether the WebSocket handshake *and* a peer connection are live. */
  get connected(): boolean {
    return this._connected;
  }

  /** Tri-state connection report used by the UI. */
  get connectionState(): ConnectionState {
    return this._connectionState;
  }

  /** Connect to the sync relay */
  connect(url: string): void {
    this.url = url;
    this.disconnect();

    this.setConnectionState("reconnecting");
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[sync] WebSocket open, waiting for peer...");
      // Socket is up but we don't call this "connected" until the desktop
      // peer is actually in the room. Stay in the reconnecting state.
      this.send(SYNC_MSG_TYPES.REQUEST_AGENTS, {});
    };

    this.ws.onclose = () => {
      this._connected = false;
      this.setConnectionState("reconnecting");
      this.emit("connection_change", { connected: false });
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // Error will trigger onclose, which handles reconnection
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as SyncMessage;
        console.log("[sync] Received:", msg.type, msg);
        if (!msg.type) return;

        // peer_connected or the first agent_list means the desktop is in
        // the room — NOW we're connected.
        if (
          msg.type === SYNC_MSG_TYPES.PEER_CONNECTED ||
          msg.type === SYNC_MSG_TYPES.AGENT_LIST
        ) {
          this._connected = true;
          this.setConnectionState("connected");
          this.emit("connection_change", { connected: true });
        }

        // Desktop-side CONNECTION message (synthetic, rarely forwarded but
        // tolerated) — narrow to ConnectionState and mirror it.
        if (msg.type === SYNC_MSG_TYPES.CONNECTION) {
          const p = msg.payload as { state?: ConnectionState } | undefined;
          if (p?.state) this.setConnectionState(p.state);
        }

        // peer_disconnected: the desktop dropped, keep socket open and
        // downgrade to reconnecting so the UI reflects the stall.
        if (msg.type === SYNC_MSG_TYPES.PEER_DISCONNECTED) {
          this._connected = false;
          this.setConnectionState("reconnecting");
        }

        this.emit(msg.type, msg.payload);
      } catch {
        // Ignore malformed messages
      }
    };
  }

  /** Disconnect from the relay */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this._connected = false;
    this.setConnectionState("disconnected");
  }

  /** Send a message to the relay */
  send(type: string, payload: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const msg: SyncMessage = {
      type,
      payload,
      ts: nowIso(),
      from: "mobile",
    };
    this.ws.send(JSON.stringify(msg));
  }

  /** Subscribe to a message type. Returns an unsubscribe function. */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  private emit(type: string, payload: unknown): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      for (const handler of handlers) {
        handler(payload);
      }
    }
  }

  private setConnectionState(state: ConnectionState): void {
    if (this._connectionState === state) return;
    this._connectionState = state;
    this.emit("connection_state", { state });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.url && !this._connected) {
        this.connect(this.url);
      }
    }, 3000);
  }
}

export const syncClient = new SyncClient();
