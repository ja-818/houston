import { useState, useMemo, type FormEvent } from "react";
import { Dialog, DialogContent } from "@houston-ai/core";
import { useAgentCatalogStore } from "../../stores/agent-catalog";
import { useAgentStore } from "../../stores/agents";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useUIStore } from "../../stores/ui";
import { tauriChat } from "../../lib/tauri";
import type { AgentCategory, StoreListing } from "../../lib/types";
import { StoreStep } from "./store-step";
import { NamingStep } from "./naming-step";

export function CreateAgentDialog() {
  const open = useUIStore((s) => s.createAgentDialogOpen);
  const setOpen = useUIStore((s) => s.setCreateAgentDialogOpen);
  const agentDefs = useAgentCatalogStore((s) => s.agents);
  const storeCatalog = useAgentCatalogStore((s) => s.storeCatalog);
  const installedIds = useAgentCatalogStore((s) => s.installedIds);
  const installAgent = useAgentCatalogStore((s) => s.installAgent);
  const createAgent = useAgentStore((s) => s.create);
  const currentWorkspace = useWorkspaceStore((s) => s.current);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | AgentCategory>("all");

  const reset = () => {
    setStep(1);
    setSelectedConfigId(null);
    setName("");
    setError(null);
    setSearch("");
    setCategory("all");
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !selectedConfigId || !currentWorkspace) return;
    try {
      const agent = await createAgent(currentWorkspace.id, trimmed, selectedConfigId, selectedDef?.config.claudeMd);
      // For blank agents, kick off the onboarding conversation
      if (selectedConfigId === "blank") {
        tauriChat.send(
          agent.folderPath,
          `This is a brand new agent with no configuration yet. Welcome the user and briefly tell them what they can provide to get this agent working:

- A job description - What role do you want me to perform? e.g. SDR, Executive assistant, Customer Support Agent, Engineer.
- Tools and integrations - Need Gmail or Slack? You can ask me connect any tool that has an API or an MCP, and those that don't have one, we'll find a way around.
- Routines (anything to run on a schedule)

Keep it short and warm. End with something like "Or if you'd rather skip setup and jump straight in, just tell me what you need — we can figure it out as we go."

IMPORTANT — Setup validation:
Once the user provides their job description, you MUST write BOTH of these before setup is complete:
1. Update CLAUDE.md at the workspace root with the agent's role, responsibilities, and rules based on what the user described.
2. Create at least one skill file in .agents/skills/ (e.g. .agents/skills/core-workflow.md) with an ## Instructions section covering the agent's primary workflow. Use the skill.sh convention: each skill is a markdown file with ## Instructions and ## Learnings sections.

Do NOT consider setup complete until both CLAUDE.md and at least one skill have been written. If the user skips the description and jumps straight to a task, still write a CLAUDE.md and skill based on what you can infer from the task.`,
          "activity-onboarding",
        );
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
          <NamingStep
            selectedAgent={selectedDef}
            name={name}
            error={error}
            onNameChange={setName}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
