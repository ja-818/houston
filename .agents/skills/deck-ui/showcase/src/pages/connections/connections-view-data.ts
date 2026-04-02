import type { PropDef } from "../../components/props-table";
import type { Connection, ChannelConnection } from "@deck-ui/connections";

/* ── Sample data ─────────────────────────────────────────────── */

export const SAMPLE_CONNECTIONS: Connection[] = [
  {
    toolkit: "gmail",
    display_name: "Gmail",
    description: "Read and send emails",
    email: "user@example.com",
    logo_url: "https://logo.clearbit.com/gmail.com",
    connected_at: new Date().toISOString(),
  },
  {
    toolkit: "google_drive",
    display_name: "Google Drive",
    description: "Access and manage files",
    email: "user@example.com",
    logo_url: "https://logo.clearbit.com/google.com",
    connected_at: new Date().toISOString(),
  },
  {
    toolkit: "github",
    display_name: "GitHub",
    description: "Manage repos and PRs",
    email: null,
    logo_url: "https://logo.clearbit.com/github.com",
    connected_at: new Date().toISOString(),
  },
];

export const SAMPLE_CHANNELS: ChannelConnection[] = [
  {
    id: "ch1",
    type: "slack",
    name: "Workspace: Acme Corp",
    status: "connected",
    config: { workspace: "acme-corp" },
    lastActiveAt: new Date().toISOString(),
    messageCount: 127,
  },
  {
    id: "ch2",
    type: "telegram",
    name: "Bot: Houston Assistant",
    status: "disconnected",
    config: {},
    lastActiveAt: null,
    messageCount: 0,
  },
];

/* ── Code examples ───────────────────────────────────────────── */

export const QUICK_START_CODE = `import { ConnectionsView } from "@deck-ui/connections"
import type { ConnectionsResult, ChannelConnection } from "@deck-ui/connections"

function MyConnections({
  result,
  channels,
}: {
  result: ConnectionsResult | null
  channels: ChannelConnection[]
}) {
  return (
    <ConnectionsView
      result={result}
      loading={false}
      onRetry={() => refetch()}
      onManage={() => openComposio()}
      channels={channels}
      onChannelConnect={(ch) => connect(ch.id)}
      onChannelDisconnect={(ch) => disconnect(ch.id)}
      onAddChannel={(type) => openSetup(type)}
    />
  )
}`;

export const CONNECTION_ROW_CODE = `import { ConnectionRow } from "@deck-ui/connections"

<ConnectionRow
  connection={{
    toolkit: "gmail",
    display_name: "Gmail",
    description: "Read and send emails",
    email: "user@example.com",
    logo_url: "https://logo.clearbit.com/gmail.com",
    connected_at: new Date().toISOString(),
  }}
/>`;

export const CHANNEL_CARD_CODE = `import { ChannelConnectionCard } from "@deck-ui/connections"

<ChannelConnectionCard
  connection={channel}
  onConnect={(ch) => connect(ch.id)}
  onDisconnect={(ch) => disconnect(ch.id)}
  onConfigure={(ch) => configure(ch.id)}
  onDelete={(ch) => remove(ch.id)}
/>`;

export const TYPES_CODE = `interface Connection {
  toolkit: string
  display_name: string
  description: string
  email: string | null
  logo_url: string
  connected_at: string | null
}

type ConnectionsResult =
  | { status: "not_configured" }
  | { status: "needs_auth" }
  | { status: "error"; message: string }
  | { status: "ok"; connections: Connection[] }

interface ChannelConnection {
  id: string
  type: ChannelType       // "slack" | "telegram"
  name: string
  status: ChannelStatus   // "disconnected" | "connecting" | "connected" | "error"
  config: Record<string, string>
  lastActiveAt: string | null
  messageCount: number
  error?: string
}`;

/* ── Props definitions ───────────────────────────────────────── */

export const VIEW_PROPS: PropDef[] = [
  { name: "result", type: "ConnectionsResult | null", description: "Connection fetch result — determines which state to show" },
  { name: "loading", type: "boolean", description: "Shows loading spinner when true" },
  { name: "onRetry", type: "() => void", description: "Called when the retry button is clicked" },
  { name: "onManage", type: "() => void", description: "Called when manage/reconnect buttons are clicked" },
  { name: "channels", type: "ChannelConnection[]", description: "Channel connections to display in the channels section" },
  { name: "onChannelConnect", type: "(ch) => void", description: "Called when a disconnected channel's connect button is clicked" },
  { name: "onChannelDisconnect", type: "(ch) => void", description: "Called when a connected channel's disconnect button is clicked" },
  { name: "onChannelConfigure", type: "(ch) => void", description: "Called when a channel's configure button is clicked" },
  { name: "onChannelDelete", type: "(ch) => void", description: "Called when a channel's delete button is clicked" },
  { name: "onAddChannel", type: "(type: ChannelType) => void", description: "Called when a new channel type is selected from the add menu" },
];

export const ROW_PROPS: PropDef[] = [
  { name: "connection", type: "Connection", description: "The connection data to display — logo, name, email/description" },
];

export const CHANNEL_CARD_PROPS: PropDef[] = [
  { name: "connection", type: "ChannelConnection", description: "Channel connection data to display" },
  { name: "onConnect", type: "(ch) => void", description: "Called when the connect button is clicked (disconnected state)" },
  { name: "onDisconnect", type: "(ch) => void", description: "Called when the disconnect button is clicked (connected state)" },
  { name: "onConfigure", type: "(ch) => void", description: "Called when the settings button is clicked" },
  { name: "onDelete", type: "(ch) => void", description: "Called when the delete button is clicked" },
];

export const CHANNELS_SECTION_PROPS: PropDef[] = [
  { name: "channels", type: "ChannelConnection[]", description: "List of channel connections to display" },
  { name: "onConnect", type: "(ch) => void", description: "Passed through to ChannelConnectionCard" },
  { name: "onDisconnect", type: "(ch) => void", description: "Passed through to ChannelConnectionCard" },
  { name: "onConfigure", type: "(ch) => void", description: "Passed through to ChannelConnectionCard" },
  { name: "onDelete", type: "(ch) => void", description: "Passed through to ChannelConnectionCard" },
  { name: "onAddChannel", type: "(type: ChannelType) => void", description: "Called when a type is selected from the Add Channel dropdown" },
];
