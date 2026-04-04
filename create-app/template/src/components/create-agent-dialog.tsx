import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Input } from "@deck-ui/core";
import { useAgentStore } from "../stores/agents";

interface CreateAgentDialogProps {
  onClose: () => void;
}

export function CreateAgentDialog({ onClose }: CreateAgentDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createAgent = useAgentStore((s) => s.createAgent);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createAgent(trimmed);
      onClose();
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create agent</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Agent name"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
