import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ChatPanel, Shimmer } from "@houston-ai/chat";
import {
  SYNC_MSG_TYPES,
  newMsgId,
  sessionKeyForActivity,
} from "@houston-ai/sync-protocol";
import { useMobileStore } from "@/lib/store";
import { syncClient } from "@/lib/sync-client";
import { useKeyboardHeight } from "@/hooks/use-keyboard-height";
import { HoustonAvatar } from "./houston-avatar";
import { ConnectionIndicator } from "./connection-indicator";

export function ChatView() {
  const navigate = useNavigate();
  const { convoId } = useParams<{ convoId: string }>();

  const conversations = useMobileStore((s) => s.conversations);
  const chatHistory = useMobileStore((s) => s.chatHistory);
  const connectionState = useMobileStore((s) => s.connectionState);
  const isConnected = useMobileStore((s) => s.isConnected);
  const connected = isConnected();
  const setCurrentConvo = useMobileStore((s) => s.setCurrentConvo);
  const setChatHistory = useMobileStore((s) => s.setChatHistory);
  const appendFeedItem = useMobileStore((s) => s.appendFeedItem);
  const pushOptimisticMessage = useMobileStore((s) => s.pushOptimisticMessage);

  const convo = conversations.find((c) => c.id === convoId);
  const isRunning = convo?.status === "running";

  const keyboardHeight = useKeyboardHeight();

  useEffect(() => {
    if (convoId) {
      setCurrentConvo(convoId);
      setChatHistory([]);
      syncClient.send(SYNC_MSG_TYPES.REQUEST_CHAT_HISTORY, {
        agentId: convoId,
        sessionKey: sessionKeyForActivity(convoId),
      });
    }
    return () => setCurrentConvo(null);
  }, [convoId, setCurrentConvo, setChatHistory]);

  function handleSend(text: string) {
    if (!convoId) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!connected) return;

    const msgId = newMsgId();
    pushOptimisticMessage({ msgId, text: trimmed, sentAt: Date.now() });
    appendFeedItem({ feed_type: "user_message", data: trimmed });

    syncClient.send(SYNC_MSG_TYPES.SEND_MESSAGE, {
      agentId: convoId,
      sessionKey: sessionKeyForActivity(convoId),
      text: trimmed,
      msgId,
    });
  }

  const placeholder = connected
    ? "Tell your agent what to do..."
    : "Reconnecting…";

  return (
    <div
      className="mobile-chat flex h-full flex-col bg-background safe-top"
      style={{
        // Lift the whole chat column above the on-screen keyboard so the
        // composer never hides behind it.
        paddingBottom: keyboardHeight ? `${keyboardHeight}px` : undefined,
        transition: "padding-bottom 120ms ease",
      }}
    >
      {/* Header — matches conversation row style */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-2.5 shrink-0">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="touchable flex h-9 w-9 shrink-0 items-center justify-center rounded-lg active:bg-accent"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <HoustonAvatar
          color={convo?.agentColor}
          ringSize={36}
          glyphSize={18}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {convo?.agentName ?? "Agent"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {convo?.title}
          </p>
        </div>
        <ConnectionIndicator state={connectionState} compact />
      </header>

      {/* Subtle running indicator — below header when the agent is working. */}
      {isRunning && (
        <div className="px-4 py-1.5 text-[11px] shrink-0">
          <Shimmer>Thinking…</Shimmer>
        </div>
      )}

      {/* ChatPanel — the real component, with mobile CSS overrides */}
      <ChatPanel
        sessionKey={convoId ?? "default"}
        feedItems={chatHistory}
        onSend={(text) => handleSend(text)}
        isLoading={isRunning}
        placeholder={placeholder}
      />
    </div>
  );
}
