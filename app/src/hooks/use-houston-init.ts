import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useExperienceStore } from "../stores/experiences";
import { useOrganizationStore } from "../stores/organizations";
import { useWorkspaceStore } from "../stores/workspaces";
import { useUIStore } from "../stores/ui";

/**
 * App initialization hook. Called once in App.tsx.
 * Loads organizations, experiences, workspaces, restores last state,
 * checks Claude CLI availability, and sets initial viewMode.
 */
export function useHoustonInit() {
  const initRef = useRef(false);
  const loadExperiences = useExperienceStore((s) => s.loadExperiences);
  const loadOrganizations = useOrganizationStore((s) => s.loadOrganizations);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const setCurrent = useWorkspaceStore((s) => s.setCurrent);
  const setClaudeAvailable = useUIStore((s) => s.setClaudeAvailable);
  const setViewMode = useUIStore((s) => s.setViewMode);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      // 1. Load experiences
      await loadExperiences();

      // 2. Load organizations (Rust side creates "Personal" default if empty)
      await loadOrganizations();

      // 3. Restore last org from preferences, or use default
      const orgState = useOrganizationStore.getState();
      let currentOrg = orgState.current;
      try {
        const lastOrgId = await invoke<string | null>("get_preference", {
          key: "last_org_id",
        });
        if (lastOrgId) {
          const saved = orgState.organizations.find((o) => o.id === lastOrgId);
          if (saved) {
            useOrganizationStore.getState().setCurrent(saved);
            currentOrg = saved;
          }
        }
      } catch (e) {
        console.error("[init] Failed to restore last org:", e);
      }

      // 4. Load workspaces for current org
      if (currentOrg) {
        await loadWorkspaces(currentOrg.id);
      }

      // 5. Restore last workspace from preferences
      try {
        const lastId = await invoke<string | null>("get_preference", {
          key: "last_workspace_id",
        });
        if (lastId) {
          const workspaces = useWorkspaceStore.getState().workspaces;
          const saved = workspaces.find((w) => w.id === lastId);
          if (saved) {
            setCurrent(saved);
            const experience = useExperienceStore
              .getState()
              .getById(saved.experienceId);
            if (experience?.manifest.defaultTab) {
              setViewMode(experience.manifest.defaultTab);
            }
          }
        }
      } catch (e) {
        console.error("[init] Failed to restore last workspace:", e);
      }

      // 6. Check Claude CLI availability
      try {
        const available = await invoke<boolean>("check_claude_cli");
        setClaudeAvailable(available);
      } catch {
        setClaudeAvailable(false);
      }
    }

    init();
  }, [
    loadExperiences,
    loadOrganizations,
    loadWorkspaces,
    setCurrent,
    setClaudeAvailable,
    setViewMode,
  ]);
}
