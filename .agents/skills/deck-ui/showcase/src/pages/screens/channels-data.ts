import type { ChannelConnection } from "@deck-ui/connections";

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
  {
    id: "ch3",
    type: "telegram",
    name: "Bot: Support",
    status: "error",
    config: {},
    lastActiveAt: "2025-03-15T10:30:00Z",
    messageCount: 42,
    error: "Connection timed out",
  },
];
