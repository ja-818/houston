// Chat view — live session against the engine over the tunnel.
//
// The outer container is pinned to the visual viewport (height +
// offsetTop) so iOS Safari's URL bar + keyboard don't shift the
// header off screen. Header sticks to the top, composer to the
// bottom, messages scroll between them.

import { useCallback, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ChatPanel, decodeActionMessage, type FeedItem } from "@houston-ai/chat";
import { HoustonAvatar } from "@houston-ai/core";
import type { Agent, ConversationEntry } from "@houston-ai/engine-client";
import {
  useChatHistory,
  useCreateMission,
  useSendMessage,
} from "../hooks/use-chat";
import {
  useAllConversations,
  useCurrentWorkspace,
} from "../hooks/use-conversations";
import { useAgents } from "../hooks/use-agents";
import { useVisualViewport } from "../hooks/use-keyboard-height";
import { UserActionMessage } from "./user-action-message";

export function ChatView() {
  const nav = useNavigate();
  const { sessionKey } = useParams<{ sessionKey: string }>();
  const [params] = useSearchParams();
  const agentPath = params.get("agent") ?? "";

  // Draft mode: NewMissionSheet hands us a `draft-<uuid>` key so the
  // composer is available without an activity existing on the engine
  // yet. The activity (and therefore the desktop board row) is only
  // created on the first real send. Bail before sending = no server
  // state, no orphan.
  const isDraft = sessionKey?.startsWith("draft-") ?? false;
  // When draft, skip history fetch + per-session WS subscribe.
  const querySessionKey = isDraft ? null : sessionKey ?? null;

  const ws = useCurrentWorkspace();
  const { data: agents } = useAgents(ws?.id ?? null);
  const { data: conversations } = useAllConversations();
  const convo = conversations?.find((c) => c.session_key === sessionKey);
  const agent = agents?.find((a) => a.folderPath === agentPath);

  // Single source of truth for "agent is working": server activity
  // status. Optimistic client flags would linger past completion.
  const isRunning = convo?.status === "running";

  const sendMutation = useSendMessage(agentPath, querySessionKey ?? "");
  const createMission = useCreateMission(agentPath);
  const { data: history } = useChatHistory(agentPath, querySessionKey, {
    isActive: isRunning,
  });

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!isDraft) {
        sendMutation.mutate(trimmed);
        return;
      }
      if (!agentPath || createMission.isPending) return;
      try {
        const { sessionKey: newKey } = await createMission.mutateAsync(trimmed);
        nav(
          `/session/${encodeURIComponent(newKey)}?agent=${encodeURIComponent(agentPath)}`,
          { replace: true },
        );
      } catch (e) {
        console.error("[chat-view] draft send failed", e);
      }
    },
    [isDraft, sendMutation, createMission, agentPath, nav],
  );

  // Scroll the message list to the bottom when the route changes —
  // so arriving at an existing session lands on the latest message.
  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight });
  }, [sessionKey]);

  const vv = useVisualViewport();
  const feedItems = (history ?? []) as unknown as FeedItem[];

  return (
    <div
      className="mobile-chat fixed left-0 right-0 flex flex-col bg-background"
      style={{
        top: `${vv.offsetTop}px`,
        height: `${vv.height}px`,
      }}
    >
      <ChatHeader
        convo={convo}
        agent={agent}
        agentPath={agentPath}
        isDraft={isDraft}
        isRunning={isRunning}
        onBack={() => nav("/")}
      />

      <div className="flex-1 min-h-0 flex flex-col">
        <ChatPanel
          sessionKey={sessionKey ?? "default"}
          feedItems={feedItems}
          onSend={handleSend}
          isLoading={sendMutation.isPending || createMission.isPending}
          placeholder="Message…"
          renderUserMessage={(msg) => {
            const invocation = decodeActionMessage(msg.content);
            if (!invocation) return undefined;
            return <UserActionMessage invocation={invocation} />;
          }}
        />
      </div>
    </div>
  );
}

interface ChatHeaderProps {
  convo: ConversationEntry | undefined;
  agent: Agent | undefined;
  agentPath: string;
  isDraft: boolean;
  isRunning: boolean;
  onBack: () => void;
}

function ChatHeader({
  convo,
  agent,
  agentPath,
  isDraft,
  isRunning,
  onBack,
}: ChatHeaderProps) {
  // Draft chat uses the agent's name as the title — no mission exists
  // yet to derive one from. After first send the URL replaces to the
  // real session and the convo lookup takes over.
  const title = isDraft
    ? agent?.name ?? "New mission"
    : convo?.title ?? agent?.name ?? "Session";
  const subtitle = isDraft
    ? "Type a message to start"
    : agent?.name ?? agentPath;

  return (
    <header
      className="shrink-0 flex items-center gap-3 border-b border-border/80 bg-background/95 backdrop-blur px-3 py-2"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
    >
      <button
        onClick={onBack}
        className="touchable h-9 w-9 flex items-center justify-center rounded-full hover:bg-accent -ml-1"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <HoustonAvatar
        color={agent?.color}
        diameter={36}
        running={isRunning}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">{title}</p>
        {isRunning ? (
          <p className="truncate text-[11px] text-muted-foreground leading-tight italic flex items-center gap-1">
            typing
            <span className="inline-flex items-end h-2 gap-[2px] ml-0.5">
              <span className="typing-dot inline-block size-[3px] rounded-full bg-current" />
              <span className="typing-dot inline-block size-[3px] rounded-full bg-current" />
              <span className="typing-dot inline-block size-[3px] rounded-full bg-current" />
            </span>
          </p>
        ) : (
          <p className="truncate text-[11px] text-muted-foreground leading-tight">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
