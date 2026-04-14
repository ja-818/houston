import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query-keys";
import { tauriConnections } from "../../lib/tauri";

export function useConnections() {
  return useQuery({
    queryKey: queryKeys.connections(),
    queryFn: () => tauriConnections.list(),
    // Auth-state-sensitive query: its result depends on whether a valid
    // Composio token exists. If we refetch on window focus, a fetch can
    // start mid-OAuth (before the token is stored) and resolve with a stale
    // `needs_auth` that then races with — and overwrites — our explicit
    // post-auth reset. We invalidate explicitly after auth, connect, etc.
    refetchOnWindowFocus: false,
  });
}

export function useComposioApps() {
  return useQuery({
    queryKey: ["composio-apps"],
    queryFn: () => tauriConnections.listApps(),
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * List all connected toolkit slugs in the consumer namespace.
 * Uses `composio connections list` (single CLI call, no probing).
 */
export function useConnectedToolkits(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.connectedToolkits(),
    queryFn: () => tauriConnections.listConnectedToolkits(),
    enabled,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
}

export function useInvalidateConnections() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.connections() });
}

export function useResetConnections() {
  const qc = useQueryClient();
  return async () => {
    await qc.cancelQueries({ queryKey: queryKeys.connections() });
    await qc.resetQueries({ queryKey: queryKeys.connections() });
  };
}
