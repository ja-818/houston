import { useEffect, useRef } from "react";
import type { HoustonEvent } from "@houston-ai/core";
import { subscribeHoustonEvents } from "../lib/events";
import { analytics } from "../lib/analytics";
import { useWorkspaceStore } from "../stores/workspaces";
import { tauriPreferences } from "../lib/tauri";

const ONBOARDING_KEY_PREFIX = "onboarding_completed:";

/**
 * Subscribes to the HoustonEvent firehose and fires analytics for events
 * that originate from the backend (streaming replies, session completion,
 * backend errors) — i.e. anything that has no obvious call site in the
 * React code.
 *
 * Mount once in App.tsx. Never mounted in ui/ (library boundary rule).
 */
export function useAnalyticsSubscriber() {
  // Guard against firing `onboarding_completed` more than once per workspace
  // within a single session before the tauriPreferences round-trip returns.
  const onboardingFiredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unlisten = subscribeHoustonEvents((p: HoustonEvent) => {
      switch (p.type) {
        case "FeedItem": {
          // Activation signal: user got a finalized assistant reply.
          // "assistant_text_streaming" is skipped — it fires continuously
          // during streaming and would inflate counts. "assistant_text" is
          // emitted once per reply when the stream finalizes.
          if (p.data.item.feed_type === "assistant_text") {
            analytics.track("chat_message_received", {
              agent_path: p.data.agent_path,
              session_key: p.data.session_key,
            });
          }
          break;
        }

        case "SessionStatus": {
          const { status, agent_path, session_key, error } = p.data;
          if (status !== "completed" && status !== "error") break;

          analytics.track("session_ended", {
            agent_path,
            session_key,
            status,
          });

          if (status === "completed") {
            const workspace = useWorkspaceStore.getState().current;
            if (workspace && !onboardingFiredRef.current.has(workspace.id)) {
              const prefKey = ONBOARDING_KEY_PREFIX + workspace.id;
              tauriPreferences
                .get(prefKey)
                .then((existing) => {
                  if (existing) return;
                  onboardingFiredRef.current.add(workspace.id);
                  analytics.track("onboarding_completed", {
                    workspace_id: workspace.id,
                  });
                  tauriPreferences
                    .set(prefKey, new Date().toISOString())
                    .catch(() => {});
                })
                .catch(() => {});
            }
          }

          if (status === "error" && error) {
            analytics.track("error_shown", {
              source: "session",
              agent_path,
              error: error.slice(0, 200),
            });
          }
          break;
        }

        case "Toast": {
          if (p.data.variant === "error") {
            analytics.track("error_shown", {
              source: "toast",
              message: (p.data.message ?? "").slice(0, 200),
            });
          }
          break;
        }
      }
    });

    return () => unlisten();
  }, []);
}
