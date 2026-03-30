/**
 * ChannelsSection — Lists channel connections with an Add Channel button.
 * Shows empty state when no channels are configured.
 */
import { Plus, Radio } from "lucide-react"
import { cn } from "@deck-ui/core"
import type { ChannelConnection, ChannelType } from "./types"
import { CHANNEL_LABELS } from "./types"
import { ChannelConnectionCard } from "./channel-connection-card"
import { useState } from "react"

export interface ChannelsSectionProps {
  channels: ChannelConnection[]
  onConnect?: (channel: ChannelConnection) => void
  onDisconnect?: (channel: ChannelConnection) => void
  onConfigure?: (channel: ChannelConnection) => void
  onDelete?: (channel: ChannelConnection) => void
  onAddChannel?: (type: ChannelType) => void
}

const CHANNEL_TYPES: ChannelType[] = ["slack", "telegram"]

export function ChannelsSection({
  channels,
  onConnect,
  onDisconnect,
  onConfigure,
  onDelete,
  onAddChannel,
}: ChannelsSectionProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Channels</h2>
        </div>
        {onAddChannel && (
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 h-7 px-3 rounded-full",
                "text-xs font-medium text-muted-foreground",
                "border border-border hover:bg-secondary transition-colors",
              )}
            >
              <Plus className="size-3" />
              Add Channel
            </button>
            {showMenu && (
              <div
                className={cn(
                  "absolute right-0 top-full mt-1 z-10",
                  "bg-white border border-border rounded-xl shadow-md",
                  "py-1 min-w-[140px]",
                )}
              >
                {CHANNEL_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      onAddChannel(type)
                      setShowMenu(false)
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm text-foreground",
                      "hover:bg-accent transition-colors",
                    )}
                  >
                    {CHANNEL_LABELS[type]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {channels.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No channels connected yet. Add a Slack or Telegram channel to get
            started.
          </p>
        </div>
      )}

      {/* Channel list */}
      {channels.length > 0 && (
        <div className="space-y-2">
          {channels.map((channel) => (
            <ChannelConnectionCard
              key={channel.id}
              connection={channel}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              onConfigure={onConfigure}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
