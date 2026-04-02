import type { FeedItem } from "./types";

/**
 * Smart-merge a new FeedItem into an existing feed array.
 *
 * Handles streaming replacement logic:
 * - `thinking_streaming` replaces previous `thinking_streaming`
 * - `thinking` (final) replaces last `thinking_streaming`
 * - `assistant_text_streaming` replaces previous `assistant_text_streaming`
 * - `assistant_text` (final) replaces last `assistant_text_streaming`
 * - Everything else is appended.
 *
 * Use this in your Zustand/Redux store to avoid duplicating merge logic.
 */
export function mergeFeedItem(items: FeedItem[], item: FeedItem): FeedItem[] {
  const last = items[items.length - 1];

  if (item.feed_type === "thinking_streaming") {
    if (last?.feed_type === "thinking_streaming") {
      return [...items.slice(0, -1), item];
    }
  }

  if (item.feed_type === "thinking") {
    if (last?.feed_type === "thinking_streaming") {
      return [...items.slice(0, -1), item];
    }
  }

  if (item.feed_type === "assistant_text_streaming") {
    if (last?.feed_type === "assistant_text_streaming") {
      return [...items.slice(0, -1), item];
    }
  }

  if (item.feed_type === "assistant_text") {
    if (last?.feed_type === "assistant_text_streaming") {
      return [...items.slice(0, -1), item];
    }
  }

  return [...items, item];
}
