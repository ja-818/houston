import type { Conversation } from "@/lib/types";
import { HoustonAvatar } from "./houston-avatar";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface Props {
  conversation: Conversation;
  onSelect: () => void;
}

/**
 * WhatsApp-style conversation row.
 * Avatar (left) — Agent name (top) + Mission title (bottom) — Time (right)
 */
export function ConversationRow({ conversation, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="touchable flex w-full items-center gap-3 px-4 py-3 text-left active:bg-accent"
    >
      <HoustonAvatar
        color={conversation.agentColor}
        ringSize={40}
        glyphSize={20}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold truncate">
            {conversation.agentName}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {timeAgo(conversation.updatedAt)}
          </span>
        </div>
        <p className="text-[13px] text-muted-foreground truncate mt-0.5">
          {conversation.title}
        </p>
      </div>
    </button>
  );
}
