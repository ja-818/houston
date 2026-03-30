/**
 * ChannelSetupForm — Configuration form for Slack or Telegram channel setup.
 * Shows appropriate fields and help text based on channel type.
 */
import { Loader2 } from "lucide-react"
import { cn } from "@deck-ui/core"
import type { ChannelType } from "./types"
import { CHANNEL_LABELS } from "./types"
import { useState } from "react"

export interface ChannelSetupFormProps {
  type: ChannelType
  onSubmit: (config: Record<string, string>) => void
  onCancel?: () => void
  loading?: boolean
  error?: string | null
}

const inputClass = cn(
  "w-full px-3 py-2 rounded-xl border border-border bg-white",
  "text-sm text-foreground placeholder:text-muted-foreground/60",
  "focus:outline-none focus:border-border/80 transition-colors",
)

const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block"
const helpClass = "text-[11px] text-muted-foreground mt-1"

export function ChannelSetupForm({
  type,
  onSubmit,
  onCancel,
  loading,
  error,
}: ChannelSetupFormProps) {
  const [config, setConfig] = useState<Record<string, string>>({})

  const updateField = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(config)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-sm font-medium text-foreground">
        Set up {CHANNEL_LABELS[type]}
      </h3>

      {type === "slack" && (
        <>
          <div>
            <label className={labelClass}>Bot Token</label>
            <input
              type="password"
              value={config.bot_token ?? ""}
              onChange={(e) => updateField("bot_token", e.target.value)}
              placeholder="xoxb-..."
              className={inputClass}
              autoComplete="off"
            />
            <p className={helpClass}>
              Find this in your Slack app settings under OAuth &amp; Permissions.
            </p>
          </div>
          <div>
            <label className={labelClass}>App Token</label>
            <input
              type="password"
              value={config.app_token ?? ""}
              onChange={(e) => updateField("app_token", e.target.value)}
              placeholder="xapp-..."
              className={inputClass}
              autoComplete="off"
            />
            <p className={helpClass}>
              Create an app-level token in your Slack app&apos;s Basic
              Information page with the connections:write scope.
            </p>
          </div>
        </>
      )}

      {type === "telegram" && (
        <div>
          <label className={labelClass}>Bot Token</label>
          <input
            type="password"
            value={config.bot_token ?? ""}
            onChange={(e) => updateField("bot_token", e.target.value)}
            placeholder="123456:ABC-DEF..."
            className={inputClass}
            autoComplete="off"
          />
          <p className={helpClass}>
            Get this from @BotFather on Telegram. Send /newbot and follow
            the prompts to create a bot and receive your token.
          </p>
        </div>
      )}

      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "h-9 px-4 text-sm font-medium rounded-full",
            "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
            "disabled:opacity-50 inline-flex items-center gap-1.5",
          )}
        >
          {loading && <Loader2 className="size-3.5 animate-spin" />}
          Test Connection
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "h-9 px-4 text-sm font-medium rounded-full",
              "border border-border text-muted-foreground",
              "hover:bg-secondary transition-colors",
            )}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
