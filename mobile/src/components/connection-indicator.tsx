import type { ConnectionState } from "@/lib/types";

interface Props {
  state: ConnectionState;
  /** Hide the label, show just the dot. */
  compact?: boolean;
  className?: string;
}

const LABELS: Record<ConnectionState, string> = {
  connected: "Connected",
  reconnecting: "Reconnecting…",
  disconnected: "Disconnected",
};

const DOT_CLASS: Record<ConnectionState, string> = {
  connected: "bg-emerald-500",
  reconnecting: "bg-amber-500 animate-pulse",
  disconnected: "bg-muted-foreground/50",
};

/**
 * Small colored-dot + label connection state indicator.
 * Designed to fit in a page header (compact horizontal layout).
 */
export function ConnectionIndicator({ state, compact, className }: Props) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className ?? ""}`}
      aria-live="polite"
      aria-label={LABELS[state]}
    >
      <span
        className={`size-2 shrink-0 rounded-full ${DOT_CLASS[state]}`}
        aria-hidden="true"
      />
      {!compact && (
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {LABELS[state]}
        </span>
      )}
    </div>
  );
}
