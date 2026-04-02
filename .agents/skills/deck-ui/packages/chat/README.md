# @deck-ui/chat

Full-featured AI chat interface. Streaming markdown, thinking blocks, tool activity, prompt input -- one component or pick individual pieces.

## Install

```bash
pnpm add @deck-ui/chat
```

## Usage

```tsx
import { ChatPanel } from "@deck-ui/chat"
import "@deck-ui/chat/src/styles.css"

<ChatPanel
  sessionKey={session.id}
  feedItems={feedItems}
  onSend={(text) => sendMessage(text)}
  onStop={() => stopSession()}
  isLoading={isStreaming}
/>
```

## Exports

**Top-level:** ChatPanel, ChatInput, ToolActivity, ToolsAndCards, Typewriter, feedItemsToMessages

**AI Elements:** Conversation, ConversationContent, ConversationScrollButton, Message, MessageContent, MessageResponse, MessageToolbar, Reasoning, ReasoningTrigger, ReasoningContent, PromptInput (with 30+ sub-components), Shimmer, Suggestions

**Types:** FeedItem, RunStatus, ChatMessage, ToolEntry

## How it works

`ChatPanel` accepts an array of `FeedItem` discriminated unions (user messages, assistant text, thinking, tool calls, tool results, final results) and renders the full conversation. Status is derived automatically from the feed, or you can override it.

The AI Elements are composable -- use `ChatPanel` for the batteries-included experience, or build your own layout with the primitives.

## Peer Dependencies

- React 19+
- @deck-ui/core

---

Part of [Keel & Deck](../../README.md).
