import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@houston-ai/core";
import { HoustonHelmet } from "./shell/experience-card";
import { resolveAgentColor } from "../lib/agent-colors";
import type { Agent } from "../lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Agent[];
  onPick: (agent: Agent) => void;
}

/**
 * Modal that asks "which agent should run this mission?" and renders one
 * card per agent. Picking an agent switches the app to that agent's board
 * view and opens the new-mission right panel — the same flow you get from
 * the per-agent New Mission button. See the dashboard wiring for that
 * sequencing (it lives there because it depends on view-mode state).
 */
export function AgentPickerDialog({ open, onOpenChange, agents, onPick }: Props) {
  const { t } = useTranslation("dashboard");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-3">
          <DialogTitle>{t("agentPicker.title")}</DialogTitle>
          <DialogDescription>{t("agentPicker.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          <div className="flex flex-col gap-2">
            {agents.map((a) => {
              const color = resolveAgentColor(a.color);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    onPick(a);
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-4 rounded-2xl bg-secondary p-4 text-left transition-colors duration-200 hover:bg-accent w-full"
                >
                  <span
                    className="size-12 rounded-full flex items-center justify-center shrink-0 bg-background border-2"
                    style={{ borderColor: color }}
                  >
                    <HoustonHelmet color={color} size={26} />
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {a.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
