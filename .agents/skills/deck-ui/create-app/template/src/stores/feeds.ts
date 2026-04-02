import { create } from "zustand";
import type { FeedItem } from "@deck-ui/chat";

interface FeedState {
  items: Record<string, FeedItem[]>;
  pushFeedItem: (sessionKey: string, item: FeedItem) => void;
  clearFeed: (sessionKey: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  items: {},

  pushFeedItem: (sessionKey, item) =>
    set((s) => {
      const existing = s.items[sessionKey] ?? [];

      // Smart merging: consecutive streaming text items replace the last one.
      if (
        item.feed_type === "assistant_text_streaming" &&
        existing.length > 0
      ) {
        const last = existing[existing.length - 1];
        if (last.feed_type === "assistant_text_streaming") {
          return {
            items: {
              ...s.items,
              [sessionKey]: [...existing.slice(0, -1), item],
            },
          };
        }
      }

      return {
        items: {
          ...s.items,
          [sessionKey]: [...existing, item],
        },
      };
    }),

  clearFeed: (sessionKey) =>
    set((s) => {
      const next = { ...s.items };
      delete next[sessionKey];
      return { items: next };
    }),
}));
