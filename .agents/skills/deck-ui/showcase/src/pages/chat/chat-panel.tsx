import { ChatPanel, ChannelAvatar } from "@deck-ui/chat";
import type { ChatMessage } from "@deck-ui/chat";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  SAMPLE_FEED,
  QUICK_START_CODE,
  CHAT_INPUT_CODE,
  TOOL_ACTIVITY_CODE,
  CONVERSATION_CODE,
  MESSAGE_CODE,
  REASONING_CODE,
  PROMPT_INPUT_CODE,
  TYPES_CODE,
  CHAT_PANEL_PROPS,
  CHAT_INPUT_PROPS,
  TOOL_ACTIVITY_PROPS,
  CONVERSATION_PROPS,
  MESSAGE_PROPS,
  REASONING_PROPS,
  PROMPT_INPUT_PROPS,
} from "./chat-panel-data";
import {
  CHANNEL_AVATAR_USAGE_CODE,
  MESSAGE_AVATAR_CODE,
  MERGE_FEED_CODE,
  CHANNEL_AVATAR_PROPS,
} from "./channel-avatar-data";

export function ChatPanelPage() {
  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">ChatPanel</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/chat
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Drop-in chat experience for AI agent sessions. Renders a message feed
          with tool calls, thinking blocks, streaming markdown, and an input bar
          — all from a flat array of FeedItems.
        </p>
        <div className="h-[500px] rounded-xl border border-border overflow-hidden flex flex-col">
          <ChatPanel
            sessionKey="showcase-demo"
            feedItems={SAMPLE_FEED}
            onSend={(text) => console.log("Send:", text)}
            isLoading={false}
            placeholder="Try typing a message..."
            status="ready"
            renderMessageAvatar={(msg: ChatMessage) =>
              msg.source ? <ChannelAvatar source={msg.source} /> : undefined
            }
          />
        </div>
      </div>

      {/* Architecture */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Architecture</h2>
        <pre className="text-[13px] text-muted-foreground bg-secondary rounded-lg p-4 leading-relaxed font-mono">
          {ARCHITECTURE_TREE}
        </pre>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Start</h2>
        <CodeBlock code={QUICK_START_CODE} />
      </div>

      <hr className="border-border" />

      {/* Sub-component sections */}
      <ComponentSection
        name="ChatPanel"
        description="Top-level entry point. Pass FeedItems and callbacks — it handles message grouping, tool display, reasoning blocks, streaming, and input. Status is auto-derived from feedItems unless overridden."
        props={CHAT_PANEL_PROPS}
      />
      <ComponentSection
        name="ChatInput"
        description="Pre-built input bar with send/stop/mic/voice-mode states. Used internally by ChatPanel, but can be used standalone."
        props={CHAT_INPUT_PROPS}
        code={CHAT_INPUT_CODE}
      />
      <ComponentSection
        name="ToolActivity"
        description="Collapsing tool call list with live spinners, elapsed time counter, and automatic grouping of consecutive same-name tools. Built-in labels for common tools (Read, Write, Bash, etc.)."
        props={TOOL_ACTIVITY_PROPS}
        code={TOOL_ACTIVITY_CODE}
      />
      <ComponentSection
        name="Conversation"
        description="Auto-scrolling message container using stick-to-bottom behavior. Wraps ConversationContent (the message list) and ConversationScrollButton (jump-to-bottom FAB)."
        props={CONVERSATION_PROPS}
        code={CONVERSATION_CODE}
      />
      <ComponentSection
        name="Message"
        description="Role-aware message wrapper. User messages are right-aligned bubbles; assistant messages are full-width. Compose with MessageContent, MessageResponse, MessageActions, and MessageBranch."
        props={MESSAGE_PROPS}
        code={MESSAGE_CODE}
      />
      <ComponentSection
        name="Reasoning"
        description="Collapsible thinking block. Auto-opens when streaming starts, auto-closes 1s after streaming ends. Shows elapsed duration. Compose with ReasoningTrigger and ReasoningContent."
        props={REASONING_PROPS}
        code={REASONING_CODE}
      />
      <ComponentSection
        name="PromptInput"
        description="Complex compound component for rich text input with file attachments, screenshots, action menus, selects, and tabs. ChatInput is a simpler wrapper around this."
        props={PROMPT_INPUT_PROPS}
        code={PROMPT_INPUT_CODE}
      />

      <hr className="border-border" />

      {/* Channel Avatars */}
      <div>
        <h2 className="text-sm font-semibold mb-1">ChannelAvatar</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Branded avatar badge for multi-channel messages. Shows the platform logo
          on the user message bubble when messages come from Telegram or Slack.
          Uses <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">renderMessageAvatar</code> on ChatPanel.
        </p>
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border mb-4">
          <div className="flex flex-col items-center gap-1.5">
            <ChannelAvatar source="telegram" size="md" />
            <span className="text-xs text-muted-foreground">Telegram</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <ChannelAvatar source="slack" size="md" />
            <span className="text-xs text-muted-foreground">Slack</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <ChannelAvatar source="telegram" size="sm" />
            <span className="text-xs text-muted-foreground">sm</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <ChannelAvatar source="slack" size="sm" />
            <span className="text-xs text-muted-foreground">sm</span>
          </div>
        </div>
        <div className="space-y-4">
          <PropsTable props={CHANNEL_AVATAR_PROPS} />
          <CodeBlock code={CHANNEL_AVATAR_USAGE_CODE} />
          <CodeBlock code={MESSAGE_AVATAR_CODE} />
        </div>
      </div>

      <hr className="border-border" />

      {/* mergeFeedItem */}
      <div>
        <h2 className="text-sm font-semibold mb-1">mergeFeedItem</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Pure function for smart-merging streaming FeedItems into a feed array.
          Use it in your store instead of duplicating the replacement logic.
        </p>
        <CodeBlock code={MERGE_FEED_CODE} />
      </div>

      <hr className="border-border" />

      {/* Types */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Types</h2>
        <CodeBlock code={TYPES_CODE} language="typescript" />
      </div>
    </div>
  );
}

/* -- Constants ----------------------------------------------------------- */

const ARCHITECTURE_TREE = [
  "ChatPanel                 \u2190 entry point, accepts FeedItem[] + callbacks",
  "\u251C\u2500\u2500 Conversation            \u2190 auto-scrolling container (stick-to-bottom)",
  "\u2502   \u251C\u2500\u2500 Message              \u2190 role-aware wrapper (user/assistant)",
  "\u2502   \u2502   \u251C\u2500\u2500 Reasoning         \u2190 collapsible thinking block",
  "\u2502   \u2502   \u251C\u2500\u2500 ToolActivity      \u2190 tool call list with spinners",
  "\u2502   \u2502   \u2514\u2500\u2500 MessageContent    \u2190 bubble with MessageResponse (markdown)",
  "\u2502   \u2514\u2500\u2500 Shimmer              \u2190 animated loading text",
  "\u2514\u2500\u2500 ChatInput               \u2190 input bar (wraps PromptInput)",
  "    \u2514\u2500\u2500 PromptInput          \u2190 compound: textarea, submit, attachments, menus",
].join("\n");

/* -- Sub-component section ----------------------------------------------- */

function ComponentSection({ name, description, props, code, codeLabel }: {
  name: string;
  description: string;
  props: import("../../components/props-table").PropDef[];
  code?: string;
  codeLabel?: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-1">{name}</h2>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            Props
          </h3>
          <PropsTable props={props} />
        </div>
        {code && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">
              {codeLabel ?? "Usage"}
            </h3>
            <CodeBlock code={code} />
          </div>
        )}
      </div>
    </div>
  );
}
