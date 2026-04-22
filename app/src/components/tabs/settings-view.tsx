import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  ConfirmDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from "@houston-ai/core";
import { Sun, Moon } from "lucide-react";
import { ProviderPicker } from "../shell/provider-picker";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useAgentStore } from "../../stores/agents";
import { useUIStore } from "../../stores/ui";
import { tauriPreferences } from "../../lib/tauri";
import { setTheme, type Theme } from "../../lib/theme";
import {
  useTimezonePreference,
  detectTimezone,
} from "../../hooks/use-timezone-preference";
import {
  changeLocale,
  isSupported,
  LOCALE_PREF_KEY,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../../lib/i18n";

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};

export function SettingsView() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.current);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrent);
  const updateProvider = useWorkspaceStore((s) => s.updateProvider);
  const renameWorkspace = useWorkspaceStore((s) => s.rename);
  const deleteWorkspace = useWorkspaceStore((s) => s.delete);
  const loadAgents = useAgentStore((s) => s.loadAgents);
  const addToast = useUIStore((s) => s.addToast);

  const { t, i18n } = useTranslation("common");
  const [theme, setCurrentTheme] = useState<Theme>("light");
  const [wsName, setWsName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const currentLocale: SupportedLocale = isSupported(i18n.resolvedLanguage)
    ? (i18n.resolvedLanguage as SupportedLocale)
    : "en";

  const tz = useTimezonePreference();
  const [tzDraft, setTzDraft] = useState("");
  useEffect(() => {
    setTzDraft(tz.timezone ?? "");
  }, [tz.timezone]);

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

  const handleThemeToggle = async (value: Theme) => {
    setCurrentTheme(value);
    await setTheme(value);
  };

  const handleLocaleChange = async (value: string) => {
    if (!isSupported(value)) return;
    await changeLocale(value);
    await tauriPreferences.set(LOCALE_PREF_KEY, value);
    addToast({ title: t("language.toastChanged") });
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

        {/* Timezone */}
        <section className="pt-2 border-t border-border">
          <h2 className="text-sm font-medium mb-1">Timezone</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Used when your routines fire — 9am means 9am in this zone.
          </p>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              IANA zone
            </label>
            <input
              type="text"
              value={tzDraft}
              onChange={(e) => setTzDraft(e.target.value)}
              onBlur={async () => {
                const trimmed = tzDraft.trim();
                if (!trimmed || trimmed === tz.timezone) return;
                await tz.confirm(trimmed);
                addToast({ title: `Timezone set to ${trimmed}` });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              placeholder="e.g. America/Bogota"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring transition-all"
            />
            <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
              <button
                onClick={async () => {
                  const d = detectTimezone();
                  setTzDraft(d);
                  await tz.confirm(d);
                  addToast({ title: `Timezone set to ${d}` });
                }}
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Use detected ({tz.detected})
              </button>
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="pt-2 border-t border-border">
          <h2 className="text-sm font-medium mb-1">{t("language.title")}</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {t("language.description")}
          </p>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              {t("language.label")}
            </label>
            <Select value={currentLocale} onValueChange={handleLocaleChange}>
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LOCALES.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {LOCALE_LABELS[loc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
