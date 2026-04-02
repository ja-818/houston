import type { PropDef } from "../../components/props-table";

export const CHANNEL_AVATAR_USAGE_CODE = `import { ChannelAvatar } from "@deck-ui/chat"

// Telegram (blue circle with paper plane)
<ChannelAvatar source="telegram" />

// Slack (purple circle with Slack logo)
<ChannelAvatar source="slack" />

// Sizes
<ChannelAvatar source="telegram" size="sm" />  // 24px (default)
<ChannelAvatar source="slack" size="md" />      // 32px`;

export const MESSAGE_AVATAR_CODE = `import { ChatPanel, ChannelAvatar } from "@deck-ui/chat"
import type { ChatMessage } from "@deck-ui/chat"

// Show channel logos on messages from external sources
<ChatPanel
  sessionKey="main"
  feedItems={feed}
  onSend={handleSend}
  isLoading={loading}
  renderMessageAvatar={(msg: ChatMessage) => {
    if (msg.source && msg.source !== "desktop") {
      return <ChannelAvatar source={msg.source} />
    }
    return undefined
  }}
/>`;

export const SOURCE_DETECTION_CODE = `// User messages with a [Channel] prefix are auto-detected:
// "[Telegram] Hello!"  →  { source: "telegram", content: "Hello!" }
// "[Slack] Hey"        →  { source: "slack", content: "Hey" }
// "Normal message"     →  { source: undefined, content: "Normal message" }

// feedItemsToMessages() extracts the source automatically.
// Use renderMessageAvatar to render the avatar based on msg.source.`;

export const MERGE_FEED_CODE = `import { mergeFeedItem } from "@deck-ui/chat"
import type { FeedItem } from "@deck-ui/chat"

// Smart-merge a new item into an existing feed array.
// Handles streaming replacement:
//   thinking_streaming → replaces previous thinking_streaming
//   thinking (final)   → replaces last thinking_streaming
//   assistant_text_streaming → replaces previous streaming
//   assistant_text (final)   → replaces last streaming

const updated = mergeFeedItem(existingItems, newItem)

// Use in a Zustand store:
pushFeedItem: (key, item) => set((s) => ({
  feeds: {
    ...s.feeds,
    [key]: mergeFeedItem(s.feeds[key] ?? [], item),
  },
}))`;

export const CHANNEL_AVATAR_PROPS: PropDef[] = [
  { name: "source", type: '"telegram" | "slack" | string', description: "Channel source — determines logo and background color" },
  { name: "size", type: '"sm" | "md"', default: '"sm"', description: "Avatar size (sm = 24px, md = 32px)" },
  { name: "className", type: "string", description: "Additional CSS classes" },
];
