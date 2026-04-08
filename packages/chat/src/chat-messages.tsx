/**
 * Internal: the scrollable message list body of ChatPanel.
 * Extracted so chat-panel.tsx stays under the 200-line budget.
 * Not exported from the package index.
 */

import { useMemo } from "react";
import type { ReactNode } from "react";
import { FilesIcon } from "lucide-react";
import {
  Conversation,
  ConversationAutoScroll,
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
import { ToolsAndCards } from "./chat-helpers";
import type { ToolsAndCardsProps } from "./chat-helpers";
import type { ChatMessage, ToolEntry } from "./feed-to-messages";

export interface ChatMessagesProps {
  messages: ChatMessage[];
  status: "ready" | "streaming" | "submitted";
  thinkingIndicator: ReactNode;
  transformContent?: (content: string) => {
    content: string;
    extra?: ReactNode;
  };
  toolLabels?: ToolsAndCardsProps["toolLabels"];
  isSpecialTool?: ToolsAndCardsProps["isSpecialTool"];
  renderToolResult?: ToolsAndCardsProps["renderToolResult"];
  renderMessageAvatar?: (msg: ChatMessage) => ReactNode | undefined;
  renderTurnSummary?: (tools: ToolEntry[]) => ReactNode;
  onOpenLink?: (url: string) => void;
}

/**
 * Build a map of message-index -> aggregated tools for that turn. Only set
 * on the *last* assistant message of a *complete* turn (next message is
 * non-assistant, OR it's the final message and the chat status is "ready").
 */
function computeTurnEndTools(
  messages: ChatMessage[],
  status: "ready" | "streaming" | "submitted",
): Map<number, ToolEntry[]> {
  const result = new Map<number, ToolEntry[]>();
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.from !== "assistant") continue;
    const next = messages[i + 1];
    const isEndOfTurn = next ? next.from !== "assistant" : status === "ready";
    if (!isEndOfTurn) continue;
    const tools: ToolEntry[] = [];
    for (let j = i; j >= 0; j--) {
      const m = messages[j];
      if (m.from !== "assistant") break;
      tools.unshift(...m.tools);
    }
    result.set(i, tools);
  }
  return result;
}

export function ChatMessages({
  messages,
  status,
  thinkingIndicator,
  transformContent,
  toolLabels,
  isSpecialTool,
  renderToolResult,
  renderMessageAvatar,
  renderTurnSummary,
  onOpenLink,
}: ChatMessagesProps) {
  const turnEndTools = useMemo(
    () => computeTurnEndTools(messages, status),
    [messages, status],
  );
  return (
    <Conversation className="flex-1 min-h-0">
      <ConversationAutoScroll status={status} />
      <ConversationContent className="max-w-3xl mx-auto">
        {messages.map((msg, idx) => {
          if (msg.from === "system") {
            return (
              <div key={msg.key} className="flex justify-center py-2">
                <span className="text-xs text-muted-foreground/60 italic">
                  {msg.content}
                </span>
              </div>
            );
          }
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
                      <MessageResponse isAnimating={streaming} onOpenLink={onOpenLink}>
                        {displayContent}
                      </MessageResponse>
                      {transformed?.extra}
                    </MessageContent>
                  );
                })()}
                {(() => {
                  if (!renderTurnSummary) return null;
                  const turnTools = turnEndTools.get(idx);
                  if (!turnTools) return null;
                  return renderTurnSummary(turnTools);
                })()}
              </div>
            </Message>
          );
        })}
        {status === "submitted" && (
          <Message from="assistant">
            <MessageContent>
              {thinkingIndicator}
            </MessageContent>
          </Message>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

export interface ChatDropOverlayProps {
  visible: boolean;
}

export function ChatDropOverlay({ visible }: ChatDropOverlayProps) {
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-3 px-6 text-center -translate-y-12">
        <FilesIcon
          className="size-8 text-muted-foreground"
          strokeWidth={1.5}
        />
        <div className="text-2xl font-semibold tracking-tight text-foreground">
          Add anything
        </div>
        <p className="text-sm/relaxed text-muted-foreground">
          Drop your files in here to add it to the conversation
        </p>
      </div>
    </div>
  );
}
