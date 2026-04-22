import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { HoustonEvent } from "@houston-ai/core";
import type { FeedItem } from "@houston-ai/chat";
import { useFeedStore } from "../stores/feeds";
import { useUIStore } from "../stores/ui";
import { useWorkspaceStore } from "../stores/workspaces";
import { useAgentStore } from "../stores/agents";
import { tauriActivity } from "../lib/tauri";
import { subscribeHoustonEvents, listenOsEvent } from "../lib/events";
import { logger } from "../lib/logger";

// Pending navigation set when a completion notification fires.
// Consumed on the next window focus event (however it arrives).
let pendingNotificationNav: { agentId: string; activityId: string } | null = null;
let pendingNavTimer: ReturnType<typeof setTimeout> | null = null;

function consumePendingNav() {
  if (!pendingNotificationNav) return;
  const { agentId, activityId } = pendingNotificationNav;
  pendingNotificationNav = null;
  if (pendingNavTimer) { clearTimeout(pendingNavTimer); pendingNavTimer = null; }

  const agents = useAgentStore.getState().agents;
  logger.debug(`[notification] consuming nav: agentId=${agentId} activityId=${activityId} agents=[${agents.map(a => a.id).join(",")}]`);
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) {
    logger.debug("[notification] agent not found — cannot navigate");
    return;
  }

  logger.debug(`[notification] navigating → agent=${agent.name} activity=${activityId}`);
  useUIStore.getState().setViewMode("activity");
  useAgentStore.getState().setCurrent(agent);
  useUIStore.getState().setActivityPanelId(activityId);
}

async function sendNotification(
  title: string,
  body: string,
  nav?: { agentId: string; activityId: string },
) {
  try {
    const {
      isPermissionGranted,
      requestPermission,
      sendNotification: notify,
    } = await import("@tauri-apps/plugin-notification");

    let granted = await isPermissionGranted();
    if (!granted) {
      const perm = await requestPermission();
      granted = perm === "granted";
    }
    if (granted) {
      notify({ title, body, sound: "Glass" });
      if (nav) {
        pendingNotificationNav = nav;
        if (pendingNavTimer) clearTimeout(pendingNavTimer);
        pendingNavTimer = setTimeout(() => { pendingNotificationNav = null; }, 5 * 60 * 1000);
        logger.debug(`[notification] pending nav set: agentId=${nav.agentId} activityId=${nav.activityId}`);

        // If the window is already focused, no focus-change event will fire when
        // the user clicks the banner. Navigate immediately using Tauri's reliable
        // isFocused() (unlike document.hasFocus() which is broken in WKWebView).
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const focused = await getCurrentWindow().isFocused();
        if (focused) {
          logger.debug("[notification] window already focused (Tauri) — navigating immediately");
          consumePendingNav();
        }
      }
    }
  } catch (e) {
    console.error("[notification] Failed:", e);
  }
}

/**
 * Subscribe to "houston-event" from the Rust backend.
 * Handles FeedItem, SessionStatus, Toast, AuthRequired, and native notifications.
 *
 * NOTE: Data invalidation is handled by useWorkspaceInvalidation (TanStack Query).
 * This hook only handles push-based events (streaming, toasts, notifications).
 */
export function useSessionEvents() {
  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);
  const addToast = useUIStore((s) => s.addToast);
  const setAuthRequired = useUIStore((s) => s.setAuthRequired);

  const handlersRef = useRef({
    pushFeedItem,
    addToast,
    setAuthRequired,
    getWorkspace: () => useWorkspaceStore.getState().current,
    getAgent: () => useAgentStore.getState().current,
  });
  handlersRef.current = {
    pushFeedItem,
    addToast,
    setAuthRequired,
    getWorkspace: () => useWorkspaceStore.getState().current,
    getAgent: () => useAgentStore.getState().current,
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const unlisten = subscribeHoustonEvents((payload: HoustonEvent) => {
      const h = handlersRef.current;

      switch (payload.type) {
        case "FeedItem":
          h.pushFeedItem(
            payload.data.agent_path,
            payload.data.session_key,
            payload.data.item as FeedItem,
          );
          break;
        case "SessionStatus": {
          const { status, error, session_key, agent_path } = payload.data;
          if (status === "error" && error) {
            // When auth is required, the backend has emitted AuthRequired and
            // the inline reconnect card renders from the authRequired store
            // state. Suppress the generic "Session error: ..." system message
            // so the feed doesn't show a raw error *and* the card.
            const isAuth = useUIStore.getState().authRequired !== null;
            if (!isAuth) {
              h.pushFeedItem(agent_path, session_key, {
                feed_type: "system_message",
                data: `Session error: ${error}`,
              } as FeedItem);
            } else {
              logger.info(
                `[auth] suppressing Session error system_message for ${agent_path}/${session_key} — card handles it`,
              );
            }
          }
          if (status === "completed") {
            const workspace = h.getWorkspace();
            const agent = h.getAgent();
            const workspaceName = workspace?.name ?? "Houston";
            const agentName = agent?.name ?? "Agent";
            let nav: { agentId: string; activityId: string } | undefined;

            // Move activity to "needs_you" — the ActivityChanged event
            // emitted by the Rust update command will auto-invalidate queries.
            // Skip routine-* sessions — the routine runner handles their lifecycle.
            if (session_key.startsWith("activity-") && !session_key.startsWith("routine-")) {
              const activityId = session_key.replace("activity-", "");
              // Use the event's agent_path so we update the right agent even
              // if the user has since navigated away from it.
              tauriActivity.update(agent_path, activityId, { status: "needs_you" }).catch((e) =>
                console.error("[session] Failed to update activity status:", e),
              );
              // Only navigate if the completed session belongs to the currently-open agent.
              if (agent?.id && agent.folderPath === agent_path) {
                nav = { agentId: agent.id, activityId };
              } else {
                logger.debug(`[notification] session completed for a non-active agent: agent_path=${agent_path}`);
              }
            }

            sendNotification(`${workspaceName} — ${agentName}`, "Your agent has finished working.", nav);
          }
          break;
        }
        case "Toast":
          h.addToast({
            title: payload.data.message,
          });
          break;
        case "AuthRequired":
          logger.info(`[auth] AuthRequired received: provider=${payload.data.provider}`);
          h.setAuthRequired(payload.data.provider);
          break;
      }
    });

    // Case: user clicks notification → plugin fires onAction directly.
    // This is the most reliable path for macOS desktop notification clicks.
    let unlistenNotificationAction: (() => void) | undefined;
    import("@tauri-apps/plugin-notification").then(({ onAction }) => {
      onAction((action) => {
        logger.debug(`[notification] onAction fired: ${JSON.stringify(action)} pendingNav=${JSON.stringify(pendingNotificationNav)}`);
        consumePendingNav();
      }).then((unlisten) => {
        unlistenNotificationAction = () => { unlisten.unregister(); };
      }).catch((e) => {
        logger.debug(`[notification] onAction registration failed: ${e}`);
      });
    });

    // Case: app in background — user clicks notification → OS activates app →
    // Rust emits "app-activated" via RunEvent::Resumed → we consume pending nav.
    // Also refresh the agent list so any external changes (e.g. Finder delete) are picked up.
    const unlistenActivated = listenOsEvent<unknown>("app-activated", () => {
      logger.debug(`[notification] app-activated event fired: pendingNav=${JSON.stringify(pendingNotificationNav)}`);
      consumePendingNav();
      const ws = useWorkspaceStore.getState().current;
      if (ws) {
        // Silent refresh — don't flip loading:true, which would unmount the
        // entire UI tree and wipe local state (open modals, sub-tabs, panels).
        useAgentStore.getState().loadAgents(ws.id, { silent: true });
      }
    });

    // Fallback: Tauri window focus event (fires when user switches to the app any way).
    const unlistenTauriFocus = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (!focused || !pendingNotificationNav) return;
      logger.debug(`[notification] onFocusChanged fired: focused=${focused} pendingNav=${JSON.stringify(pendingNotificationNav)}`);
      consumePendingNav();
    });

    return () => {
      unlisten();
      unlistenActivated();
      unlistenNotificationAction?.();
      unlistenTauriFocus.then((fn) => fn());
    };
  }, []);
}
