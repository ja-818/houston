import { builtinExperiences } from "./builtin";
import type { Experience, ExperienceManifest } from "../lib/types";

export async function loadAllExperiences(): Promise<Experience[]> {
  // Map by ID so installed experiences override builtins with the same ID
  const byId = new Map<string, Experience>();

  // Built-in experiences (inserted first, can be overridden)
  for (const manifest of builtinExperiences) {
    byId.set(manifest.id, { manifest, source: "builtin" });
  }

  // Installed experiences (from ~/.houston/experiences/)
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const installed = await invoke<Array<{ manifest: ExperienceManifest; path: string }>>(
      "list_installed_experiences"
    );
    for (const inst of installed) {
      byId.set(inst.manifest.id, {
        manifest: inst.manifest,
        source: "installed",
        path: inst.path,
        bundleUrl: inst.manifest.tabs.some(t => t.customComponent)
          ? `asset://localhost/${inst.path}/bundle.js`
          : undefined,
      });
    }
  } catch {
    // Tauri not available (dev mode) or command not registered yet
    console.warn("Could not load installed experiences");
  }

  return Array.from(byId.values());
}
