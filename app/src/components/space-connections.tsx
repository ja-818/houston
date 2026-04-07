import { useState, useEffect, useCallback } from "react";
import { ConnectionsView } from "@houston-ai/connections";
import type { ConnectionsResult } from "@houston-ai/connections";
import { tauriConnections, tauriSystem } from "../lib/tauri";
import { useComposioAuth } from "../hooks/use-composio-auth";
import { ComposioAuthDialog } from "./composio-auth-dialog";

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
    tauriSystem.openUrl(COMPOSIO_DASHBOARD_URL);
  }, []);

  const auth = useComposioAuth(fetchConnections);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto w-full px-6 py-6">
        <h1 className="text-[28px] font-normal text-foreground mb-6">
          Connections
        </h1>
        <ConnectionsView
          result={result}
          loading={loading}
          onRetry={fetchConnections}
          onManage={handleManage}
          onAuth={auth.startAuth}
        />
      </div>

      <ComposioAuthDialog
        state={auth.state}
        onClose={auth.close}
        onReopen={auth.reopen}
        onTogglePaste={auth.togglePaste}
        onPasteChange={auth.setPasteValue}
        onPasteSubmit={auth.submitPaste}
      />
    </div>
  );
}
