import type { ChatStatus } from "./chat-panel-types";
import type { FeedItem } from "./types";

export function deriveStatus(items: FeedItem[], isLoading: boolean): ChatStatus {
  const last = items[items.length - 1];
  if (
    last?.feed_type === "assistant_text_streaming" ||
    last?.feed_type === "thinking_streaming" ||
    last?.feed_type === "thinking" ||
    last?.feed_type === "tool_call" ||
    last?.feed_type === "tool_result"
  ) {
    return "streaming";
  }
  if (last?.feed_type === "user_message") return "submitted";
  if (isLoading && items.length === 0) return "submitted";
  return "ready";
}
