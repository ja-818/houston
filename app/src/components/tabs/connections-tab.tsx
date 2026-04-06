import { useState, useEffect, useCallback } from "react";
import { ConnectionsView } from "@houston-ai/connections";
import type { ConnectionsResult } from "@houston-ai/connections";
import { invoke } from "@tauri-apps/api/core";
import { ContentArea } from "../shell/content-area";
import { tauriConnections } from "../../lib/tauri";
import type { TabProps } from "../../lib/types";

const COMPOSIO_DASHBOARD_URL = "https://dashboard.composio.dev";

export default function ConnectionsTab(_props: TabProps) {
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
      <ConnectionsView
        result={result}
        loading={loading}
        onRetry={fetchConnections}
        onManage={handleManage}
        onAuth={handleAuth}
      />
    </ContentArea>
  );
}
