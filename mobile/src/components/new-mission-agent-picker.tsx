import { X } from "lucide-react";
import type { AgentNameEntry } from "@/lib/types";
import { HoustonAvatar } from "./houston-avatar";

interface Props {
  agents: AgentNameEntry[];
  onPick: (agent: AgentNameEntry) => void;
  onClose: () => void;
}

/** Step 1 of the new-mission sheet: agent list. */
export function NewMissionAgentPicker({ agents, onPick, onClose }: Props) {
  return (
    <>
      <header className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-semibold">New mission</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="touchable flex size-9 items-center justify-center rounded-full text-muted-foreground"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Choose an agent
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {agents.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No agents available. Create one on your desktop first.
          </div>
        )}
        {agents.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => onPick(agent)}
            className="touchable flex w-full items-center gap-3 px-4 py-3 text-left active:bg-accent"
          >
            <HoustonAvatar ringSize={40} glyphSize={20} />
            <span className="flex-1 truncate text-sm font-semibold">
              {agent.name}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
