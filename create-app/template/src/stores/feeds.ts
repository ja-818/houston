import { create } from "zustand";
import { mergeFeedItem } from "@deck-ui/chat";
import type { FeedItem } from "@deck-ui/chat";

interface FeedState {
  items: Record<string, FeedItem[]>;
  pushFeedItem: (sessionKey: string, item: FeedItem) => void;
  setFeed: (sessionKey: string, items: FeedItem[]) => void;
  clearFeed: (sessionKey: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  items: {},

  pushFeedItem: (sessionKey, item) =>
    set((s) => ({
      items: {
        ...s.items,
        [sessionKey]: mergeFeedItem(s.items[sessionKey] ?? [], item),
      },
    })),

  setFeed: (sessionKey, items) =>
    set((s) => ({
      items: { ...s.items, [sessionKey]: items },
    })),

  clearFeed: (sessionKey) =>
    set((s) => {
      const next = { ...s.items };
      delete next[sessionKey];
      return { items: next };
    }),
}));
