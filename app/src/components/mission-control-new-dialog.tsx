import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Textarea,
} from "@houston-ai/core";
import type { Agent } from "../lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Agent[];
  onSubmit: (agentPath: string, text: string) => void;
}

export function MissionControlNewDialog({
  open,
  onOpenChange,
  agents,
  onSubmit,
}: Props) {
  const { t } = useTranslation("dashboard");
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
          <DialogTitle>{t("newMissionDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("newMissionDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mc-agent" className="text-sm font-medium">
              {t("newMissionDialog.agentLabel")}
            </label>
            <select
              id="mc-agent"
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t("newMissionDialog.agentPlaceholder")}</option>
              {agents.map((a) => (
                <option key={a.id} value={a.folderPath}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="mc-prompt" className="text-sm font-medium">
              {t("newMissionDialog.promptLabel")}
            </label>
            <Textarea
              id="mc-prompt"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("newMissionDialog.promptPlaceholder")}
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
            {t("newMissionDialog.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
