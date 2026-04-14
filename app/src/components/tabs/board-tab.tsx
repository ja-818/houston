import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AIBoard } from "@houston-ai/board";
import type { KanbanItem } from "@houston-ai/board";
import type { FeedItem } from "@houston-ai/chat";
import { Terminal, GitBranch } from "lucide-react";

import { useFeedStore } from "../../stores/feeds";
import { useUIStore } from "../../stores/ui";
import { useDraftStore } from "../../stores/drafts";
import {
  useActivity,
  useDeleteActivity,
  useUpdateActivity,
  useCreateActivity,
  useConnectedToolkits,
  useConnections,
} from "../../hooks/queries";
import { tauriActivity, tauriChat, tauriAttachments, tauriSystem, tauriWorktree, tauriShell, tauriTerminal, tauriConfig, tauriPreferences, withAttachmentPaths } from "../../lib/tauri";
import { useFileToolRenderer } from "../../hooks/use-file-tool-renderer";
import {
  ComposioLinkCard,
  parseComposioToolkitFromHref,
} from "../composio-link-card";
import type { TabProps } from "../../lib/types";
import { useDetailPanelContainer } from "../shell/detail-panel-context";
import { HoustonHelmet, HoustonThinkingIndicator } from "../shell/experience-card";
import { resolveAgentColor } from "../../lib/agent-colors";
import { useWorkspaceStore } from "../../stores/workspaces";
import { ChatModelSelector } from "../chat-model-selector";
import { getDefaultModel } from "../../lib/providers";

// Stable empty reference so the feed store selector doesn't return a new
// object every render when this agent has no feeds yet (which would otherwise
// trigger "getSnapshot should be cached" / infinite loop in React).
const EMPTY_FEED_BUCKET: Record<string, never> = Object.freeze({});

function PanelAvatar({ color, isRunning }: { color?: string; isRunning: boolean }) {
  const resolved = resolveAgentColor(color);
  if (isRunning) {
    return (
      <span className="size-10 rounded-full flex items-center justify-center shrink-0 card-running-glow">
        <HoustonHelmet color={resolved} size={24} />
      </span>
    );
  }
  return (
    <span
      className="size-10 rounded-full flex items-center justify-center shrink-0 bg-background border-2"
      style={{ borderColor: resolved }}
    >
      <HoustonHelmet color={resolved} size={24} />
    </span>
  );
}

export default function BoardTab({ agent, agentDef }: TabProps) {
  const panelContainer = useDetailPanelContainer();
  const path = agent.folderPath;
  const agentModes = agentDef.config.agents;
  const [pendingAgentMode, setPendingAgentMode] = useState<string | null>(null);
  const { isSpecialTool, renderToolResult, renderTurnSummary } = useFileToolRenderer(path);
  const { data: rawItems } = useActivity(path);
  const deleteActivity = useDeleteActivity(path);
  const updateActivity = useUpdateActivity(path);
  const createActivity = useCreateActivity(path);
  const setOnStartMission = useUIStore((s) => s.setOnStartMission);
  const setBoardActions = useUIStore((s) => s.setBoardActions);
  const setMissionPanelOpen = useUIStore((s) => s.setMissionPanelOpen);
  const missionPanelOpen = useUIStore((s) => s.missionPanelOpen);
  const addToast = useUIStore((s) => s.addToast);
  const handleNotice = useCallback(
    (message: string) => addToast({ title: message }),
    [addToast],
  );
  const handleOpenLink = useCallback((url: string) => {
    tauriSystem.openUrl(url).catch(console.error);
  }, []);

  // --- Model selector: three-tier resolution ---
  const workspace = useWorkspaceStore((s) => s.current);
  const wsProvider = workspace?.provider ?? "anthropic";
  const wsModel = workspace?.model ?? getDefaultModel(wsProvider);
  const [agentProvider, setAgentProvider] = useState<string | null>(null);
  const [agentModel, setAgentModel] = useState<string | null>(null);
  useEffect(() => {
    tauriConfig.read(path).then((cfg) => {
      setAgentProvider((cfg.provider as string) ?? null);
      setAgentModel((cfg.model as string) ?? null);
    }).catch(() => {});
  }, [path]);
  const [chatProvider, setChatProvider] = useState<string | null>(null);
  const [chatModel, setChatModel] = useState<string | null>(null);
  const effectiveProvider = chatProvider ?? agentProvider ?? wsProvider;
  const effectiveModel = chatModel ?? agentModel ?? wsModel;
  const handleModelSelect = useCallback((prov: string, mod: string) => {
    setChatProvider(prov);
    setChatModel(mod);
  }, []);

  // Connection state for inline Composio connect cards. Mirrors the
  // wiring in chat-tab.tsx — both surfaces read from the same shared
  // TanStack Query cache.
  const { data: composioStatus } = useConnections();
  const isSignedIn = composioStatus?.status === "ok";
  const { data: connectedList } = useConnectedToolkits(isSignedIn);
  const connectedSet = useMemo(
    () => new Set(connectedList ?? []),
    [connectedList],
  );
  const renderLink = useCallback(
    ({ href, onOpen }: { href: string; onOpen: () => void }) => {
      const toolkit = parseComposioToolkitFromHref(href);
      if (!toolkit) return undefined;
      return (
        <ComposioLinkCard
          toolkit={toolkit}
          isConnected={connectedSet.has(toolkit)}
          onOpen={onOpen}
        />
      );
    },
    [connectedSet],
  );
  const openerRef = useRef<(() => void) | null>(null);

  const items: KanbanItem[] = (rawItems ?? []).map((t) => {
    const mode = agentModes?.find((m) => m.id === t.agent);
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      updatedAt: t.updated_at ?? new Date().toISOString(),
      group: agent.name,
      tags: mode ? [mode.name] : (t.routine_id ? ["Routine"] : undefined),
      metadata: {
        ...(t.session_key ? { sessionKey: t.session_key } : {}),
        ...(t.routine_id ? { routineId: t.routine_id } : {}),
        ...(t.agent ? { agent: t.agent } : {}),
        ...(t.worktree_path ? { worktreePath: t.worktree_path } : {}),
      },
    };
  });

  // Read and consume pending selection from Mission Control
  const pendingId = useUIStore((s) => s.activityPanelId);
  const clearPending = useUIStore((s) => s.setActivityPanelId);
  const [selectedId, setSelectedId] = useState<string | null>(pendingId);
  useEffect(() => {
    if (pendingId) {
      // Only navigate if the user isn't already viewing a conversation
      // and hasn't opened the New Mission panel.
      if (!selectedId && !missionPanelOpen) setSelectedId(pendingId);
      clearPending(null);
    }
  }, [pendingId, clearPending, selectedId, missionPanelOpen]);

  // Scope to this agent only — cross-agent bleeding is structurally blocked
  // because AIBoard can only see this agent's slice of the feed store.
  // Return the bucket directly (may be undefined) and fall back to a stable
  // EMPTY_FEED_BUCKET constant below. Selectors must return stable references
  // or React will loop.
  const feedBucket = useFeedStore((s) => s.items[path]);
  const feedItems = feedBucket ?? EMPTY_FEED_BUCKET;
  // Draft persistence — extract text-only map for AIBoard
  const rawDrafts = useDraftStore((s) => s.drafts);
  const boardDrafts = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawDrafts)) {
      if (v.text) out[k] = v.text;
    }
    return out;
  }, [rawDrafts]);
  const handleDraftChange = useCallback(
    (sessionKey: string, text: string) => {
      useDraftStore.getState().setDraftText(sessionKey, text);
    },
    [],
  );
  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);
  const [loadingState, setLoading] = useState<Record<string, boolean>>({});
  // A session is "loading" from the user's perspective whenever its activity
  // is running — not just when WE started it from this component. This catches
  // sessions kicked off elsewhere (onboarding, routines, Mission Control, agent
  // writes) so the ChatPanel shows the Thinking indicator instead of an empty
  // chat while the first streaming event is in flight. Once feed items arrive,
  // ChatPanel's deriveStatus takes over based on feed contents.
  const effectiveLoading = useMemo(() => {
    const out: Record<string, boolean> = { ...loadingState };
    for (const a of rawItems ?? []) {
      if (a.status === "running") {
        const key = a.session_key ?? `activity-${a.id}`;
        out[key] = true;
      }
    }
    return out;
  }, [loadingState, rawItems]);

  // Register the "Start a Mission" handler in the UI store for the TabBar
  const handleOpenerReady = useCallback(
    (opener: () => void) => {
      openerRef.current = opener;
      // Default "New mission" button — always registered
      setOnStartMission(() => {
        if (agentModes?.length) setPendingAgentMode(agentModes[0].id);
        opener();
      });
      // Extra board actions for additional agent modes (skip the first — that's the default button)
      if (agentModes && agentModes.length > 1) {
        setBoardActions(
          agentModes.slice(1).map((mode) => ({
            id: mode.id,
            label: mode.createLabel,
            onClick: () => {
              setPendingAgentMode(mode.id);
              opener();
            },
          })),
        );
      }
    },
    [setOnStartMission, setBoardActions, agentModes],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setOnStartMission(null);
      setBoardActions([]);
    };
  }, [setOnStartMission, setBoardActions]);

  const loadHistory = useCallback(
    async (sessionKey: string) => {
      const history = await tauriChat.loadHistory(path, sessionKey);
      return history as FeedItem[];
    },
    [path],
  );

  const handleDelete = useCallback(
    async (item: KanbanItem) => {
      await deleteActivity.mutateAsync(item.id);
      if (selectedId === item.id) setSelectedId(null);
    },
    [deleteActivity, selectedId],
  );

  const handleApprove = useCallback(
    async (item: KanbanItem) => {
      await updateActivity.mutateAsync({ activityId: item.id, update: { status: "done" } });
    },
    [updateActivity],
  );

  const handleCreateConversation = useCallback(
    async (text: string, files: File[]) => {
      const agentMode = pendingAgentMode ?? agentModes?.[0]?.id;
      const mode = agentModes?.find((m) => m.id === agentMode);
      setPendingAgentMode(null);

      // Check if worktree mode is enabled
      let worktreePath: string | undefined;
      try {
        const cfg = await tauriConfig.read(path);
        if (cfg.worktreeMode) {
          const slug = crypto.randomUUID().slice(0, 8);
          const wt = await tauriWorktree.create(path, slug);
          worktreePath = wt.path;
          // Run install command in the new worktree
          const installCmd = cfg.installCommand as string | undefined;
          if (installCmd && worktreePath) {
            tauriShell.run(worktreePath, installCmd).catch(console.error);
          }
        }
      } catch { /* config may not exist yet */ }

      const title = text.length > 80 ? text.slice(0, 77) + "..." : text;
      const item = await createActivity.mutateAsync({
        title,
        description: text,
        agent: agentMode,
        worktreePath,
      });
      const sessionKey = `activity-${item.id}`;
      const visible = files.length > 0
        ? `${text}${text ? "\n\n" : ""}Attached: ${files.map((f) => f.name).join(", ")}`
        : text;
      pushFeedItem(path, sessionKey, { feed_type: "user_message", data: visible });
      setLoading((prev) => ({ ...prev, [sessionKey]: true }));
      const paths = await tauriAttachments.save(`activity-${item.id}`, files);
      const prompt = withAttachmentPaths(text, paths);
      tauriChat.send(path, prompt, sessionKey, {
        promptFile: mode?.promptFile,
        workingDirOverride: worktreePath,
        providerOverride: chatProvider ?? undefined,
        modelOverride: chatModel ?? undefined,
      });
      return item.id;
    },
    [path, pushFeedItem, createActivity, pendingAgentMode, agentModes, chatProvider, chatModel],
  );

  // Derive the session key for an activity, using custom key if set by routine runner
  const sessionKeyFor = useCallback(
    (activityId: string) => {
      const item = (rawItems ?? []).find((t) => t.id === activityId);
      return item?.session_key ?? `activity-${activityId}`;
    },
    [rawItems],
  );

  const handleStopSession = useCallback(
    (sessionKey: string) => {
      tauriChat.stop(path, sessionKey).catch(console.error);
    },
    [path],
  );

  const handleSendMessage = useCallback(
    async (sessionKey: string, text: string, files: File[]) => {
      const visible = files.length > 0
        ? `${text}${text ? "\n\n" : ""}Attached: ${files.map((f) => f.name).join(", ")}`
        : text;
      pushFeedItem(path, sessionKey, { feed_type: "user_message", data: visible });
      setLoading((prev) => ({ ...prev, [sessionKey]: true }));
      const activity = (rawItems ?? []).find(
        (t) => (t.session_key ?? `activity-${t.id}`) === sessionKey,
      );
      if (activity) {
        tauriActivity.update(path, activity.id, { status: "running" }).catch(console.error);
      }
      const scopeId = activity ? `activity-${activity.id}` : sessionKey;
      const paths = await tauriAttachments.save(scopeId, files);
      const prompt = withAttachmentPaths(text, paths);
      const mode = agentModes?.find((m) => m.id === activity?.agent);
      tauriChat.send(path, prompt, sessionKey, {
        promptFile: mode?.promptFile,
        workingDirOverride: activity?.worktree_path,
        providerOverride: chatProvider ?? undefined,
        modelOverride: chatModel ?? undefined,
      });
    },
    [path, pushFeedItem, rawItems, agentModes, chatProvider, chatModel],
  );

  const handleRunInTerminal = useCallback(
    async (item: KanbanItem) => {
      const wtPath = item.metadata?.worktreePath as string | undefined;
      if (!wtPath) return;
      let devCmd: string | undefined;
      try {
        const cfg = await tauriConfig.read(path);
        devCmd = cfg.devCommand as string | undefined;
      } catch { /* ignore */ }
      const terminal = await tauriPreferences.get("terminal") ?? undefined;
      tauriTerminal.open(wtPath, devCmd, terminal).catch(console.error);
    },
    [path],
  );

  const cardActions = useCallback(
    (item: KanbanItem) => {
      const wtPath = item.metadata?.worktreePath as string | undefined;
      if (!wtPath) return undefined;
      return (
        <button
          onClick={(e) => { e.stopPropagation(); handleRunInTerminal(item); }}
          className="flex items-center gap-0.5 h-5 px-1.5 rounded-full bg-secondary text-foreground text-[10px] font-medium hover:bg-accent transition-colors duration-200"
          title="Open terminal in worktree"
        >
          <Terminal className="size-2.5" />
          Run
        </button>
      );
    },
    [handleRunInTerminal],
  );

  const panelActions = useCallback(
    (item: KanbanItem) => {
      const wtPath = item.metadata?.worktreePath as string | undefined;
      if (!wtPath) return undefined;
      const label = wtPath.split("/").pop() ?? wtPath;
      return (
        <div className="flex items-center gap-1.5">
          <span
            className="flex items-center gap-1 h-5 px-1.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-medium truncate max-w-[160px]"
            title={wtPath}
          >
            <GitBranch className="size-2.5 shrink-0" />
            {label}
          </span>
          <button
            onClick={() => handleRunInTerminal(item)}
            className="flex items-center gap-0.5 h-5 px-1.5 rounded-full bg-secondary text-foreground text-[10px] font-medium hover:bg-accent transition-colors duration-200"
            title="Open terminal in worktree"
          >
            <Terminal className="size-2.5" />
            Run
          </button>
        </div>
      );
    },
    [handleRunInTerminal],
  );

  return (
    <div className="flex flex-col h-full">
    <AIBoard
      items={items}
      selectedId={selectedId}
      onSelect={setSelectedId}
      panelContainer={panelContainer}
      feedItems={feedItems}
      isLoading={effectiveLoading}
      sessionKeyFor={sessionKeyFor}
      onDelete={handleDelete}
      onApprove={handleApprove}
      onRename={(item, newTitle) => {
        tauriActivity.update(path, item.id, { title: newTitle }).catch(console.error);
      }}
      onCreateConversation={handleCreateConversation}
      onSendMessage={handleSendMessage}
      onLoadHistory={loadHistory}
      onNewPanelOpenerReady={handleOpenerReady}
      onPanelOpenChange={setMissionPanelOpen}
      onStopSession={handleStopSession}
      drafts={boardDrafts}
      onDraftChange={handleDraftChange}
      isSpecialTool={isSpecialTool}
      renderToolResult={renderToolResult}
      renderTurnSummary={renderTurnSummary}
      onNotice={handleNotice}
      onOpenLink={handleOpenLink}
      renderLink={renderLink}
      actions={agentModes ? cardActions : undefined}
      panelActions={panelActions}
      cardAvatar={<HoustonHelmet color={resolveAgentColor(agent.color)} size={14} />}
      thinkingIndicator={<HoustonThinkingIndicator />}
      footer={({ hasMessages }) => (
        <ChatModelSelector
          provider={effectiveProvider}
          model={effectiveModel}
          onSelect={handleModelSelect}
          lockedProvider={hasMessages ? effectiveProvider : null}
        />
      )}
      panelAgentName={agent.name}
      panelAvatar={
        <PanelAvatar
          color={agent.color}
          isRunning={(rawItems ?? []).some((a) => a.id === selectedId && a.status === "running")}
        />
      }
    />
    </div>
  );
}
