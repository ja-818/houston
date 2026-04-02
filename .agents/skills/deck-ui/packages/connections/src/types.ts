export interface Connection {
  toolkit: string;
  display_name: string;
  description: string;
  email: string | null;
  logo_url: string;
  connected_at: string | null;
}

export type ConnectionsResult =
  | { status: "not_configured" }
  | { status: "needs_auth" }
  | { status: "error"; message: string }
  | { status: "ok"; connections: Connection[] };

// --- Channel connections ---

export type ChannelType = "slack" | "telegram"

export type ChannelStatus = "disconnected" | "connecting" | "connected" | "error"

export interface ChannelConnection {
  id: string
  type: ChannelType
  name: string
  status: ChannelStatus
  config: Record<string, string>
  lastActiveAt: string | null
  messageCount: number
  error?: string
}

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  slack: "Slack",
  telegram: "Telegram",
}
