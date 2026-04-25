import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@houston-ai/core";
import { useAgentCatalogStore } from "../../stores/agent-catalog";
import { useAgentStore } from "../../stores/agents";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useUIStore } from "../../stores/ui";
import { tauriChat, tauriStore, tauriConfig } from "../../lib/tauri";
import type { AgentCategory, StoreListing } from "../../lib/types";
import { getDefaultModel } from "../../lib/providers";
import { StoreStep } from "./store-step";
import { NamingStep } from "./naming-step";
import { GithubImportView } from "./github-import-view";

type View = "store" | "github";

export function CreateAgentDialog() {
  const { t } = useTranslation("shell");
  const TABS: { id: View; labelKey: "tabStore" | "tabGithub" }[] = [
    { id: "store", labelKey: "tabStore" },
    { id: "github", labelKey: "tabGithub" },
  ];
  const open = useUIStore((s) => s.createAgentDialogOpen);
  const setOpen = useUIStore((s) => s.setCreateAgentDialogOpen);
  const agentDefs = useAgentCatalogStore((s) => s.agents);
  const storeCatalog = useAgentCatalogStore((s) => s.storeCatalog);
  const installedIds = useAgentCatalogStore((s) => s.installedIds);
  const installAgent = useAgentCatalogStore((s) => s.installAgent);
  const createAgent = useAgentStore((s) => s.create);
  const currentWorkspace = useWorkspaceStore((s) => s.current);

  const [step, setStep] = useState<1 | 2>(1);
  const [view, setView] = useState<View>("store");
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | AgentCategory>("all");
  const [existingPath, setExistingPath] = useState<string | null>(null);
  const wsProvider = currentWorkspace?.provider ?? "anthropic";
  const wsModel = currentWorkspace?.model ?? getDefaultModel(wsProvider);
  const [provider, setProvider] = useState(wsProvider);
  const [model, setModel] = useState(wsModel);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setView("store");
      setSelectedConfigId(null);
      setName("");
      setColor(undefined);
      setError(null);
      setSearch("");
      setCategory("all");
      setExistingPath(null);
      setProvider(wsProvider);
      setModel(wsModel);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !selectedConfigId || !currentWorkspace) return;
    try {
      const { agent, onboardingActivityId } = await createAgent(
        currentWorkspace.id,
        trimmed,
        selectedConfigId,
        color,
        selectedDef?.config.claudeMd,
        selectedDef?.path,
        selectedDef?.config.agentSeeds,
        existingPath ?? undefined,
      );
      // Write provider/model to agent config if different from workspace default
      if (provider !== wsProvider || model !== wsModel) {
        const cfg = await tauriConfig.read(agent.folderPath);
        await tauriConfig.write(agent.folderPath, {
          ...cfg,
          provider: provider as "anthropic" | "openai",
          model,
        });
      }
      if (selectedConfigId === "blank" && onboardingActivityId) {
        tauriChat.startOnboarding(agent.folderPath, `activity-${onboardingActivityId}`);
      }
      const firstTab = selectedDef?.config.defaultTab ?? selectedDef?.config.tabs[0]?.id ?? "chat";
      useUIStore.getState().setViewMode(firstTab);
      handleClose();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleInstall = async (listing: StoreListing) => {
    await installAgent(listing);
  };

  const handleImportFromGithub = async (url: string): Promise<string> => {
    const agentId = await tauriStore.installFromGithub(url);
    await useAgentCatalogStore.getState().loadConfigs();
    // Auto-select the imported agent and go straight to naming
    setSelectedConfigId(agentId);
    setStep(2);
    return agentId;
  };

  const filtered = useMemo(() => {
    let result = agentDefs;
    if (category !== "all") {
      result = result.filter((d) => d.config.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.config.name.toLowerCase().includes(q) ||
          d.config.description.toLowerCase().includes(q) ||
          d.config.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [agentDefs, category, search]);

  const houstonAgents = filtered.filter((d) => d.config.author === "Houston");
  const communityAgents = filtered.filter(
    (d) => d.config.author && d.config.author !== "Houston",
  );
  const selectedDef = agentDefs.find((d) => d.config.id === selectedConfigId);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {step === 1 ? (
          <>
            <DialogHeader className="shrink-0 px-6 pt-6 pb-3">
              <DialogTitle>{t("newAgent.dialogTitle")}</DialogTitle>
              <DialogDescription>
                {t("newAgent.dialogDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="shrink-0 flex gap-1 px-6 pb-3">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full transition-colors",
                    view === tab.id
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {t(`newAgent.${tab.labelKey}`)}
                </button>
              ))}
            </div>

            {view === "store" ? (
              <StoreStep
                search={search}
                onSearchChange={setSearch}
                category={category}
                onCategoryChange={setCategory}
                houstonAgents={houstonAgents}
                communityAgents={communityAgents}
                storeCatalog={storeCatalog}
                installedIds={installedIds}
                hasResults={filtered.length > 0}
                onSelect={(id) => {
                  setSelectedConfigId(id);
                  setStep(2);
                }}
                onInstall={handleInstall}
              />
            ) : (
              <GithubImportView onImport={handleImportFromGithub} />
            )}
          </>
        ) : (
          <NamingStep
            selectedAgent={selectedDef}
            name={name}
            color={color}
            error={error}
            existingPath={existingPath}
            provider={provider}
            model={model}
            showLinkProject={selectedDef?.config.features?.includes("link-project")}
            onNameChange={setName}
            onColorChange={setColor}
            onExistingPathChange={setExistingPath}
            onProviderChange={(p, m) => { setProvider(p); setModel(m); }}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
