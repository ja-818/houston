import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import type { HoustonEvent } from "@houston-ai/core";
import type { FeedItem } from "@houston-ai/chat";
import { useFeedStore } from "../stores/feeds";
import { useUIStore } from "../stores/ui";
import { useSpaceStore } from "../stores/spaces";
import { useWorkspaceStore } from "../stores/workspaces";

function sendNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (document.hasFocus()) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") new Notification(title, { body });
    });
  }
}

/**
 * Subscribe to "houston-event" from the Rust backend.
 * Handles FeedItem, SessionStatus, Toast, AuthRequired, and native notifications.
 */
export function useSessionEvents() {
  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);
  const addToast = useUIStore((s) => s.addToast);
  const setAuthRequired = useUIStore((s) => s.setAuthRequired);

  const handlersRef = useRef({
    pushFeedItem,
    addToast,
    setAuthRequired,
    getSpace: () => useSpaceStore.getState().current,
    getWorkspace: () => useWorkspaceStore.getState().current,
  });
  handlersRef.current = {
    pushFeedItem,
    addToast,
    setAuthRequired,
    getSpace: () => useSpaceStore.getState().current,
    getWorkspace: () => useWorkspaceStore.getState().current,
  };

  useEffect(() => {
    // Request notification permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const unlisten = listen<HoustonEvent>("houston-event", (event) => {
      const h = handlersRef.current;
      const payload = event.payload;

      switch (payload.type) {
        case "FeedItem":
          h.pushFeedItem(
            payload.data.session_key,
            payload.data.item as FeedItem,
          );
          break;
        case "SessionStatus": {
          const { status, error, session_key } = payload.data;
          if (status === "error" && error) {
            h.pushFeedItem(session_key, {
              feed_type: "system_message",
              data: `Session error: ${error}`,
            } as FeedItem);
          }
          if (status === "completed") {
            const space = h.getSpace();
            const workspace = h.getWorkspace();
            const spaceName = space?.name ?? "Houston";
            const wsName = workspace?.name ?? "AI Workspace";
            sendNotification(
              `${spaceName} — ${wsName}`,
              "Your agent has finished working.",
            );
          }
          break;
        }
        case "Toast":
          h.addToast({
            title: payload.data.message,
          });
          break;
        case "AuthRequired":
          h.setAuthRequired(true);
          break;
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);
}
