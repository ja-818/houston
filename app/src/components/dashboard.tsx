import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { HoustonHelmet } from "./shell/experience-card";
import { resolveAgentColor } from "../lib/agent-colors";
import { useAgentStore } from "../stores/agents";
import { useAgentCatalogStore } from "../stores/agent-catalog";
import { useUIStore } from "../stores/ui";
import { tauriChat } from "../lib/tauri";
import { useMissionControl } from "./use-mission-control";
import { useSessionMessageQueue } from "../hooks/use-session-message-queue";
import { AgentPickerDialog } from "./agent-picker-dialog";
import { useAgentChatPanel } from "./use-agent-chat-panel";
import { useQueuedMessageLabels } from "./use-queued-message-labels";
import type { Agent } from "../lib/types";
import { useDetailPanelContainer } from "./shell/detail-panel-context";
import { AgentMiniAvatar, HoustonThinkingIndicator } from "./shell/experience-card";
import { MissionControlToolbar } from "./mission-control-toolbar";
import { MissionBoardEmptyState } from "./mission-board-empty-state";
import { useMissionSearch } from "./use-mission-search";

export function Dashboard() {
  const { t } = useTranslation(["dashboard", "board", "common"]);
  const queuedLabels = useQueuedMessageLabels();
  const MC_COLUMNS: KanbanColumnConfig[] = [
    { id: "running", label: t("dashboard:columns.running"), statuses: ["running"] },
    { id: "needs_you", label: t("dashboard:columns.needsYou"), statuses: ["needs_you"] },
    { id: "done", label: t("dashboard:columns.done"), statuses: ["done", "cancelled"] },
  ];
  // Card-action tooltips (Approve / Rename / Delete) — shared with the
  // per-agent board tab so the affordance reads the same everywhere.
  const cardLabels = {
    approve: t("board:cardActions.approve"),
    approveTooltip: t("board:cardActions.approveTooltip"),
    renameTooltip: t("board:cardActions.renameTooltip"),
    deleteTooltip: t("board:cardActions.deleteTooltip"),
    deleteTitle: (name: string) => t("board:deleteCard.titleWithName", { name }),
    deleteDescription: t("board:deleteCard.description"),
  };
  const panelContainer = useDetailPanelContainer();
  const agents = useAgentStore((s) => s.agents);
  const getAgentDef = useAgentCatalogStore((s) => s.getById);
  const setDialogOpen = useUIStore((s) => s.setCreateAgentDialogOpen);
  const setMissionPanelOpen = useUIStore((s) => s.setMissionPanelOpen);
  const missionPanelOpen = useUIStore((s) => s.missionPanelOpen);
  const addToast = useUIStore((s) => s.addToast);

  const [filterPath, setFilterPath] = useState("");
  const [missionSearchQuery, setMissionSearchQuery] = useState("");
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [newPanelOpenerReady, setNewPanelOpenerReady] = useState(false);
  // Agent the user just picked for "New Mission". Stays in scope until
  // the new conversation is created (and selectedItem takes over) or
  // the user clicks a different card.
  const [pendingAgent, setPendingAgent] = useState<Agent | null>(null);
  const openerRef = useRef<(() => void) | null>(null);
  const emptyAutoOpenKeyRef = useRef<string | null>(null);

  const mc = useMissionControl(agents);
  const setMissionControlSelectedId = mc.setSelectedId;

  // Picking an agent from the "New mission" modal stays on Mission
  // Control: we set the pending agent so the right panel scopes its
  // actions/model/etc. to that agent, then ask AIBoard to open the
  // empty new-conversation panel.
  const handlePickAgent = useCallback((agent: Agent) => {
    setPendingAgent(agent);
    setMissionControlSelectedId(null);
    openerRef.current?.();
  }, [setMissionControlSelectedId]);

  const handleOpenerReady = useCallback((opener: () => void) => {
    openerRef.current = opener;
    setNewPanelOpenerReady(true);
  }, []);

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

  const agentFilteredItems = useMemo(() => {
    const base = filterPath
      ? mc.items.filter((i) => i.metadata?.agentPath === filterPath)
      : mc.items;
    return base.map((item) => ({
      ...item,
      icon: <AgentMiniAvatar color={colorByPath[item.metadata?.agentPath as string]} />,
    }));
  }, [mc.items, filterPath, colorByPath]);
  const visibleAgents = useMemo(
    () => (filterPath ? agents.filter((a) => a.folderPath === filterPath) : agents),
    [agents, filterPath],
  );
  const handleMissionSearchError = useCallback(() => {
    addToast({
      title: t("dashboard:search.historyErrorTitle"),
      description: t("dashboard:search.historyErrorDescription"),
      variant: "error",
    });
  }, [addToast, t]);
  const missionSearch = useMissionSearch({
    items: agentFilteredItems,
    query: missionSearchQuery,
    loadHistory: mc.loadHistory,
    onHistoryLoadError: handleMissionSearchError,
  });

  useEffect(() => {
    if (!mc.isLoaded) return;
    if (missionSearch.hasQuery) return;
    const emptyKey = filterPath || "all";
    if (agentFilteredItems.length > 0) {
      if (emptyAutoOpenKeyRef.current === emptyKey) emptyAutoOpenKeyRef.current = null;
      return;
    }
    if (!newPanelOpenerReady || missionPanelOpen || agentPickerOpen) return;
    if (emptyAutoOpenKeyRef.current === emptyKey) return;
    emptyAutoOpenKeyRef.current = emptyKey;
    if (visibleAgents.length === 1) {
      handlePickAgent(visibleAgents[0]);
    } else if (visibleAgents.length > 1) {
      setAgentPickerOpen(true);
    }
  }, [
    agentPickerOpen,
    filterPath,
    agentFilteredItems.length,
    handlePickAgent,
    mc.isLoaded,
    missionSearch.hasQuery,
    missionPanelOpen,
    newPanelOpenerReady,
    visibleAgents,
  ]);

  const selectedItem = mc.selectedId
    ? mc.items.find((i) => i.id === mc.selectedId)
    : null;

  // The agent currently scoping the right panel: either the agent the
  // selected card belongs to, or the agent the user picked for a new
  // mission. Drives the per-agent composer features (skills, action
  // selected Action, model selector) provided by `useAgentChatPanel`.
  const activeAgent = useMemo<Agent | null>(() => {
    if (selectedItem) {
      const path = selectedItem.metadata?.agentPath as string | undefined;
      return agents.find((a) => a.folderPath === path) ?? null;
    }
    return pendingAgent;
  }, [selectedItem, pendingAgent, agents]);
  // Panel avatar color tracks the active agent so a new-mission card
  // for picked agent A uses A's color, not the selectedItem fallback.
  const selectedColor = resolveAgentColor(activeAgent?.color);
  const activeAgentDef = activeAgent ? getAgentDef(activeAgent.configId) ?? null : null;
  const selectedSessionKey = selectedItem
    ? (selectedItem.metadata?.sessionKey as string | undefined) ?? `activity-${selectedItem.id}`
    : null;
  const onActionCreated = useCallback(
    (id: string) => mc.setSelectedId(id),
    [mc],
  );
  const panel = useAgentChatPanel({
    agent: activeAgent,
    agentDef: activeAgentDef,
    selectedSessionKey,
    onSelectSession: onActionCreated,
  });
  const selectedAgentPath = selectedItem?.metadata?.agentPath as string | undefined;
  const selectedSessionActive = selectedSessionKey
    ? (mc.loading[selectedSessionKey] ?? false)
    : false;
  const sendSelectedNow = useCallback(
    async (text: string, files: File[]) => {
      if (!selectedSessionKey) return;
      await mc.handleSendMessage(selectedSessionKey, text, files);
    },
    [mc.handleSendMessage, selectedSessionKey],
  );
  const messageQueue = useSessionMessageQueue({
    agentPath: selectedAgentPath ?? null,
    sessionKey: selectedSessionKey,
    isActive: selectedSessionActive,
    sendNow: sendSelectedNow,
  });
  const handleSendMessage = useCallback(
    async (sessionKey: string, text: string, files: File[]) => {
      if (sessionKey === selectedSessionKey) {
        await messageQueue.sendOrQueue(text, files);
        return;
      }
      await mc.handleSendMessage(sessionKey, text, files);
    },
    [mc.handleSendMessage, selectedSessionKey, messageQueue.sendOrQueue],
  );
  const handleComposerSubmit = useCallback<NonNullable<typeof panel.onComposerSubmit>>(
    async (ctx) => {
      if (ctx.sessionKey && ctx.sessionKey === selectedSessionKey && selectedSessionActive) {
        messageQueue.queueMessage(ctx.text, ctx.files);
        return true;
      }
      return (await panel.onComposerSubmit?.(ctx)) ?? false;
    },
    [selectedSessionKey, selectedSessionActive, messageQueue.queueMessage, panel.onComposerSubmit],
  );
  const queuedMessages = useMemo(
    () => selectedSessionKey ? { [selectedSessionKey]: messageQueue.queuedMessages } : {},
    [selectedSessionKey, messageQueue.queuedMessages],
  );

  if (agents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>{t("dashboard:noAgents.title")}</EmptyTitle>
            <EmptyDescription>
              {t("dashboard:noAgents.description")}
            </EmptyDescription>
          </EmptyHeader>
          <Button
            className="mt-4 rounded-full"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t("dashboard:noAgents.cta")}
          </Button>
        </Empty>
      </div>
    );
  }

  const emptyBoard = (
    <MissionBoardEmptyState
      isSearch={missionSearch.hasQuery}
      isSearchingText={missionSearch.isSearchingText}
      labels={{
        emptyTitle: t("dashboard:empty.boardTitle"),
        emptyDescription: t("dashboard:empty.boardDescription"),
        newMission: t("dashboard:empty.newMission"),
        searchEmptyTitle: t("dashboard:search.emptyTitle"),
        searchEmptyDescription: t("dashboard:search.emptyDescription"),
        searchSearchingTitle: t("dashboard:search.searchingTitle"),
        searchSearchingDescription: t("dashboard:search.searchingDescription"),
        clearSearch: t("dashboard:search.clearCta"),
      }}
      onNewMission={() => setAgentPickerOpen(true)}
      onClearSearch={() => setMissionSearchQuery("")}
    />
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <MissionControlToolbar
        agents={agents}
        filterPath={filterPath}
        search={missionSearchQuery}
        isSearchingText={missionSearch.isSearchingText}
        onFilterPathChange={setFilterPath}
        onSearchChange={setMissionSearchQuery}
        onNewMission={() => setAgentPickerOpen(true)}
      />

      {/* Board */}
      <div className="flex-1 min-h-0">
        <AIBoard
          items={missionSearch.items}
          columns={MC_COLUMNS}
          selectedId={mc.selectedId}
          onSelect={mc.setSelectedId}
          feedItems={mc.feedItems}
          isLoading={mc.loading}
          onDelete={mc.handleDelete}
          onApprove={mc.handleApprove}
          onRename={mc.handleRename}
          onSendMessage={handleSendMessage}
          queuedMessages={queuedMessages}
          onRemoveQueuedMessage={(_, id) => messageQueue.removeQueuedMessage(id)}
          queuedLabels={queuedLabels}
          onLoadHistory={mc.loadHistory}
          onHistoryLoaded={mc.handleHistoryLoaded}
          onNewPanelOpenerReady={handleOpenerReady}
          emptyState={emptyBoard}
          panelContainer={panelContainer}
          onPanelOpenChange={setMissionPanelOpen}
          onStopSession={handleStopSession}
          panelAgentName={activeAgent?.name ?? selectedItem?.subtitle}
          panelAvatar={
            selectedItem?.status === "running" ? (
              <span className="size-10 rounded-full flex items-center justify-center shrink-0 card-running-glow">
                <HoustonHelmet color={selectedColor} size={24} />
              </span>
            ) : (
              <span
                className="size-10 rounded-full flex items-center justify-center shrink-0 bg-background border-2"
                style={{ borderColor: selectedColor ?? "#cdcdcd" }}
              >
                <HoustonHelmet color={selectedColor} size={24} />
              </span>
            )
          }
          thinkingIndicator={<HoustonThinkingIndicator />}
          cardLabels={cardLabels}
          // Per-agent panel features pulled from the shared hook so
          // Mission Control's right panel matches the BoardTab right
          // panel exactly. Active when `activeAgent` is set (a card is
          // selected OR the user just picked an agent for new mission).
          chatEmptyState={panel.chatEmptyState}
          composerHeader={panel.composerHeader}
          canSendEmpty={panel.canSendEmpty}
          onComposerSubmit={handleComposerSubmit}
          footer={panel.footer}
          renderUserMessage={panel.renderUserMessage}
          renderSystemMessage={panel.renderSystemMessage}
          mapFeedItems={panel.mapFeedItems}
          afterMessages={panel.afterMessages}
          isSpecialTool={panel.isSpecialTool}
          renderToolResult={panel.renderToolResult}
          processLabels={panel.processLabels}
          getThinkingMessage={panel.getThinkingMessage}
          renderTurnSummary={panel.renderTurnSummary}
          renderLink={panel.renderLink}
        />
      </div>

      {panel.pickerDialog}

      <AgentPickerDialog
        open={agentPickerOpen}
        onOpenChange={setAgentPickerOpen}
        agents={agents}
        onPick={handlePickAgent}
      />
    </div>
  );
}
