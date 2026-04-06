import { useState, useMemo, type FormEvent } from "react";
import { Dialog, DialogContent } from "@houston-ai/core";
import { useExperienceStore } from "../../stores/experiences";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useSpaceStore } from "../../stores/spaces";
import { useUIStore } from "../../stores/ui";
import type { ExperienceCategory } from "../../lib/types";
import { MarketplaceStep } from "./marketplace-step";
import { NamingStep } from "./naming-step";

export function CreateWorkspaceDialog() {
  const open = useUIStore((s) => s.createWorkspaceDialogOpen);
  const setOpen = useUIStore((s) => s.setCreateWorkspaceDialogOpen);
  const experiences = useExperienceStore((s) => s.experiences);
  const createWorkspace = useWorkspaceStore((s) => s.create);
  const currentSpace = useSpaceStore((s) => s.current);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | ExperienceCategory>("all");

  const reset = () => {
    setStep(1);
    setSelectedExpId(null);
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
    if (!trimmed || !selectedExpId || !currentSpace) return;
    try {
      await createWorkspace(currentSpace.id, trimmed, selectedExpId);
      handleClose();
    } catch (err) {
      setError(String(err));
    }
  };

  const filtered = useMemo(() => {
    let result = experiences;
    if (category !== "all") {
      result = result.filter((e) => e.manifest.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.manifest.name.toLowerCase().includes(q) ||
          e.manifest.description.toLowerCase().includes(q) ||
          e.manifest.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [experiences, category, search]);

  const houstonExps = filtered.filter((e) => e.manifest.author === "Houston");
  const communityExps = filtered.filter(
    (e) => e.manifest.author && e.manifest.author !== "Houston",
  );
  const selectedExp = experiences.find((e) => e.manifest.id === selectedExpId);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {step === 1 ? (
          <MarketplaceStep
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            houstonExps={houstonExps}
            communityExps={communityExps}
            hasResults={filtered.length > 0}
            onSelect={(id) => {
              setSelectedExpId(id);
              setStep(2);
            }}
          />
        ) : (
          <NamingStep
            selectedExp={selectedExp}
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
