import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Textarea,
} from "@houston-ai/core";
import type { Workspace } from "../lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaces: Workspace[];
  onSubmit: (workspacePath: string, text: string) => void;
}

export function MissionControlNewDialog({
  open,
  onOpenChange,
  workspaces,
  onSubmit,
}: Props) {
  const [selectedPath, setSelectedPath] = useState("");
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!selectedPath || !text.trim()) return;
    onSubmit(selectedPath, text.trim());
    setSelectedPath("");
    setText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>
            Pick a workspace and describe what the agent should do.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mc-workspace" className="text-sm font-medium">
              Workspace
            </label>
            <select
              id="mc-workspace"
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a workspace…</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.folderPath}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="mc-prompt" className="text-sm font-medium">
              Prompt
            </label>
            <Textarea
              id="mc-prompt"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What should the agent work on?"
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) handleSubmit();
              }}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!selectedPath || !text.trim()}
            className="rounded-full self-end"
          >
            Start conversation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
