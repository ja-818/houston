import { useState, useEffect } from "react";
import { Button, ConfirmDialog, Spinner } from "@houston-ai/core";
import { Sun, Moon } from "lucide-react";
import { ProviderPicker } from "../shell/provider-picker";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useAgentStore } from "../../stores/agents";
import { useUIStore } from "../../stores/ui";
import { tauriPreferences } from "../../lib/tauri";
import { setTheme, type Theme } from "../../lib/theme";

export function SettingsView() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.current);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrent);
  const updateProvider = useWorkspaceStore((s) => s.updateProvider);
  const renameWorkspace = useWorkspaceStore((s) => s.rename);
  const deleteWorkspace = useWorkspaceStore((s) => s.delete);
  const loadAgents = useAgentStore((s) => s.loadAgents);
  const addToast = useUIStore((s) => s.addToast);

  const [theme, setCurrentTheme] = useState<Theme>("light");
  const [wsName, setWsName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    tauriPreferences.get("theme").then((v) => {
      if (v === "dark") setCurrentTheme("dark");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setWsName(currentWorkspace?.name ?? "");
  }, [currentWorkspace?.name]);

  if (!currentWorkspace) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  const handleRename = async () => {
    const trimmed = wsName.trim();
    if (trimmed && trimmed !== currentWorkspace.name) {
      await renameWorkspace(currentWorkspace.id, trimmed);
      addToast({ title: "Workspace renamed" });
    }
  };

  const handleDelete = async () => {
    const remaining = workspaces.filter((w) => w.id !== currentWorkspace.id);
    await deleteWorkspace(currentWorkspace.id);
    setShowDeleteConfirm(false);
    if (remaining.length > 0) {
      setCurrentWorkspace(remaining[0]);
      await loadAgents(remaining[0].id);
    }
  };

  const handleProviderSelect = async (provider: string, model: string) => {
    await updateProvider(currentWorkspace.id, provider, model);
    const provName = provider === "openai" ? "OpenAI" : "Anthropic";
    addToast({ title: `Switched to ${provName} (${model})` });
  };

  const handleThemeToggle = async (t: Theme) => {
    setCurrentTheme(t);
    await setTheme(t);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-lg px-6 py-8 flex flex-col gap-8">
        <h1 className="text-xl font-semibold">Settings</h1>

        {/* Workspace */}
        <section>
          <h2 className="text-sm font-medium mb-3">Workspace</h2>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Name</label>
            <input
              type="text"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>
        </section>

        {/* AI Provider */}
        <section className="pt-2 border-t border-border">
          <h2 className="text-sm font-medium mb-1">AI provider</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Houston uses <strong className="text-foreground font-medium">your own</strong> subscription. We never see your credentials.
          </p>
          <ProviderPicker
            value={currentWorkspace.provider ?? null}
            model={currentWorkspace.model ?? null}
            onSelect={handleProviderSelect}
          />
        </section>

        {/* Appearance */}
        <section className="pt-2 border-t border-border">
          <h2 className="text-sm font-medium mb-3">Appearance</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleThemeToggle("light")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-colors ${
                theme === "light"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-accent"
              }`}
            >
              <Sun className="size-4" />
              Light
            </button>
            <button
              onClick={() => handleThemeToggle("dark")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-colors ${
                theme === "dark"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-accent"
              }`}
            >
              <Moon className="size-4" />
              Dark
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-2 border-t border-destructive/20">
          <h2 className="text-sm font-medium text-destructive mb-1">Danger zone</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Permanently delete this workspace and all its agents.
          </p>
          <Button
            variant="destructive"
            className="rounded-full"
            disabled={workspaces.length <= 1}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete workspace
          </Button>
          {workspaces.length <= 1 && (
            <p className="text-xs text-muted-foreground mt-2">
              Create another workspace first before deleting this one.
            </p>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={`Delete "${currentWorkspace.name}"?`}
        description="This will permanently delete this workspace and all its agents. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
