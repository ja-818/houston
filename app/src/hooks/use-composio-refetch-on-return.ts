import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tauriConnections } from "../lib/tauri";
import { logger } from "../lib/logger";

/**
 * Shared helper for any surface that initiates a Composio OAuth flow
 * by opening a browser (Integrations tab Connect button, inline
 * `ComposioLinkCard` in chat, etc.).
 *
 * OAuth flows vary from 5s to 60s+ and Composio's backend sometimes
 * takes a few seconds to propagate a new connection even after the
 * browser redirect finishes. A single refetch on window refocus is
 * too fragile:
 *   - Focus events on Tauri aren't 100% reliable across platforms.
 *   - Even when the refocus fires, the probe may race Composio's
 *     backend propagation and come back "not connected" once.
 *
 * Fix: targeted polling for the specific slug the user just tried to
 * connect. `markWaitingForAuth(slug)` kicks off a ~60s poll loop that
 * probes *only* that slug every few seconds until it flips to
 * connected, then invalidates the shared `connected-toolkits` query
 * so every surface updates at once. The refocus listener stays as a
 * fast-path for the happy case (user returns immediately, probe
 * invalidates the instant they're back).
 *
 * Usage:
 *
 *     const markWaitingForAuth = useComposioRefetchOnReturn();
 *     // ... after opening the OAuth URL:
 *     markWaitingForAuth("gmail");
 */
export function useComposioRefetchOnReturn(): (slug: string) => void {
  const qc = useQueryClient();
  // Slugs currently being polled → the timer handle that's polling
  // them, so we can cancel cleanly on unmount or re-trigger.
  const pollersRef = useRef<Map<string, number>>(new Map());
  const waitingRef = useRef<Set<string>>(new Set());

  // Focus / visibility listener: happy-path fast invalidation.
  // When Houston regains focus and we have any in-flight waits,
  // invalidate the full probe query so the UI updates instantly.
  useEffect(() => {
    const handleRefocus = () => {
      if (waitingRef.current.size === 0) return;
      qc.invalidateQueries({ queryKey: ["connected-toolkits"] });
    };
    window.addEventListener("focus", handleRefocus);
    document.addEventListener("visibilitychange", handleRefocus);
    return () => {
      window.removeEventListener("focus", handleRefocus);
      document.removeEventListener("visibilitychange", handleRefocus);
    };
  }, [qc]);

  // Clean up any pending pollers when the host component unmounts.
  useEffect(() => {
    const pollers = pollersRef.current;
    return () => {
      for (const handle of pollers.values()) {
        window.clearInterval(handle);
      }
      pollers.clear();
    };
  }, []);

  return useCallback(
    (slug: string) => {
      if (!slug) return;
      // If we're already polling this slug, leave the existing poller
      // alone — starting a new one would double-probe.
      if (pollersRef.current.has(slug)) return;

      waitingRef.current.add(slug);
      let attempts = 0;
      // 15 attempts × 4s = 60s window. Composio OAuth flows usually
      // finish in 10-20s; the extra budget covers slow users and
      // backend propagation delay.
      const MAX_ATTEMPTS = 15;
      const INTERVAL_MS = 4000;

      const stop = () => {
        const handle = pollersRef.current.get(slug);
        if (handle !== undefined) {
          window.clearInterval(handle);
          pollersRef.current.delete(slug);
        }
        waitingRef.current.delete(slug);
      };

      const tick = async () => {
        attempts += 1;
        try {
          const connected =
            await tauriConnections.listConnectedToolkits([slug]);
          if (connected.includes(slug)) {
            // Flip: this toolkit is now connected. Invalidate the
            // shared query so every surface (Integrations tab,
            // chat card) picks it up, and stop polling.
            qc.invalidateQueries({ queryKey: ["connected-toolkits"] });
            stop();
            return;
          }
        } catch (e) {
          logger.warn(
            `[composio] poll for ${slug} failed: ${String(e)}`,
          );
        }
        if (attempts >= MAX_ATTEMPTS) {
          stop();
        }
      };

      const handle = window.setInterval(tick, INTERVAL_MS);
      pollersRef.current.set(slug, handle);
      // Fire one immediately so fast flows (Composio already knew
      // about the account, backend replied instantly) update without
      // waiting the first 4s.
      void tick();
    },
    [qc],
  );
}
