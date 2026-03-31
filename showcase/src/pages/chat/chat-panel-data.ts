import type { PropDef } from "../../components/props-table";
import type { FeedItem } from "@deck-ui/chat";

/* -- Sample data --------------------------------------------------------- */

export const SAMPLE_FEED: FeedItem[] = [
  { feed_type: "user_message", data: "[Telegram] Hey, what's my schedule today?" },
  { feed_type: "assistant_text", data: "Checking your calendar... You have a standup at 10am and a design review at 2pm." },
  { feed_type: "user_message", data: "What tasks are pending?" },
  { feed_type: "thinking", data: "The user wants a status update. Let me check the board." },
  { feed_type: "tool_call", data: { name: "Bash", input: { command: "keel task list" } } },
  { feed_type: "tool_result", data: { content: '{"tasks":[{"id":1,"status":"running"}]}', is_error: false } },
  { feed_type: "assistant_text", data: "You have 3 pending tasks:\n\n1. **Deploy v2.0** — running\n2. **Review PR #42** — needs your review\n3. **Update docs** — in queue" },
  { feed_type: "user_message", data: "Approve PR #42" },
  { feed_type: "tool_call", data: { name: "approve_pr", input: { pr: 42 } } },
  { feed_type: "tool_result", data: { content: "PR #42 approved and merged", is_error: false } },
  { feed_type: "assistant_text", data: "Done! PR #42 has been approved and merged." },
];

/* -- Code examples ------------------------------------------------------- */

export const QUICK_START_CODE = `import { ChatPanel } from "@deck-ui/chat"
import type { FeedItem } from "@deck-ui/chat"

function MyChat({ items }: { items: FeedItem[] }) {
  return (
    <ChatPanel
      sessionKey="session-1"
      feedItems={items}
      onSend={(text) => sendToAgent(text)}
      isLoading={isStreaming}
      status="streaming"
    />
  )
}`;

export const CHAT_INPUT_CODE = `import { ChatInput } from "@deck-ui/chat"

<ChatInput
  onSend={(text) => sendMessage(text)}
  onStop={() => cancelStream()}
  status="ready"
  placeholder="Ask anything..."
/>`;

export const TOOL_ACTIVITY_CODE = `import { ToolActivity } from "@deck-ui/chat"

<ToolActivity
  tools={[
    { name: "Read", input: { path: "src/index.ts" } },
    { name: "Bash", input: { command: "npm test" }, result: { content: "OK", is_error: false } },
  ]}
  isStreaming={true}
  toolLabels={{ custom_tool: "Running custom tool" }}
/>`;

export const CONVERSATION_CODE = `import { Conversation, ConversationContent, ConversationScrollButton } from "@deck-ui/chat"

<Conversation className="flex-1 min-h-0">
  <ConversationContent className="max-w-3xl mx-auto">
    {messages.map((msg) => (
      <Message key={msg.key} from={msg.from}>
        <MessageContent>
          <MessageResponse>{msg.content}</MessageResponse>
        </MessageContent>
      </Message>
    ))}
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>`;

export const MESSAGE_CODE = `import {
  Message, MessageContent, MessageResponse, MessageActions, MessageAction
} from "@deck-ui/chat"

<Message from="assistant">
  <MessageContent>
    <MessageResponse isAnimating={isStreaming}>
      {content}
    </MessageResponse>
  </MessageContent>
  <MessageActions>
    <MessageAction tooltip="Copy" onClick={handleCopy}>
      <CopyIcon className="size-4" />
    </MessageAction>
  </MessageActions>
</Message>`;

export const REASONING_CODE = `import { Reasoning, ReasoningTrigger, ReasoningContent } from "@deck-ui/chat"

<Reasoning isStreaming={true} defaultOpen={true}>
  <ReasoningTrigger />
  <ReasoningContent>
    {thinkingText}
  </ReasoningContent>
</Reasoning>`;

export const PROMPT_INPUT_CODE = `import {
  PromptInput, PromptInputBody, PromptInputTextarea, PromptInputSubmit
} from "@deck-ui/chat"

<PromptInput onSubmit={(msg) => sendMessage(msg.text)}>
  <PromptInputBody>
    <PromptInputTextarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Type a message..."
    />
  </PromptInputBody>
  <PromptInputSubmit status="ready" />
</PromptInput>`;

export const TYPES_CODE = `// FeedItem — discriminated union of stream events
type FeedItem =
  | { feed_type: "user_message"; data: string }
  | { feed_type: "assistant_text" | "assistant_text_streaming"; data: string }
  | { feed_type: "thinking" | "thinking_streaming"; data: string }
  | { feed_type: "tool_call"; data: { name: string; input: unknown } }
  | { feed_type: "tool_result"; data: { content: string; is_error: boolean } }
  | { feed_type: "system_message"; data: string }
  | { feed_type: "final_result"; data: { result: string; cost_usd: number | null; duration_ms: number | null } }

// ChatMessage — grouped feed items ready for rendering
interface ChatMessage {
  key: string; from: "user" | "assistant"; content: string
  isStreaming: boolean; reasoning?: { content: string; isStreaming: boolean }
  tools: ToolEntry[]; source?: string  // auto-detected from [Channel] prefix
}

// ToolEntry — a single tool call with optional result
interface ToolEntry {
  name: string; input?: unknown
  result?: { content: string; is_error: boolean }
}`;

/* -- Props definitions --------------------------------------------------- */

export const CHAT_PANEL_PROPS: PropDef[] = [
  { name: "sessionKey", type: "string", description: "Unique key to reset internal state when switching sessions" },
  { name: "feedItems", type: "FeedItem[]", description: "Raw stream items from Claude CLI or similar" },
  { name: "onSend", type: "(text) => void", description: "Called when the user submits a message" },
  { name: "onStop", type: "() => void", description: "Called when the user clicks stop during streaming" },
  { name: "onBack", type: "() => void", description: "Shows a back button and calls this on click" },
  { name: "isLoading", type: "boolean", description: "Whether the agent is processing (used for status derivation)" },
  { name: "placeholder", type: "string", default: '"Type a message..."', description: "Input placeholder text" },
  { name: "emptyState", type: "ReactNode", description: "Shown when there are no messages and status is ready" },
  { name: "status", type: '"ready" | "streaming" | "submitted"', description: "Override auto-derived status" },
  { name: "thinkingIndicator", type: "ReactNode", description: "Custom loading indicator for submitted state" },
  { name: "transformContent", type: "(content) => { content, extra? }", description: "Transform assistant message content before rendering" },
  { name: "toolLabels", type: "Record<string, string>", description: "Custom tool name to label mappings" },
  { name: "isSpecialTool", type: "(name) => boolean", description: "Identify tools needing custom rendering" },
  { name: "renderToolResult", type: "(tool, index) => ReactNode", description: "Custom renderer for special tool results" },
  { name: "renderMessageAvatar", type: "(msg: ChatMessage) => ReactNode", description: "Render a custom avatar for a message (e.g., ChannelAvatar for Telegram/Slack source)" },
];

export const CHAT_INPUT_PROPS: PropDef[] = [
  { name: "onSend", type: "(text) => void", description: "Called with trimmed text when user submits" },
  { name: "onStop", type: "() => void", description: "Called when stop button is clicked" },
  { name: "status", type: '"ready" | "streaming" | "submitted"', default: '"ready"', description: "Controls button states (send/stop)" },
  { name: "placeholder", type: "string", default: '"Type a message..."', description: "Input placeholder text" },
];

export const TOOL_ACTIVITY_PROPS: PropDef[] = [
  { name: "tools", type: "ToolEntry[]", description: "List of tool calls to display" },
  { name: "isStreaming", type: "boolean", description: "Shows spinner on last tool and elapsed time counter" },
  { name: "toolLabels", type: "Record<string, string>", description: "Custom tool name to human-readable label mappings" },
];

export const CONVERSATION_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "ConversationContent + ConversationScrollButton" },
];

export const MESSAGE_PROPS: PropDef[] = [
  { name: "from", type: '"user" | "assistant"', description: "Role — controls bubble alignment and styling" },
  { name: "avatar", type: "ReactNode", description: "Optional avatar rendered to the left of the message (e.g., ChannelAvatar)" },
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "MessageContent, MessageActions, etc." },
];

export const REASONING_PROPS: PropDef[] = [
  { name: "isStreaming", type: "boolean", default: "false", description: "Auto-opens when true, auto-closes 1s after streaming stops" },
  { name: "open", type: "boolean", description: "Controlled open state" },
  { name: "defaultOpen", type: "boolean", description: "Initial open state (defaults to isStreaming value)" },
  { name: "onOpenChange", type: "(open) => void", description: "Called when open state changes" },
  { name: "duration", type: "number", description: "Override computed thinking duration in seconds" },
  { name: "children", type: "ReactNode", description: "ReasoningTrigger + ReasoningContent" },
];

export const PROMPT_INPUT_PROPS: PropDef[] = [
  { name: "onSubmit", type: "(message) => void", description: "Called with { text, attachments } on submit" },
  { name: "children", type: "ReactNode", description: "Compound components: Body, Textarea, Submit, etc." },
];
