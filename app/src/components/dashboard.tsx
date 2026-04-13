import { useState, useMemo, useCallback } from "react";
import { AIBoard } from "@houston-ai/board";
import type { KanbanColumnConfig } from "@houston-ai/board";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@houston-ai/core";
import { ChevronDown, Plus } from "lucide-react";
import houstonIconWhite from "../assets/houston-icon-white.svg";
import { getHoustonLogo } from "./shell/experience-card";
import { useAgentStore } from "../stores/agents";
import { useUIStore } from "../stores/ui";
import { tauriChat } from "../lib/tauri";
import { useMissionControl } from "./use-mission-control";
import { MissionControlNewDialog } from "./mission-control-new-dialog";
import { useDetailPanelContainer } from "./shell/detail-panel-context";
import { AgentMiniAvatar, HoustonThinkingIndicator } from "./shell/experience-card";

const MC_COLUMNS: KanbanColumnConfig[] = [
  { id: "running", label: "Running", statuses: ["running"] },
  { id: "needs_you", label: "Needs you", statuses: ["needs_you"] },
  { id: "done", label: "Done", statuses: ["done", "cancelled"] },
];

export function Dashboard() {
  const panelContainer = useDetailPanelContainer();
  const agents = useAgentStore((s) => s.agents);
  const setDialogOpen = useUIStore((s) => s.setCreateAgentDialogOpen);
  const setMissionPanelOpen = useUIStore((s) => s.setMissionPanelOpen);

  const [filterPath, setFilterPath] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  const mc = useMissionControl(agents);

  const handleStopSession = useCallback(
    (sessionKey: string) => {
      const activityId = sessionKey.replace("activity-", "");
      const item = mc.items.find((i) => i.id === activityId);
      const agentPath = item?.metadata?.agentPath as string | undefined;
      if (!agentPath) return;
      tauriChat.stop(agentPath, sessionKey).catch(console.error);
    },
    [mc.items],
  );

  // Build agentPath → color lookup from agent instances
  const colorByPath = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const a of agents) {
      map[a.folderPath] = a.color;
    }
    return map;
  }, [agents]);

  const filteredItems = useMemo(() => {
    const base = filterPath
      ? mc.items.filter((i) => i.metadata?.agentPath === filterPath)
      : mc.items;
    return base.map((item) => ({
      ...item,
      icon: <AgentMiniAvatar color={colorByPath[item.metadata?.agentPath as string]} />,
    }));
  }, [mc.items, filterPath, colorByPath]);

  const selectedItem = mc.selectedId
    ? mc.items.find((i) => i.id === mc.selectedId)
    : null;
  const selectedColor = selectedItem
    ? colorByPath[selectedItem.metadata?.agentPath as string]
    : undefined;
  const selectedLogo = getHoustonLogo(selectedColor);

  if (agents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>No agents yet</EmptyTitle>
            <EmptyDescription>
              Build your AI team and ship the impossible.
            </EmptyDescription>
          </EmptyHeader>
          <Button
            className="mt-4 rounded-full"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Agent
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
        <img src={houstonIconWhite} alt="" className="size-4" />
        New mission
      </Button>
    </Empty>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-xl font-semibold text-foreground">
            Mission Control
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full h-8 gap-1.5">
                  {filterPath
                    ? agents.find((a) => a.folderPath === filterPath)?.name ?? "All agents"
                    : "All agents"}
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterPath("")}>
                  All agents
                </DropdownMenuItem>
                {agents.map((a) => (
                  <DropdownMenuItem
                    key={a.id}
                    onClick={() => setFilterPath(a.folderPath)}
                    className="gap-2"
                  >
                    <AgentMiniAvatar color={a.color} />
                    {a.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              className="rounded-full gap-1.5 h-8"
              onClick={() => setNewDialogOpen(true)}
            >
              <img src={houstonIconWhite} alt="" className="size-4" />
              New mission
            </Button>
          </div>
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
          panelContainer={panelContainer}
          onPanelOpenChange={setMissionPanelOpen}
          onStopSession={handleStopSession}
          panelAgentName={selectedItem?.subtitle}
          panelAvatar={
            <span
              className="size-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: selectedColor ?? "#e5e5e5" }}
            >
              <img src={selectedLogo} alt="Houston" className="size-6 object-contain" />
            </span>
          }
          thinkingIndicator={<HoustonThinkingIndicator />}
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
