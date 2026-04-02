import {
  ChannelConnectionCard,
  ChannelsSection,
  type ChannelConnection,
} from "@deck-ui/connections";
import { ChannelAvatar } from "@deck-ui/chat";
import { ChannelSetupFormPage } from "../connections/channel-setup-form";
import { SAMPLE_CHANNELS } from "./channels-data";

export function ChannelsScreen() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold mb-1">Channels</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Components for connecting and managing Telegram and Slack channels.
          Channel messages flow into the unified chat feed alongside desktop
          messages.
        </p>
      </div>

      {/* ChannelsSection demo */}
      <div>
        <h2 className="text-sm font-semibold mb-3">ChannelsSection</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Container with header, "Add Channel" dropdown, empty state, and a
          list of ChannelConnectionCard items.
        </p>
        <div className="rounded-xl border border-border p-6">
          <ChannelsSection
            channels={SAMPLE_CHANNELS}
            onConnect={(ch) => console.log("Connect:", ch.id)}
            onDisconnect={(ch) => console.log("Disconnect:", ch.id)}
            onDelete={(ch) => console.log("Delete:", ch.id)}
            onAddChannel={(type) => console.log("Add:", type)}
          />
        </div>
      </div>

      {/* ChannelConnectionCard standalone */}
      <div>
        <h2 className="text-sm font-semibold mb-3">ChannelConnectionCard</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Individual card with status dot, message count, last active date,
          and connect/disconnect/configure/delete action buttons.
        </p>
        <div className="max-w-xl space-y-2">
          {SAMPLE_CHANNELS.map((ch) => (
            <ChannelConnectionCard
              key={ch.id}
              connection={ch}
              onConnect={(c: ChannelConnection) => console.log("Connect:", c.id)}
              onDisconnect={(c: ChannelConnection) => console.log("Disconnect:", c.id)}
              onDelete={(c: ChannelConnection) => console.log("Delete:", c.id)}
            />
          ))}
        </div>
      </div>

      {/* ChannelAvatar */}
      <div>
        <h2 className="text-sm font-semibold mb-3">ChannelAvatar</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Circular branded badge for message sources. Used on chat message
          bubbles to show which channel a message came from.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ChannelAvatar source="telegram" size="sm" />
            <span className="text-sm">Telegram (sm)</span>
          </div>
          <div className="flex items-center gap-2">
            <ChannelAvatar source="telegram" size="md" />
            <span className="text-sm">Telegram (md)</span>
          </div>
          <div className="flex items-center gap-2">
            <ChannelAvatar source="slack" size="sm" />
            <span className="text-sm">Slack (sm)</span>
          </div>
          <div className="flex items-center gap-2">
            <ChannelAvatar source="slack" size="md" />
            <span className="text-sm">Slack (md)</span>
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* ChannelSetupForm (existing page) */}
      <ChannelSetupFormPage />
    </div>
  );
}
