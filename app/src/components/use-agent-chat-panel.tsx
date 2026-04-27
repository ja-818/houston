/**
 * Per-agent chat panel hook.
 *
 * Centralises every agent-scoped concern that gets spread into AIBoard
 * so the per-agent BoardTab and the cross-agent Mission Control share
 * one implementation. Callers pass an `agent` (the conversation's
 * scope) and the hook returns ready-to-use AIBoard props:
 *
 *   - chatEmptyState      — featured-skill cards + "see more"
 *   - composerOverride    — inline ActionForm when an action is picked
 *   - footer              — model selector + "Actions" button
 *   - renderUserMessage   — decode + render action-invocation card
 *   - tool / link helpers — file tool renderer, Composio link card
 *
 * The hook also owns the action-form submission pipeline (createMission
 * for new conversations, tauriChat.send for follow-ups) so we don't
 * duplicate the encoding + feed-push logic in two places.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@houston-ai/core";
import { Play } from "lucide-react";

import { useFeedStore } from "../stores/feeds";
import { useWorkspaceStore } from "../stores/workspaces";
import {
  useConnectedToolkits,
  useConnections,
  useSkills,
} from "../hooks/queries";
import { tauriChat, tauriConfig, tauriShell, tauriWorktree } from "../lib/tauri";
import { createMission } from "../lib/create-mission";
import { queryKeys } from "../lib/query-keys";
import { useFileToolRenderer } from "../hooks/use-file-tool-renderer";
import {
  ComposioLinkCard,
  parseComposioToolkitFromHref,
} from "./composio-link-card";
import { ChatModelSelector } from "./chat-model-selector";
import { getDefaultModel } from "../lib/providers";
import { analytics } from "../lib/analytics";
import {
  buildActionClaudePrompt,
  decodeActionMessage,
  encodeActionMessage,
} from "../lib/action-message";
import { ActionForm } from "./action-form";
import { SkillCard } from "./skill-card";
import { NewMissionPickerDialog } from "./new-mission-picker-dialog";
import { UserActionMessage } from "./user-action-message";
import { ProviderReconnectCard } from "./shell/provider-reconnect-card";
import { useChatDisplayLabels } from "./use-chat-display-labels";
import {
  filterProviderAuthFeedItems,
  isProviderAuthMessage,
  providerAuthSignalKey,
} from "./tabs/provider-auth-feed";

import type { AIBoardProps } from "@houston-ai/board";
import type { ChatMessage, ChatPanelProps, FeedItem } from "@houston-ai/chat";
import type { Agent, AgentDefinition, SkillSummary } from "../lib/types";

interface UseAgentChatPanelArgs {
  /** The agent the panel is currently scoped to. Null disables features. */
  agent: Agent | null;
  /** That agent's catalog definition (for agentModes etc.). */
  agentDef: AgentDefinition | null;
  /** Currently-open session key, if any. Drives action-form routing. */
  selectedSessionKey: string | null;
  /** Called with the new conversation id after an action's "Start". */
  onSelectSession?: (id: string) => void;
}

interface AgentChatPanelProps {
  /** Renders skill cards + "see more" when no action is in flight. */
  chatEmptyState: AIBoardProps["chatEmptyState"];
  /** Renders the ActionForm in place of the chat input. */
  composerOverride: AIBoardProps["composerOverride"];
  /** Composer footer with model selector + Actions button. */
  footer: AIBoardProps["footer"];
  /** Decodes action-invocation user messages into a card. */
  renderUserMessage: AIBoardProps["renderUserMessage"];
  /** Forwarded to AIBoard / ChatPanel for tool rendering. */
  isSpecialTool: ChatPanelProps["isSpecialTool"];
  renderToolResult: ChatPanelProps["renderToolResult"];
  processLabels: ChatPanelProps["processLabels"];
  getThinkingMessage: ChatPanelProps["getThinkingMessage"];
  renderTurnSummary: ChatPanelProps["renderTurnSummary"];
  renderSystemMessage: AIBoardProps["renderSystemMessage"];
  mapFeedItems: AIBoardProps["mapFeedItems"];
  afterMessages: AIBoardProps["afterMessages"];
  /** Custom Composio inline-link rendering. */
  renderLink: AIBoardProps["renderLink"];
  /** Hidden picker dialog mounted in the consumer. */
  pickerDialog: ReactNode;
  /** Effective provider/model for sending. */
  effectiveProvider: string;
  effectiveModel: string;
  /** Per-chat overrides chosen via the model selector. */
  chatProvider: string | null;
  chatModel: string | null;
}

export function useAgentChatPanel({
  agent,
  agentDef,
  selectedSessionKey,
  onSelectSession,
}: UseAgentChatPanelArgs): AgentChatPanelProps {
  const { t } = useTranslation("board");
  const { processLabels, getThinkingMessage } = useChatDisplayLabels();
  const queryClient = useQueryClient();

  const path = agent?.folderPath ?? null;
  const agentModes = agentDef?.config.agents;

  // ── Workspace / agent / chat tier model resolution ────────────────────
  const workspace = useWorkspaceStore((s) => s.current);
  const wsProvider = workspace?.provider ?? "anthropic";
  const wsModel = workspace?.model ?? getDefaultModel(wsProvider);
  const [agentProvider, setAgentProvider] = useState<string | null>(null);
  const [agentModel, setAgentModel] = useState<string | null>(null);
  useEffect(() => {
    if (!path) {
      setAgentProvider(null);
      setAgentModel(null);
      return;
    }
    tauriConfig
      .read(path)
      .then((cfg) => {
        setAgentProvider((cfg.provider as string) ?? null);
        setAgentModel((cfg.model as string) ?? null);
      })
      .catch(() => {});
  }, [path]);
  const [chatProvider, setChatProvider] = useState<string | null>(null);
  const [chatModel, setChatModel] = useState<string | null>(null);
  // Reset per-chat overrides when the agent changes; the previous agent's
  // model choice doesn't make sense for a different agent.
  useEffect(() => {
    setChatProvider(null);
    setChatModel(null);
  }, [path]);
  const effectiveProvider = chatProvider ?? agentProvider ?? wsProvider;
  const effectiveModel = chatModel ?? agentModel ?? wsModel;
  const handleModelSelect = useCallback((prov: string, mod: string) => {
    setChatProvider(prov);
    setChatModel(mod);
  }, []);

  // ── Composio link card support ────────────────────────────────────────
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

  // ── File-tool rendering (per-agent path) ──────────────────────────────
  const { isSpecialTool, renderToolResult, renderTurnSummary } =
    useFileToolRenderer(path ?? "");

  // ── Skills + action-form state ────────────────────────────────────────
  const { data: allSkills } = useSkills(path ?? undefined);
  const emptySkillShowcase = useMemo(() => {
    const skills = allSkills ?? [];
    const featured = skills.filter((s) => s.featured);
    return (featured.length > 0 ? featured : skills).slice(0, 3);
  }, [allSkills]);
  const moreActionsCount = Math.max(
    0,
    (allSkills?.length ?? 0) - emptySkillShowcase.length,
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<SkillSummary | null>(null);
  // Drop in-flight form when the agent / session changes so it doesn't
  // leak across contexts.
  useEffect(() => {
    setActiveAction(null);
  }, [path, selectedSessionKey]);

  const onSelectSessionRef = useRef(onSelectSession);
  useEffect(() => {
    onSelectSessionRef.current = onSelectSession;
  }, [onSelectSession]);

  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);

  // "Start" inside the inline ActionForm. We split user-display from
  // Claude-prompt: both share the same persisted body (an HTML-comment
  // marker the renderer parses + the explicit instruction Claude reads).
  const handleActionFormSubmit = useCallback(
    async (values: Record<string, string>) => {
      const skill = activeAction;
      setActiveAction(null);
      if (!skill || !agent || !path) return;

      const claudePrompt = buildActionClaudePrompt(skill, values);
      const encoded = encodeActionMessage(skill, values, claudePrompt);
      const friendlyTitle = humanize(skill.name);

      if (selectedSessionKey) {
        // Mid-conversation: optimistic feed push + send, mirrors the
        // text-send pipeline.
        pushFeedItem(path, selectedSessionKey, {
          feed_type: "user_message",
          data: encoded,
        });
        const mode = agentModes?.find((m) => m.id === undefined); // default mode
        tauriChat.send(path, encoded, selectedSessionKey, {
          mode: mode?.promptFile,
          providerOverride: chatProvider ?? undefined,
          modelOverride: chatModel ?? undefined,
        });
      } else {
        // New conversation: createMission with `title` override so the
        // kanban card reads "Research a company" instead of the marker.
        const agentMode = agentModes?.[0]?.id;
        const mode = agentModes?.find((m) => m.id === agentMode);

        // Honour worktree mode if the agent's config opts in. Same
        // bootstrap as BoardTab's text-send path.
        let worktreePath: string | undefined;
        try {
          const cfg = await tauriConfig.read(path);
          if (cfg.worktreeMode) {
            const slug = crypto.randomUUID().slice(0, 8);
            const wt = await tauriWorktree.create(path, slug);
            worktreePath = wt.path;
            const installCmd = cfg.installCommand as string | undefined;
            if (installCmd && worktreePath) {
              tauriShell.run(worktreePath, installCmd).catch(console.error);
            }
          }
        } catch {
          /* config may not exist yet */
        }

        const { conversationId, sessionKey } = await createMission(
          {
            id: agent.id,
            name: agent.name,
            color: agent.color,
            folderPath: path,
          },
          encoded,
          {
            agentMode,
            worktreePath,
            promptFile: mode?.promptFile,
            providerOverride: chatProvider ?? undefined,
            modelOverride: chatModel ?? undefined,
            buildPrompt: () => encoded,
            title: friendlyTitle,
          },
        );
        pushFeedItem(path, sessionKey, {
          feed_type: "user_message",
          data: encoded,
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.activity(path) });
        analytics.track("mission_created", {
          agent_id: agent.id,
          agent_mode: agentMode ?? "default",
        });
        onSelectSessionRef.current?.(conversationId);
      }
    },
    [
      activeAction,
      agent,
      path,
      selectedSessionKey,
      agentModes,
      chatProvider,
      chatModel,
      pushFeedItem,
      queryClient,
    ],
  );

  // Picking a skill from a card or the picker. Drops user into the
  // action-form (no inputs → confirm; with inputs → labeled fields).
  const applyAction = useCallback(
    (skill: SkillSummary) => setActiveAction(skill),
    [],
  );

  // ── Built JSX bundles ─────────────────────────────────────────────────
  const renderUserMessage = useCallback(
    (msg: { content: string }) => {
      const invocation = decodeActionMessage(msg.content);
      if (!invocation) return undefined;
      return <UserActionMessage invocation={invocation} />;
    },
    [],
  );
  const renderSystemMessage = useCallback(
    (msg: ChatMessage) => {
      if (isProviderAuthMessage(msg.content)) return null;
      return undefined;
    },
    [],
  );
  const mapFeedItems = useCallback(
    ({ items }: { sessionKey: string; items: FeedItem[] }) =>
      filterProviderAuthFeedItems(items),
    [],
  );
  const afterMessages = useCallback(
    ({ feedItems }: { sessionKey: string; feedItems: FeedItem[] }) => {
      const signalKey = providerAuthSignalKey(feedItems);
      return (
        <ProviderReconnectCard
          providerId={signalKey ? effectiveProvider : undefined}
          signalKey={signalKey ?? undefined}
        />
      );
    },
    [effectiveProvider],
  );

  const composerOverride = useMemo<AIBoardProps["composerOverride"]>(() => {
    if (!agent || !activeAction) return undefined;
    return (
      <ActionForm
        skill={activeAction}
        onSubmit={handleActionFormSubmit}
        onCancel={() => setActiveAction(null)}
      />
    );
  }, [agent, activeAction, handleActionFormSubmit]);

  const chatEmptyState = useMemo<AIBoardProps["chatEmptyState"]>(() => {
    if (!agent) return undefined;
    if (activeAction) return null;
    if (emptySkillShowcase.length === 0) return undefined;
    return (
      <div className="self-stretch w-full h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-6 pt-6 pb-4 flex flex-col gap-3">
          <div className="text-center mb-1">
            <h3 className="text-base font-semibold text-foreground">
              {t("chatEmpty.heading")}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("chatEmpty.subheading")}
            </p>
          </div>
          {emptySkillShowcase.map((s) => (
            <SkillCard
              key={s.name}
              image={s.image}
              title={humanize(s.name)}
              description={s.description}
              integrations={s.integrations}
              onClick={() => applyAction(s)}
            />
          ))}
          {moreActionsCount > 0 && (
            <Button
              size="sm"
              className="self-center mt-1 rounded-full gap-1.5"
              onClick={() => setPickerOpen(true)}
            >
              <Play className="size-3 fill-current" />
              {t("chatEmpty.seeMore", { count: moreActionsCount })}
            </Button>
          )}
        </div>
      </div>
    );
  }, [agent, activeAction, emptySkillShowcase, moreActionsCount, t, applyAction]);

  const footer = useMemo<AIBoardProps["footer"]>(() => {
    if (!agent) return undefined;
    return ({ hasMessages }) => (
      <div className="flex items-center gap-2 w-full">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          data-keep-panel-open
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Play className="size-3 fill-current" />
          {t("composerAction.browse")}
        </button>
        <ChatModelSelector
          provider={effectiveProvider}
          model={effectiveModel}
          onSelect={handleModelSelect}
          lockedProvider={hasMessages ? effectiveProvider : null}
        />
      </div>
    );
  }, [agent, t, effectiveProvider, effectiveModel, handleModelSelect]);

  const pickerDialog = agent ? (
    <NewMissionPickerDialog
      open={pickerOpen}
      onOpenChange={setPickerOpen}
      lockedAgent={agent}
      hideBlank
      onSkill={(_agentPath, skillName) => {
        const skill = (allSkills ?? []).find((s) => s.name === skillName);
        if (skill) applyAction(skill);
      }}
    />
  ) : null;

  return {
    chatEmptyState,
    composerOverride,
    footer,
    renderUserMessage,
    isSpecialTool,
    renderToolResult,
    processLabels,
    getThinkingMessage,
    renderTurnSummary,
    renderSystemMessage,
    mapFeedItems,
    afterMessages,
    renderLink,
    pickerDialog,
    effectiveProvider,
    effectiveModel,
    chatProvider,
    chatModel,
  };
}

function humanize(slug: string): string {
  const spaced = slug.replace(/[-_]+/g, " ").trim();
  return spaced.length === 0
    ? slug
    : spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
