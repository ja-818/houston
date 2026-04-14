import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tauriConnections } from "../lib/tauri";
import { queryKeys } from "../lib/query-keys";
import { logger } from "../lib/logger";

/**
 * Shared helper for any surface that initiates a Composio OAuth flow
 * by opening a browser (Integrations tab Connect button, inline
 * `ComposioLinkCard` in chat, etc.).
 *
 * `markWaitingForAuth(slug)` kicks off a ~60s poll loop that checks
 * `composio connections list` every 4s until the slug appears in the
 * result, then invalidates the shared query so every surface updates.
 */
export function useComposioRefetchOnReturn(): (slug: string) => void {
  const qc = useQueryClient();
  const pollersRef = useRef<Map<string, number>>(new Map());
  const waitingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleRefocus = () => {
      if (waitingRef.current.size === 0) return;
      qc.invalidateQueries({ queryKey: queryKeys.connectedToolkits() });
    };
    window.addEventListener("focus", handleRefocus);
    document.addEventListener("visibilitychange", handleRefocus);
    return () => {
      window.removeEventListener("focus", handleRefocus);
      document.removeEventListener("visibilitychange", handleRefocus);
    };
  }, [qc]);

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
      if (pollersRef.current.has(slug)) return;

      waitingRef.current.add(slug);
      let attempts = 0;
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
          const connected = await tauriConnections.listConnectedToolkits();
          if (connected.includes(slug)) {
            qc.invalidateQueries({
              queryKey: queryKeys.connectedToolkits(),
            });
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
      void tick();
    },
    [qc],
  );
}
