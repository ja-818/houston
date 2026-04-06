import { useState, useEffect, useCallback } from "react";
import { ConnectionsView } from "@houston-ai/connections";
import type { ConnectionsResult } from "@houston-ai/connections";
import { invoke } from "@tauri-apps/api/core";
import { ContentArea } from "./shell/content-area";
import { tauriConnections } from "../lib/tauri";

const COMPOSIO_DASHBOARD_URL = "https://dashboard.composio.dev";

export function SpaceConnections() {
  const [result, setResult] = useState<ConnectionsResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tauriConnections.list();
      setResult(data);
    } catch (e) {
      console.error("[connections] Failed to load:", e);
      setResult({ status: "error", message: String(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleManage = useCallback(() => {
    invoke("open_url", { url: COMPOSIO_DASHBOARD_URL });
  }, []);

  const handleAuth = useCallback(async () => {
    setLoading(true);
    try {
      await invoke("start_composio_oauth");
      await fetchConnections();
    } catch (e) {
      console.error("[connections] OAuth failed:", e);
      setResult({ status: "error", message: String(e) });
      setLoading(false);
    }
  }, [fetchConnections]);

  return (
    <ContentArea centered>
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-[28px] font-normal text-foreground mb-6">
          Connections
        </h1>
        <ConnectionsView
          result={result}
          loading={loading}
          onRetry={fetchConnections}
          onManage={handleManage}
          onAuth={handleAuth}
        />
      </div>
    </ContentArea>
  );
}
