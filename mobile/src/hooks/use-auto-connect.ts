import { useEffect } from "react";
import { syncClient } from "@/lib/sync-client";
import { useMobileStore } from "@/lib/store";

const DEFAULT_RELAY_URL = "wss://houston-relay.julianarango1818.workers.dev";

/** Read the relay URL from Vite env, falling back to the shared default. */
function getRelayUrl(): string {
  const fromEnv = import.meta.env.VITE_RELAY_URL;
  return typeof fromEnv === "string" && fromEnv.length > 0
    ? fromEnv
    : DEFAULT_RELAY_URL;
}

/**
 * Auto-connect to the relay if a ?token= param is in the URL.
 * QR code encodes: https://houston-companion.pages.dev/?token=XXXXX
 *
 * No localStorage persistence — each session requires a fresh QR scan.
 * The desktop generates a new token each time, so old tokens are useless.
 */
export function useAutoConnect(): void {
  const setPairingUrl = useMobileStore((s) => s.setPairingUrl);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) return;

    // Clean the URL
    window.history.replaceState({}, "", "/");

    const wsUrl = `${getRelayUrl()}/sync/${token}?role=mobile`;
    console.log("[sync] Connecting with token:", token.slice(0, 8) + "...");
    setPairingUrl(wsUrl);
    syncClient.connect(wsUrl);
  }, [setPairingUrl]);
}
