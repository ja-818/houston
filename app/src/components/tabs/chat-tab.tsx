import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { ChatPanel } from "@houston-ai/chat";
import type { FeedItem } from "@houston-ai/chat";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@houston-ai/core";
import { useFeedStore } from "../../stores/feeds";
import { useUIStore } from "../../stores/ui";
import { useWorkspaceStore } from "../../stores/workspaces";
import { useDraftStore, useDraftText, useDraftFiles } from "../../stores/drafts";
import { tauriChat, tauriAttachments, tauriSystem, tauriConfig, withAttachmentPaths } from "../../lib/tauri";
import { useFileToolRenderer } from "../../hooks/use-file-tool-renderer";
import { useConnectedToolkits, useConnections } from "../../hooks/queries";
import {
  ComposioLinkCard,
  parseComposioToolkitFromHref,
} from "../composio-link-card";
import { analytics } from "../../lib/analytics";
import type { TabProps } from "../../lib/types";
import { HoustonThinkingIndicator } from "../shell/experience-card";
import { ChatModelSelector } from "../chat-model-selector";
import { getDefaultModel } from "../../lib/providers";
import { ProviderReconnectCard } from "../shell/provider-reconnect-card";

export default function ChatTab({ agent }: TabProps) {
  const { isSpecialTool, renderToolResult, renderTurnSummary } = useFileToolRenderer(agent.folderPath);
  // Free-form chat tab gets its own UUID-scoped session key per agent.
  // Must be stable across renders so streaming events land in the same bucket.
  const sessionKey = `chat-${agent.id}`;
  const agentPath = agent.folderPath;
  // Attachments scope: keyed by agent so they survive restarts and are
  // wiped only when the agent is deleted.
  const attachmentScope = `agent-${agent.id}`;
  const feedItems = useFeedStore((s) => s.items[agentPath]?.[sessionKey]);
  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);
  const setFeed = useFeedStore((s) => s.setFeed);
  const clearFeed = useFeedStore((s) => s.clearFeed);
  const addToast = useUIStore((s) => s.addToast);
  const handleNotice = useCallback(
    (message: string) => addToast({ title: message }),
    [addToast],
  );
  const [isLoading, setIsLoading] = useState(false);
  const composerText = useDraftText(sessionKey);
  const composerFiles = useDraftFiles(sessionKey);
  const setComposerText = useCallback(
    (text: string) => useDraftStore.getState().setDraftText(sessionKey, text),
    [sessionKey],
  );
  const setComposerFiles = useCallback(
    (files: File[]) => useDraftStore.getState().setDraftFiles(sessionKey, files),
    [sessionKey],
  );
  const sendingRef = useRef(false);
  const loadedRef = useRef<string | null>(null);

  // --- Model selector: three-tier resolution ---
  // Workspace default → agent config override → chat-level override (ephemeral)
  const workspace = useWorkspaceStore((s) => s.current);
  const wsProvider = workspace?.provider ?? "anthropic";
  const wsModel = workspace?.model ?? getDefaultModel(wsProvider);

  // Agent-level config (loaded once per agent)
  const [agentProvider, setAgentProvider] = useState<string | null>(null);
  const [agentModel, setAgentModel] = useState<string | null>(null);
  useEffect(() => {
    tauriConfig.read(agentPath).then((cfg) => {
      setAgentProvider((cfg.provider as string) ?? null);
      setAgentModel((cfg.model as string) ?? null);
    }).catch(() => {});
  }, [agentPath]);

  // Chat-level override (ephemeral, resets per agent)
  const [chatProvider, setChatProvider] = useState<string | null>(null);
  const [chatModel, setChatModel] = useState<string | null>(null);
  useEffect(() => {
    setChatProvider(null);
    setChatModel(null);
  }, [agent.id]);

  // Effective = chat override > agent config > workspace default
  const effectiveProvider = chatProvider ?? agentProvider ?? wsProvider;
  const effectiveModel = chatModel ?? agentModel ?? wsModel;

  const handleModelSelect = useCallback((prov: string, mod: string) => {
    setChatProvider(prov);
    setChatModel(mod);
  }, []);

  useEffect(() => {
    if (loadedRef.current === agent.id) return;
    loadedRef.current = agent.id;
    clearFeed(agentPath, sessionKey);
    tauriChat.loadHistory(agentPath, sessionKey).then((rows) => {
      if (rows.length > 0) setFeed(agentPath, sessionKey, rows as FeedItem[]);
    });
  }, [agent.id, sessionKey, agentPath, setFeed, clearFeed]);

  const handleStop = useCallback(() => {
    tauriChat.stop(agentPath, sessionKey).catch(console.error);
  }, [agentPath, sessionKey]);

  const handleOpenLink = useCallback((url: string) => {
    tauriSystem.openUrl(url).catch(console.error);
  }, []);

  // Connection state for inline Composio connect cards. Only query
  // when the user is signed in — otherwise the CLI call will fail.
  const { data: composioStatus } = useConnections();
  const isSignedIn = composioStatus?.status === "ok";
  const { data: connectedList } = useConnectedToolkits(isSignedIn);
  const connectedSet = useMemo(
    () => new Set(connectedList ?? []),
    [connectedList],
  );

  // Custom link renderer — intercepts Composio connect URLs tagged
  // with `#houston_toolkit=<slug>` and renders them as rich cards.
  // Returns undefined for non-Composio links so the chat falls back
  // to the default markdown button.
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

  const handleSend = useCallback(
    async (text: string, files: File[]) => {
      if (sendingRef.current) return;
      sendingRef.current = true;
      setIsLoading(true);
      // Visible user message includes the file names so the user sees what
      // they sent; the path block goes into the prompt only.
      const visible = files.length > 0
        ? `${text}${text ? "\n\n" : ""}Attached: ${files.map((f) => f.name).join(", ")}`
        : text;
      pushFeedItem(agentPath, sessionKey, { feed_type: "user_message", data: visible });
      if (!feedItems?.length) {
        analytics.track("session_started", { agent_id: agent.id, agent_name: agent.name });
      }
      analytics.track("chat_message_sent", { agent_id: agent.id });
      // Clear composer immediately so the user sees the send.
      setComposerText("");
      setComposerFiles([]);
      try {
        const paths = await tauriAttachments.save(attachmentScope, files);
        const prompt = withAttachmentPaths(text, paths);
        await tauriChat.send(agentPath, prompt, sessionKey, {
          providerOverride: chatProvider ?? undefined,
          modelOverride: chatModel ?? undefined,
        });
      } catch (err) {
        pushFeedItem(agentPath, sessionKey, {
          feed_type: "system_message",
          data: `Failed to start session: ${err}`,
        });
      } finally {
        setIsLoading(false);
        sendingRef.current = false;
      }
    },
    [agentPath, sessionKey, attachmentScope, pushFeedItem, setComposerText, setComposerFiles, chatProvider, chatModel],
  );

  return (
    <div className="h-full w-full flex flex-col">
      <ChatPanel
        sessionKey={sessionKey}
        feedItems={feedItems ?? []}
        isLoading={isLoading}
        onSend={handleSend}
        onStop={handleStop}
        onOpenLink={handleOpenLink}
        renderLink={renderLink}
        isSpecialTool={isSpecialTool}
        renderToolResult={renderToolResult}
        renderTurnSummary={renderTurnSummary}
        afterMessages={<ProviderReconnectCard />}
        thinkingIndicator={<HoustonThinkingIndicator />}
        placeholder="Ask anything..."
        value={composerText}
        onValueChange={setComposerText}
        attachments={composerFiles}
        onAttachmentsChange={setComposerFiles}
        onNotice={handleNotice}
        footer={
          <ChatModelSelector
            provider={effectiveProvider}
            model={effectiveModel}
            onSelect={handleModelSelect}
            lockedProvider={(feedItems ?? []).length > 0 ? effectiveProvider : null}
          />
        }
        emptyState={
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>Start a conversation</EmptyTitle>
              <EmptyDescription>
                Type a message to talk to your assistant.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />
    </div>
  );
}
