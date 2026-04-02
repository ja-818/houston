import { Hash, Send, Settings, Trash2, Power, PowerOff } from "lucide-react"
import { cn } from "@deck-ui/core"
import type { ChannelConnection } from "./types"
import { CHANNEL_LABELS } from "./types"

export interface ChannelConnectionCardProps {
  connection: ChannelConnection
  onConnect?: (connection: ChannelConnection) => void
  onDisconnect?: (connection: ChannelConnection) => void
  onConfigure?: (connection: ChannelConnection) => void
  onDelete?: (connection: ChannelConnection) => void
}

const STATUS_DOT: Record<string, string> = {
  connected: "bg-success",
  error: "bg-destructive",
  connecting: "bg-yellow-500",
  disconnected: "bg-muted-foreground/40",
}

const STATUS_LABEL: Record<string, string> = {
  connected: "Connected",
  error: "Error",
  connecting: "Connecting",
  disconnected: "Disconnected",
}

const CHANNEL_ICON: Record<string, typeof Hash> = {
  slack: Hash,
  telegram: Send,
}

const btnClass = cn(
  "size-8 flex items-center justify-center rounded-lg",
  "text-muted-foreground transition-colors",
  "hover:text-foreground hover:bg-accent",
)

export function ChannelConnectionCard({
  connection,
  onConnect,
  onDisconnect,
  onConfigure,
  onDelete,
}: ChannelConnectionCardProps) {
  const Icon = CHANNEL_ICON[connection.type] ?? Hash
  const label = CHANNEL_LABELS[connection.type] ?? connection.type
  const isConnected = connection.status === "connected"
  const isConnecting = connection.status === "connecting"

  const lastActive = connection.lastActiveAt
    ? new Date(connection.lastActiveAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null

  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-xl border border-border p-4",
        "bg-background transition-colors",
      )}
    >
      {/* Icon */}
      <div className="size-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <Icon className="size-4.5 text-foreground" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-foreground truncate">
            {connection.name}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className={cn(
                "size-1.5 rounded-full",
                STATUS_DOT[connection.status] ?? "bg-muted-foreground/40",
              )}
            />
            <span className="text-[11px] text-muted-foreground">
              {STATUS_LABEL[connection.status] ?? connection.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
          <span>{label}</span>
          {connection.messageCount > 0 && (
            <>
              <span>&middot;</span>
              <span>
                {connection.messageCount} message
                {connection.messageCount !== 1 ? "s" : ""}
              </span>
            </>
          )}
          {lastActive && (
            <>
              <span>&middot;</span>
              <span>Last active {lastActive}</span>
            </>
          )}
        </div>
        {connection.status === "error" && connection.error && (
          <p className="text-[11px] text-destructive mt-1 truncate">
            {connection.error}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {isConnected ? (
          <button
            onClick={() => onDisconnect?.(connection)}
            className={btnClass}
            title="Disconnect"
          >
            <PowerOff className="size-3.5" />
          </button>
        ) : (
          <button
            onClick={() => onConnect?.(connection)}
            disabled={isConnecting}
            className={cn(btnClass, "disabled:opacity-50")}
            title="Connect"
          >
            <Power className="size-3.5" />
          </button>
        )}
        <button
          onClick={() => onConfigure?.(connection)}
          className={btnClass}
          title="Configure"
        >
          <Settings className="size-3.5" />
        </button>
        <button
          onClick={() => onDelete?.(connection)}
          className={cn(btnClass, "hover:text-destructive")}
          title="Delete"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
