import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
} from "@houston-ai/core";
import { useExperienceStore } from "../../stores/experiences";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useOrganizationStore } from "../../stores/organizations";
import { useUIStore } from "../../stores/ui";

export function CreateWorkspaceDialog() {
  const open = useUIStore((s) => s.createWorkspaceDialogOpen);
  const setOpen = useUIStore((s) => s.setCreateWorkspaceDialogOpen);
  const experiences = useExperienceStore((s) => s.experiences);
  const createWorkspace = useWorkspaceStore((s) => s.create);
  const currentOrg = useOrganizationStore((s) => s.current);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep(1);
    setSelectedExpId(null);
    setName("");
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSelectExperience = (id: string) => {
    setSelectedExpId(id);
    setStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !selectedExpId || !currentOrg) return;
    try {
      await createWorkspace(currentOrg.id, trimmed, selectedExpId);
      handleClose();
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Choose a template" : "Name your AI Workspace"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {experiences.map((exp) => (
              <button
                key={exp.manifest.id}
                onClick={() => handleSelectExperience(exp.manifest.id)}
                className="flex flex-col items-start gap-1.5 rounded-xl border border-border p-4 text-left hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {exp.manifest.name}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-2">
                  {exp.manifest.description}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="AI Workspace name"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={!name.trim()}
                className="rounded-full"
              >
                Create
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
