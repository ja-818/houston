import { ChannelAvatar } from "@deck-ui/chat";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  CHANNEL_AVATAR_USAGE_CODE,
  MESSAGE_AVATAR_CODE,
  SOURCE_DETECTION_CODE,
  MERGE_FEED_CODE,
  CHANNEL_AVATAR_PROPS,
} from "./channel-avatar-data";

export function ChannelAvatarPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold mb-1">ChannelAvatar + Utilities</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/chat
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Components and utilities for multi-channel AI agent apps. Show branded
          avatars for Telegram and Slack messages, smart-merge streaming feed
          items, and detect message sources automatically.
        </p>
      </div>

      {/* Live Demo */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Channel Avatars</h2>
        <div className="flex items-center gap-4 p-6 rounded-xl border border-border">
          <div className="flex flex-col items-center gap-2">
            <ChannelAvatar source="telegram" size="md" />
            <span className="text-xs text-muted-foreground">Telegram</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ChannelAvatar source="slack" size="md" />
            <span className="text-xs text-muted-foreground">Slack</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ChannelAvatar source="telegram" size="sm" />
            <span className="text-xs text-muted-foreground">sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ChannelAvatar source="slack" size="sm" />
            <span className="text-xs text-muted-foreground">sm</span>
          </div>
        </div>
      </div>

      {/* Props */}
      <div>
        <h2 className="text-sm font-semibold mb-3">ChannelAvatar Props</h2>
        <PropsTable props={CHANNEL_AVATAR_PROPS} />
      </div>

      {/* Usage */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Basic Usage</h2>
        <CodeBlock code={CHANNEL_AVATAR_USAGE_CODE} />
      </div>

      <hr className="border-border" />

      {/* renderMessageAvatar */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Message Avatars in ChatPanel</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Use <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">renderMessageAvatar</code> on
          ChatPanel to show channel logos next to messages from external sources.
          Messages with a <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">[Telegram]</code> or
          <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">[Slack]</code> prefix
          automatically get their source extracted.
        </p>
        <CodeBlock code={MESSAGE_AVATAR_CODE} />
      </div>

      {/* Source detection */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Automatic Source Detection</h2>
        <CodeBlock code={SOURCE_DETECTION_CODE} />
      </div>

      <hr className="border-border" />

      {/* mergeFeedItem */}
      <div>
        <h2 className="text-sm font-semibold mb-3">mergeFeedItem</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Pure function for smart-merging streaming FeedItems. Use it in your
          Zustand store instead of duplicating the replacement logic.
        </p>
        <CodeBlock code={MERGE_FEED_CODE} />
      </div>
    </div>
  );
}
