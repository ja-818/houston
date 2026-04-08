import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useQueryClient } from "@tanstack/react-query";
import type { HoustonEvent } from "@houston-ai/core";
import { queryKeys } from "../lib/query-keys";

/**
 * Maps agent-change events from Rust (both Tauri command emissions
 * and file watcher) to TanStack Query invalidations.
 *
 * One hook, mounted once in App. Covers ALL agent data types.
 */
export function useAgentInvalidation() {
  const qc = useQueryClient();

  useEffect(() => {
    const unlisten = listen<HoustonEvent>("houston-event", (event) => {
      const p = event.payload;
      console.log("[invalidation] event:", p.type, "data" in p ? (p as { data: { agent_path?: string } }).data?.agent_path : "");

      switch (p.type) {
        case "ActivityChanged":
          qc.invalidateQueries({ queryKey: queryKeys.activity(p.data.agent_path) });
          qc.invalidateQueries({ queryKey: ["all-conversations"] });
          break;
        case "IntegrationsChanged":
          qc.invalidateQueries({ queryKey: queryKeys.integrations(p.data.agent_path) });
          break;
        case "SkillsChanged":
          qc.invalidateQueries({ queryKey: queryKeys.skills(p.data.agent_path) });
          break;
        case "LearningsChanged":
          qc.invalidateQueries({ queryKey: queryKeys.learnings(p.data.agent_path) });
          break;
        case "ChannelsConfigChanged":
          qc.invalidateQueries({ queryKey: queryKeys.channels(p.data.agent_path) });
          break;
        case "FilesChanged":
          qc.invalidateQueries({ queryKey: queryKeys.files(p.data.agent_path) });
          break;
        case "ConfigChanged":
          qc.invalidateQueries({ queryKey: queryKeys.config(p.data.agent_path) });
          break;
        case "ContextChanged":
          qc.invalidateQueries({ queryKey: queryKeys.instructions(p.data.agent_path) });
          break;
        case "ConversationsChanged":
          qc.invalidateQueries({ queryKey: queryKeys.conversations(p.data.agent_path) });
          qc.invalidateQueries({ queryKey: ["all-conversations"] });
          break;
        case "RoutinesChanged":
          qc.invalidateQueries({ queryKey: queryKeys.routines(p.data.agent_path) });
          break;
        case "RoutineRunsChanged":
          qc.invalidateQueries({ queryKey: ["routine-runs", p.data.agent_path] });
          break;
        // SessionStatus triggers activity invalidation (agent finished → status changed)
        case "SessionStatus":
          if (p.data.status === "completed" || p.data.status === "error") {
            qc.invalidateQueries({ queryKey: ["activity"] });
            qc.invalidateQueries({ queryKey: ["all-conversations"] });
          }
          break;
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [qc]);
}
