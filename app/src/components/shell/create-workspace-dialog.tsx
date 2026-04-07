import { useState, useMemo, type FormEvent } from "react";
import { Dialog, DialogContent } from "@houston-ai/core";
import { useAgentCatalogStore } from "../../stores/agent-catalog";
import { useAgentStore } from "../../stores/agents";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useUIStore } from "../../stores/ui";
import type { AgentCategory } from "../../lib/types";
import { StoreStep } from "./store-step";
import { NamingStep } from "./naming-step";

export function CreateAgentDialog() {
  const open = useUIStore((s) => s.createAgentDialogOpen);
  const setOpen = useUIStore((s) => s.setCreateAgentDialogOpen);
  const agentDefs = useAgentCatalogStore((s) => s.agents);
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
      await createAgent(currentWorkspace.id, trimmed, selectedConfigId, selectedDef?.config.claudeMd);
      handleClose();
    } catch (err) {
      setError(String(err));
    }
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
            hasResults={filtered.length > 0}
            onSelect={(id) => {
              setSelectedConfigId(id);
              setStep(2);
            }}
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
