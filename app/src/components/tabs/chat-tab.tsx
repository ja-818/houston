import { useEffect, useCallback, useRef, useState } from "react";
import { ChatPanel } from "@houston-ai/chat";
import type { FeedItem } from "@houston-ai/chat";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@houston-ai/core";
import { useFeedStore } from "../../stores/feeds";
import { tauriChat } from "../../lib/tauri";
import type { TabProps } from "../../lib/types";

export default function ChatTab({ workspace }: TabProps) {
  // Session key is workspace-scoped to prevent cross-workspace event bleeding
  const sessionKey = workspace.id;
  const feedItems = useFeedStore((s) => s.items[sessionKey]);
  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);
  const setFeed = useFeedStore((s) => s.setFeed);
  const clearFeed = useFeedStore((s) => s.clearFeed);
  const [isLoading, setIsLoading] = useState(false);
  const sendingRef = useRef(false);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (loadedRef.current === workspace.id) return;
    loadedRef.current = workspace.id;
    clearFeed(sessionKey);
    tauriChat.loadHistory(workspace.folderPath, sessionKey).then((rows) => {
      if (rows.length > 0) setFeed(sessionKey, rows as FeedItem[]);
    });
  }, [workspace.id, sessionKey, setFeed, clearFeed, workspace.folderPath]);

  const handleSend = useCallback(
    async (text: string) => {
      if (sendingRef.current) return;
      sendingRef.current = true;
      setIsLoading(true);
      pushFeedItem(sessionKey, { feed_type: "user_message", data: text });
      try {
        await tauriChat.send(workspace.folderPath, text, sessionKey);
      } catch (err) {
        pushFeedItem(sessionKey, {
          feed_type: "system_message",
          data: `Failed to start session: ${err}`,
        });
      } finally {
        setIsLoading(false);
        sendingRef.current = false;
      }
    },
    [workspace.folderPath, sessionKey, pushFeedItem],
  );

  return (
    <div className="h-full w-full flex flex-col">
      <ChatPanel
        sessionKey={sessionKey}
        feedItems={feedItems ?? []}
        isLoading={isLoading}
        onSend={handleSend}
        placeholder="Ask anything..."
        emptyState={
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>Start a conversation</EmptyTitle>
              <EmptyDescription>
                Type a message to talk to your assistant.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />
    </div>
  );
}
