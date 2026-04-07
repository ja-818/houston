import { useState, useMemo } from "react";
import { AIBoard } from "@houston-ai/board";
import type { KanbanColumnConfig } from "@houston-ai/board";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  Button,
} from "@houston-ai/core";
import { Plus } from "lucide-react";
import houstonIcon from "../assets/houston-icon.svg";
import { useAgentStore } from "../stores/agents";
import { useUIStore } from "../stores/ui";
import { useMissionControl } from "./use-mission-control";
import { MissionControlNewDialog } from "./mission-control-new-dialog";

const MC_COLUMNS: KanbanColumnConfig[] = [
  { id: "running", label: "Running", statuses: ["running", "queue"] },
  { id: "needs_you", label: "Needs you", statuses: ["needs_you"] },
  { id: "done", label: "Done", statuses: ["done", "cancelled"] },
];

export function Dashboard() {
  const agents = useAgentStore((s) => s.agents);
  const setDialogOpen = useUIStore((s) => s.setCreateAgentDialogOpen);

  const [filterPath, setFilterPath] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  const mc = useMissionControl(agents);

  const filteredItems = useMemo(
    () =>
      filterPath
        ? mc.items.filter(
            (i) => i.metadata?.agentPath === filterPath,
          )
        : mc.items,
    [mc.items, filterPath],
  );

  if (agents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>No Agents yet</EmptyTitle>
            <EmptyDescription>
              Create your first Agent to get started.
            </EmptyDescription>
          </EmptyHeader>
          <Button
            className="mt-4 rounded-full"
            onClick={() => setDialogOpen(true)}
          >
            Create your first Agent
          </Button>
        </Empty>
      </div>
    );
  }

  const emptyBoard = (
    <Empty className="border-0">
      <EmptyHeader>
        <EmptyTitle>No conversations yet</EmptyTitle>
        <EmptyDescription>
          Start a new conversation to delegate work to an agent.
        </EmptyDescription>
      </EmptyHeader>
      <Button
        className="mt-4 rounded-full gap-1.5"
        size="sm"
        onClick={() => setNewDialogOpen(true)}
      >
        <Plus className="size-4" />
        New conversation
      </Button>
    </Empty>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5 shrink-0">
        <h1 className="text-sm font-medium text-foreground">
          Mission Control
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={filterPath}
            onChange={(e) => setFilterPath(e.target.value)}
            className="h-8 rounded-full border border-black/15 bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.folderPath}>
                {a.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            className="rounded-full gap-1.5 h-8"
            onClick={() => setNewDialogOpen(true)}
          >
            <Plus className="size-3.5" />
            New conversation
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0">
        <AIBoard
          items={filteredItems}
          columns={MC_COLUMNS}
          selectedId={mc.selectedId}
          onSelect={mc.setSelectedId}
          feedItems={mc.feedItems}
          isLoading={mc.loading}
          onDelete={mc.handleDelete}
          onApprove={mc.handleApprove}
          onSendMessage={mc.handleSendMessage}
          onLoadHistory={mc.loadHistory}
          emptyState={emptyBoard}
          panelAvatar={
            <span className="size-10 rounded-full ring-1 ring-border flex items-center justify-center shrink-0">
              <img src={houstonIcon} alt="Houston" className="size-6" />
            </span>
          }
          thinkingIndicator={
            <div className="py-2 flex items-center gap-2">
              <img src={houstonIcon} alt="Houston" className="size-6 rounded-full animate-pulse" />
            </div>
          }
        />
      </div>

      <MissionControlNewDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        agents={agents}
        onSubmit={mc.handleCreate}
      />
    </div>
  );
}
