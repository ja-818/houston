import { useState, useEffect, useCallback } from "react";
import { ChannelsView } from "@houston-ai/connections";
import type { ChannelConnection, ChannelType } from "@houston-ai/connections";
import { ContentArea } from "../shell/content-area";
import { tauriChannels } from "../../lib/tauri";
import type { TabProps, ChannelEntry } from "../../lib/types";

function toChannelConnection(entry: ChannelEntry): ChannelConnection {
  let config: Record<string, string>;
  try {
    config = JSON.parse(entry.token);
  } catch {
    config = { token: entry.token };
  }
  return {
    id: entry.id,
    type: entry.channel_type as ChannelType,
    name: entry.name,
    status: "disconnected",
    config,
    lastActiveAt: null,
    messageCount: 0,
  };
}

function generateName(type: ChannelType, existing: ChannelEntry[]): string {
  const label = type === "slack" ? "Slack" : "Telegram";
  const count = existing.filter((e) => e.channel_type === type).length;
  return count === 0 ? label : `${label} ${count + 1}`;
}

export default function ChannelsTab({ workspace }: TabProps) {
  const [channels, setChannels] = useState<ChannelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const path = workspace.folderPath;

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const entries = await tauriChannels.list(path);
      setChannels(entries);
    } catch (e) {
      console.error("[channels] Failed to load:", e);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleAdd = useCallback(
    async (type: ChannelType, config: Record<string, string>) => {
      const name = generateName(type, channels);
      const token = JSON.stringify(config);
      await tauriChannels.add(path, { channel_type: type, name, token });
      await fetchChannels();
    },
    [channels, path, fetchChannels],
  );

  const handleDelete = useCallback(
    async (channel: ChannelConnection) => {
      await tauriChannels.remove(path, channel.id);
      await fetchChannels();
    },
    [path, fetchChannels],
  );

  return (
    <ContentArea centered>
      <ChannelsView
        channels={channels.map(toChannelConnection)}
        loading={loading}
        onAddChannel={handleAdd}
        onDelete={handleDelete}
      />
    </ContentArea>
  );
}
