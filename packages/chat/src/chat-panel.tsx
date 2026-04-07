/**
 * ChatPanel -- THE single chat experience component.
 * Follows the Vercel AI Elements chatbot example exactly.
 * Generic version: accepts feedItems/status as props, no store dependencies.
 */
import { useMemo } from "react";
import type { FeedItem } from "./types";
import type { ReactNode } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "./ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "./ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "./ai-elements/reasoning";

import { feedItemsToMessages, ToolsAndCards } from "./chat-helpers";
import type { ToolsAndCardsProps } from "./chat-helpers";
import { ChatInput } from "./chat-input";
import { Shimmer } from "./ai-elements/shimmer";

// ---------------------------------------------------------------------------
// ChatPanel props
// ---------------------------------------------------------------------------

type ChatStatus = "ready" | "streaming" | "submitted";

export interface ChatPanelProps {
  sessionKey: string;
  feedItems: FeedItem[];
  onSend: (text: string, files: File[]) => void;
  onStop?: () => void;
  onBack?: () => void;
  isLoading: boolean;
  placeholder?: string;
  emptyState?: ReactNode;
  /** Override status derivation. If not provided, status is derived from feedItems. */
  status?: ChatStatus;
  /**
   * Custom loading indicator shown when status is "submitted" and no messages yet.
   * Defaults to a shimmering "Thinking..." text.
   */
  thinkingIndicator?: ReactNode;
  /**
   * Optional transform applied to each assistant message's content before rendering.
   * Return { content, extra } where content is the cleaned text and extra is
   * an optional ReactNode rendered below the message response.
   */
  transformContent?: (content: string) => {
    content: string;
    extra?: ReactNode;
  };
  /** Props forwarded to ToolsAndCards for custom tool rendering */
  toolLabels?: ToolsAndCardsProps["toolLabels"];
  isSpecialTool?: ToolsAndCardsProps["isSpecialTool"];
  renderToolResult?: ToolsAndCardsProps["renderToolResult"];
  /** Optional callback to render an avatar for a message (e.g., channel logo). */
  renderMessageAvatar?: (msg: import("./feed-to-messages").ChatMessage) => ReactNode | undefined;
}

function deriveStatus(items: FeedItem[], isLoading: boolean): ChatStatus {
  const last = items[items.length - 1];
  if (
    last?.feed_type === "assistant_text_streaming" ||
    last?.feed_type === "thinking_streaming" ||
    last?.feed_type === "thinking" ||
    last?.feed_type === "tool_call" ||
    last?.feed_type === "tool_result"
  )
    return "streaming";
  if (last?.feed_type === "user_message") return "submitted";
  if (isLoading && items.length === 0) return "submitted";
  return "ready";
}

const DefaultThinkingIndicator = () => (
  <div className="py-1">
    <Shimmer duration={2}>Thinking...</Shimmer>
  </div>
);

export function ChatPanel({
  feedItems,
  onSend,
  onStop,
  onBack,
  isLoading,
  placeholder = "Type a message...",
  emptyState,
  status: statusProp,
  thinkingIndicator,
  transformContent,
  toolLabels,
  isSpecialTool,
  renderToolResult,
  renderMessageAvatar,
}: ChatPanelProps) {
  const status = statusProp ?? deriveStatus(feedItems, isLoading);
  const messages = useMemo(() => feedItemsToMessages(feedItems), [feedItems]);
  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      {onBack && (
        <div className="max-w-3xl mx-auto w-full px-4 pt-3">
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <span>←</span> Back to chats
          </button>
        </div>
      )}
      {hasMessages || status !== "ready" ? (
        <Conversation className="flex-1 min-h-0">
          <ConversationContent className={`max-w-3xl mx-auto${status === "submitted" ? " min-h-full" : ""}`}>
            {messages.map((msg, idx) => {
              const isLastMsg = idx === messages.length - 1;
              const streaming = msg.isStreaming && isLastMsg;
              return (
                <Message from={msg.from} key={msg.key} avatar={renderMessageAvatar?.(msg)}>
                  <div>
                    {msg.reasoning && (
                      <Reasoning
                        isStreaming={msg.reasoning.isStreaming && isLastMsg}
                        defaultOpen={msg.reasoning.isStreaming && isLastMsg}
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>
                          {msg.reasoning.content}
                        </ReasoningContent>
                      </Reasoning>
                    )}
                    {msg.tools.length > 0 && (
                      <ToolsAndCards
                        tools={msg.tools}
                        isStreaming={streaming}
                        toolLabels={toolLabels}
                        isSpecialTool={isSpecialTool}
                        renderToolResult={renderToolResult}
                      />
                    )}
                    {msg.content && (() => {
                      const transformed = msg.from === "assistant" && transformContent
                        ? transformContent(msg.content)
                        : null;
                      const displayContent = transformed?.content ?? msg.content;
                      return (
                        <MessageContent>
                          <MessageResponse isAnimating={streaming}>
                            {displayContent}
                          </MessageResponse>
                          {transformed?.extra}
                        </MessageContent>
                      );
                    })()}
                  </div>
                </Message>
              );
            })}
            {status === "submitted" && (
              <>
                <div className="flex-1" />
                <Message from="assistant">
                  <MessageContent>
                    {thinkingIndicator ?? <DefaultThinkingIndicator />}
                  </MessageContent>
                </Message>
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      ) : (
        <div className="flex-1 min-h-0 flex items-center justify-center">
          {emptyState}
        </div>
      )}

      <ChatInput
        onSend={onSend}
        onStop={onStop}
        status={status}
        placeholder={placeholder}
      />
    </div>
  );
}
