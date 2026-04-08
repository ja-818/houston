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
import { useUIStore } from "../../stores/ui";
import { tauriChat, tauriAttachments, withAttachmentPaths } from "../../lib/tauri";
import { useFileToolRenderer } from "../../hooks/use-file-tool-renderer";
import type { TabProps } from "../../lib/types";

export default function ChatTab({ agent }: TabProps) {
  const { isSpecialTool, renderToolResult, renderTurnSummary } = useFileToolRenderer(agent.folderPath);
  // Session key is agent-scoped to prevent cross-agent event bleeding
  const sessionKey = agent.id;
  // Attachments scope: keyed by agent so they survive restarts and are
  // wiped only when the agent is deleted.
  const attachmentScope = `agent-${agent.id}`;
  const feedItems = useFeedStore((s) => s.items[sessionKey]);
  const pushFeedItem = useFeedStore((s) => s.pushFeedItem);
  const setFeed = useFeedStore((s) => s.setFeed);
  const clearFeed = useFeedStore((s) => s.clearFeed);
  const addToast = useUIStore((s) => s.addToast);
  const handleNotice = useCallback(
    (message: string) => addToast({ title: message }),
    [addToast],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [composerFiles, setComposerFiles] = useState<File[]>([]);
  const sendingRef = useRef(false);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (loadedRef.current === agent.id) return;
    loadedRef.current = agent.id;
    clearFeed(sessionKey);
    setComposerText("");
    setComposerFiles([]);
    tauriChat.loadHistory(agent.folderPath, sessionKey).then((rows) => {
      if (rows.length > 0) setFeed(sessionKey, rows as FeedItem[]);
    });
  }, [agent.id, sessionKey, setFeed, clearFeed, agent.folderPath]);

  const handleStop = useCallback(() => {
    tauriChat.stop(sessionKey).catch(console.error);
  }, [sessionKey]);

  const handleSend = useCallback(
    async (text: string, files: File[]) => {
      if (sendingRef.current) return;
      sendingRef.current = true;
      setIsLoading(true);
      // Visible user message includes the file names so the user sees what
      // they sent; the path block goes into the prompt only.
      const visible = files.length > 0
        ? `${text}${text ? "\n\n" : ""}Attached: ${files.map((f) => f.name).join(", ")}`
        : text;
      pushFeedItem(sessionKey, { feed_type: "user_message", data: visible });
      // Clear composer immediately so the user sees the send.
      setComposerText("");
      setComposerFiles([]);
      try {
        const paths = await tauriAttachments.save(attachmentScope, files);
        const prompt = withAttachmentPaths(text, paths);
        await tauriChat.send(agent.folderPath, prompt, sessionKey);
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
    [agent.folderPath, sessionKey, attachmentScope, pushFeedItem],
  );

  return (
    <div className="h-full w-full flex flex-col">
      <ChatPanel
        sessionKey={sessionKey}
        feedItems={feedItems ?? []}
        isLoading={isLoading}
        onSend={handleSend}
        onStop={handleStop}
        isSpecialTool={isSpecialTool}
        renderToolResult={renderToolResult}
        renderTurnSummary={renderTurnSummary}
        placeholder="Ask anything..."
        value={composerText}
        onValueChange={setComposerText}
        attachments={composerFiles}
        onAttachmentsChange={setComposerFiles}
        onNotice={handleNotice}
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
