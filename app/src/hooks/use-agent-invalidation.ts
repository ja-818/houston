import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useQueryClient } from "@tanstack/react-query";
import type { HoustonEvent } from "@houston-ai/core";
import { queryKeys } from "../lib/query-keys";

/**
 * Maps workspace-change events from Rust (both Tauri command emissions
 * and file watcher) to TanStack Query invalidations.
 *
 * One hook, mounted once in App. Covers ALL workspace data types.
 */
export function useWorkspaceInvalidation() {
  const qc = useQueryClient();

  useEffect(() => {
    const unlisten = listen<HoustonEvent>("houston-event", (event) => {
      const p = event.payload;

      switch (p.type) {
        case "ActivityChanged":
          qc.invalidateQueries({ queryKey: queryKeys.activity(p.data.workspace_path) });
          qc.invalidateQueries({ queryKey: ["all-conversations"] });
          break;
        case "SkillsChanged":
          qc.invalidateQueries({ queryKey: queryKeys.skills(p.data.workspace_path) });
          break;
        case "LearningsChanged":
          qc.invalidateQueries({ queryKey: queryKeys.learnings(p.data.workspace_path) });
          break;
        case "ChannelsConfigChanged":
          qc.invalidateQueries({ queryKey: queryKeys.channels(p.data.workspace_path) });
          break;
        case "FilesChanged":
          qc.invalidateQueries({ queryKey: queryKeys.files(p.data.workspace_path) });
          break;
        case "ConfigChanged":
          qc.invalidateQueries({ queryKey: queryKeys.config(p.data.workspace_path) });
          break;
        case "ContextChanged":
          qc.invalidateQueries({ queryKey: queryKeys.contextFiles(p.data.workspace_path) });
          break;
        case "ConversationsChanged":
          qc.invalidateQueries({ queryKey: queryKeys.conversations(p.data.workspace_path) });
          qc.invalidateQueries({ queryKey: ["all-conversations"] });
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
