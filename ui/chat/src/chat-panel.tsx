/**
 * ChatPanel -- THE single chat experience component.
 * Follows the Vercel AI Elements chatbot example exactly.
 * Generic version: accepts feedItems/status as props, no store dependencies.
 */
import { useCallback, useMemo } from "react";
import type { FeedItem } from "./types";
import type { ReactNode } from "react";

import { feedItemsToMessages } from "./chat-helpers";
import type { ToolsAndCardsProps } from "./chat-helpers";
import type { ToolEntry } from "./feed-to-messages";
import { ChatInput } from "./chat-input";
import { ChatMessages, ChatDropOverlay } from "./chat-messages";
import type { ChatMessagesProps } from "./chat-messages";
import { Shimmer } from "./ai-elements/shimmer";
import { useFileDropZone, useControllable, mergeUniqueFiles } from "./use-file-drop-zone";

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
  /** Controlled composer text. Forwarded to ChatInput. */
  value?: string;
  /** Required if `value` is provided. */
  onValueChange?: (value: string) => void;
  /** Controlled composer attachments. Forwarded to ChatInput. */
  attachments?: File[];
  /** Required if `attachments` is provided. */
  onAttachmentsChange?: (files: File[]) => void;
  /** Emitted when the library wants to surface a short notice to the user
   *  (e.g. a duplicate-file drop). The app decides how to display it. */
  onNotice?: (message: string) => void;
  /** Optional content rendered in the composer footer (e.g. model selector). */
  footer?: ReactNode;
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
  /** Custom renderer for system messages. Return a node to replace the default,
   *  or undefined to use the default italic text. */
  renderSystemMessage?: (msg: import("./feed-to-messages").ChatMessage) => ReactNode | undefined;
  /** Custom renderer for user messages. Return a node to replace the
   *  default user bubble, or `undefined` to keep the markdown body. */
  renderUserMessage?: (msg: import("./feed-to-messages").ChatMessage) => ReactNode | undefined;
  /** Node rendered after the last message (inside the scroll container).
   *  Useful for inline end-of-feed cards like auth reconnect prompts. */
  afterMessages?: ReactNode;
  /**
   * Optional render prop called once per *completed* assistant turn, on the
   * last assistant message of that turn. Receives all tools from every
   * assistant message in the turn (aggregated). Returned node is rendered
   * below the assistant comment. The app uses this to show a summary of
   * files edited/created during the turn. Not called while the turn is
   * still streaming.
   */
  renderTurnSummary?: (tools: ToolEntry[]) => ReactNode;
  /** Called when the user clicks the open button on an inline link. */
  onOpenLink?: (url: string) => void;
  /**
   * Custom renderer for markdown links — replaces the default button.
   * The app layer uses this to render rich inline cards for certain
   * URL patterns (e.g. Composio connect flows). When omitted, links
   * render as the default `onOpenLink` button.
   */
  renderLink?: ChatMessagesProps["renderLink"];
  /**
   * Replaces the composer entirely with this node. Apps use it to render
   * a focused interaction surface (e.g. an action-input form) that should
   * own the bottom of the panel until the user submits or cancels. While
   * `composerOverride` is set, the textarea, file picker, and footer are
   * not rendered.
   */
  composerOverride?: ReactNode;
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
  renderSystemMessage,
  renderUserMessage,
  afterMessages,
  renderTurnSummary,
  onOpenLink,
  renderLink,
  value,
  onValueChange,
  attachments,
  onAttachmentsChange,
  onNotice,
  footer,
  composerOverride,
}: ChatPanelProps) {
  const status = statusProp ?? deriveStatus(feedItems, isLoading);
  const messages = useMemo(() => feedItemsToMessages(feedItems), [feedItems]);
  const hasMessages = messages.length > 0;

  // Attachments state lives at ChatPanel level so the ENTIRE panel can act as
  // a drop target (not just the composer). When the parent passes controlled
  // props we forward them; otherwise we manage internally and clear on send.
  const [files, setFiles] = useControllable<File[]>(
    attachments,
    onAttachmentsChange,
    [],
  );
  const isFilesControlled = attachments !== undefined;
  const addDroppedFiles = useCallback(
    (dropped: File[]) => {
      const merged = mergeUniqueFiles(files, dropped);
      if (merged.length < files.length + dropped.length) {
        onNotice?.("File already in chat");
      }
      setFiles(merged);
    },
    [files, setFiles, onNotice],
  );
  const { isDraggingOver, dropProps } = useFileDropZone(addDroppedFiles);

  // Wrap onSend so we clear internally-managed attachments after a send;
  // in controlled mode the parent is responsible for clearing.
  const handleSend = useCallback(
    (text: string, sent: File[]) => {
      onSend(text, sent);
      if (!isFilesControlled) setFiles([]);
    },
    [onSend, isFilesControlled, setFiles],
  );

  return (
    <div
      className="relative flex flex-1 flex-col min-h-0 overflow-hidden"
      {...dropProps}
    >
      <ChatDropOverlay visible={isDraggingOver} />
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
        <ChatMessages
          messages={messages}
          status={status}
          thinkingIndicator={thinkingIndicator ?? <DefaultThinkingIndicator />}
          transformContent={transformContent}
          toolLabels={toolLabels}
          isSpecialTool={isSpecialTool}
          renderToolResult={renderToolResult}
          renderMessageAvatar={renderMessageAvatar}
          renderSystemMessage={renderSystemMessage}
          renderUserMessage={renderUserMessage}
          afterMessages={afterMessages}
          renderTurnSummary={renderTurnSummary}
          onOpenLink={onOpenLink}
          renderLink={renderLink}
        />
      ) : (
        <div className="flex-1 min-h-0 flex items-center justify-center">
          {emptyState}
        </div>
      )}

      {composerOverride ? (
        <div className="shrink-0 px-4 pb-6 pt-2">
          <div className="max-w-3xl mx-auto">{composerOverride}</div>
        </div>
      ) : (
        <ChatInput
          onSend={handleSend}
          onStop={onStop}
          status={status}
          placeholder={placeholder}
          value={value}
          onValueChange={onValueChange}
          attachments={files}
          onAttachmentsChange={setFiles}
          onNotice={onNotice}
          footer={footer}
        />
      )}
    </div>
  );
}
