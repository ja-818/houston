import { useEffect, useRef } from "react";
import { tauriPreferences, tauriProvider } from "../lib/tauri";
import { useAgentCatalogStore } from "../stores/agent-catalog";
import { useWorkspaceStore } from "../stores/workspaces";
import { useAgentStore } from "../stores/agents";
import { useUIStore } from "../stores/ui";

/**
 * App initialization hook. Called once in App.tsx.
 */
export function useHoustonInit() {
  const initRef = useRef(false);
  const loadConfigs = useAgentCatalogStore((s) => s.loadConfigs);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const loadAgents = useAgentStore((s) => s.loadAgents);
  const setCurrent = useAgentStore((s) => s.setCurrent);
  const setClaudeAvailable = useUIStore((s) => s.setClaudeAvailable);
  const setViewMode = useUIStore((s) => s.setViewMode);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      await loadConfigs();
      await loadWorkspaces();

      const wsState = useWorkspaceStore.getState();
      let currentWorkspace = wsState.current;
      try {
        const lastWsId = await tauriPreferences.get("last_workspace_id");
        if (lastWsId) {
          const saved = wsState.workspaces.find((w) => w.id === lastWsId);
          if (saved) {
            useWorkspaceStore.getState().setCurrent(saved);
            currentWorkspace = saved;
          }
        }
      } catch (e) {
        console.error("[init] Failed to restore last workspace:", e);
      }

      if (currentWorkspace) {
        await loadAgents(currentWorkspace.id);
      }

      try {
        const lastId = await tauriPreferences.get("last_agent_id");
        if (lastId) {
          const agents = useAgentStore.getState().agents;
          const saved = agents.find((a) => a.id === lastId);
          if (saved) {
            setCurrent(saved);
            const agentDef = useAgentCatalogStore.getState().getById(saved.configId);
            if (agentDef?.config.defaultTab) {
              setViewMode(agentDef.config.defaultTab);
            }
          }
        }
      } catch (e) {
        console.error("[init] Failed to restore last agent:", e);
      }

      // Check if the default provider's CLI is available
      try {
        const defaultProv = await tauriProvider.getDefault();
        if (defaultProv) {
          const status = await tauriProvider.checkStatus(defaultProv);
          setClaudeAvailable(status.cli_installed && status.authenticated);
        } else {
          // No provider configured — wizard will handle this
          setClaudeAvailable(false);
        }
      } catch {
        setClaudeAvailable(false);
      }
    }

    init();
  }, [loadConfigs, loadWorkspaces, loadAgents, setCurrent, setClaudeAvailable, setViewMode]);
}
