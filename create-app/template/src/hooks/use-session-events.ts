import { useKeelEvent } from "@deck-ui/core";
import { useFeedStore } from "../stores/feeds";
import type { FeedItem } from "@deck-ui/chat";

interface KeelEventPayload {
  FeedItem?: { session_key: string; item: FeedItem };
  SessionStatus?: { session_key: string; status: string; error?: string };
  Toast?: { message: string; variant: string };
  [key: string]: unknown;
}

/**
 * Subscribe to keel-event from the Rust backend.
 * Dispatches feed items to the feed store.
 * Add more handlers as you add features (kanban, events, memory, etc.).
 */
export function useSessionEvents() {
  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);

  useKeelEvent<KeelEventPayload>("keel-event", (payload) => {
    if (payload.FeedItem) {
      pushFeedItem(payload.FeedItem.session_key, payload.FeedItem.item);
    }

    if (payload.SessionStatus) {
      const { session_key, status, error } = payload.SessionStatus;
      if (status === "error" && error) {
        console.error(`[session:${session_key}]`, error);
      }
    }

    if (payload.Toast) {
      console.log(`[toast:${payload.Toast.variant}]`, payload.Toast.message);
    }
  });
}
