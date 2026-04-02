import { useCallback, useEffect, useState } from "react";
import { AppSidebar, TabBar, SplitView } from "@deck-ui/layout";
import { ChatPanel } from "@deck-ui/chat";
import type { FeedItem } from "@deck-ui/chat";
import { FilesBrowser } from "@deck-ui/workspace";
import { InstructionsPanel } from "@deck-ui/workspace";
import type { FileEntry, InstructionFile } from "@deck-ui/workspace";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@deck-ui/core";
import { MessageSquare, Settings, Trash2 } from "lucide-react";
import { useUIStore, type ViewMode } from "./stores/ui";
import { useAgentStore } from "./stores/agents";
import { useFeedStore } from "./stores/feeds";
import { useSessionEvents } from "./hooks/use-session-events";
import { tauriSessions, tauriWorkspace } from "./lib/tauri";
import type { WorkspaceFileInfo } from "./lib/tauri";

const TABS = [
  { id: "files", label: "Files" },
  { id: "instructions", label: "Instructions" },
];

const MAIN_FEED_KEY = "main";

export function App() {
  const { viewMode, setViewMode, chatOpen, setChatOpen } = useUIStore();
  const { agents, currentAgent, ready, init, selectAgent, addAgent, deleteAgent } =
    useAgentStore();
  const feedItems = useFeedStore((s) => s.items);

  useSessionEvents();

  useEffect(() => {
    init();
  }, [init]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!currentAgent) return;
      try {
        await tauriSessions.start(currentAgent.id, text);
      } catch (e) {
        console.error("Failed to start session:", e);
      }
    },
    [currentAgent],
  );

  if (!ready) return null;

  const chatButton = (
    <button
      onClick={() => setChatOpen(!chatOpen)}
      className="inline-flex items-center gap-1.5 rounded-full h-9 px-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      <MessageSquare className="size-4" />
      Chat
    </button>
  );

  const settingsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Settings className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => currentAgent && deleteAgent(currentAgent.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4 mr-2" />
          Delete Agent
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const mainContent = (
    <div className="flex flex-col flex-1 min-h-0">
      <TabBar
        title={currentAgent?.name ?? "No agent"}
        tabs={TABS}
        activeTab={viewMode}
        onTabChange={(id) => setViewMode(id as ViewMode)}
        actions={
          <div className="flex items-center gap-1">
            {settingsMenu}
            {chatButton}
          </div>
        }
      />
      <div className="flex-1 min-h-0 overflow-auto">
        {viewMode === "files" && <FilesTab />}
        {viewMode === "instructions" && <InstructionsTab />}
      </div>
    </div>
  );

  const chatPanel = (
    <ChatPanel
      sessionKey={MAIN_FEED_KEY}
      feedItems={feedItems[MAIN_FEED_KEY] ?? []}
      isLoading={false}
      onSend={handleSend}
      placeholder="Ask your agent anything..."
      emptyState={
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>Start a conversation</EmptyTitle>
            <EmptyDescription>
              Type a message to talk to your agent.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  );

  return (
    <div className="h-screen flex bg-background text-foreground">
      <AppSidebar
        logo={<span className="text-sm font-semibold">{{APP_NAME_TITLE}}</span>}
        items={agents.map((a) => ({ id: a.id, name: a.name }))}
        selectedId={currentAgent?.id}
        onSelect={selectAgent}
        onAdd={addAgent}
        sectionLabel="Your agents"
      >
        {chatOpen ? (
          <SplitView left={mainContent} right={chatPanel} />
        ) : (
          <div className="flex-1 flex flex-col min-h-0">{mainContent}</div>
        )}
      </AppSidebar>
    </div>
  );
}

function FilesTab() {
  const currentAgent = useAgentStore((s) => s.currentAgent);
  // TODO: Wire to tauriWorkspace or a file listing command
  // For now, show empty state
  return (
    <FilesBrowser
      files={[]}
      emptyTitle="Your work shows up here"
      emptyDescription="When your agent creates files, they'll appear here for you to open and review."
    />
  );
}

function InstructionsTab() {
  const currentAgent = useAgentStore((s) => s.currentAgent);
  const [files, setFiles] = useState<InstructionFile[]>([]);

  useEffect(() => {
    if (!currentAgent) return;
    tauriWorkspace.listFiles(currentAgent.id).then(async (infos) => {
      const loaded: InstructionFile[] = [];
      for (const info of infos.filter((f: WorkspaceFileInfo) => f.exists)) {
        try {
          const content = await tauriWorkspace.readFile(currentAgent.id, info.name);
          loaded.push({ name: info.name, label: info.name, content });
        } catch {
          /* skip unreadable files */
        }
      }
      setFiles(loaded);
    });
  }, [currentAgent]);

  return (
    <InstructionsPanel
      files={files}
      onSave={async (name, content) => {
        // TODO: Wire to a write_workspace_file Tauri command
        console.log("Save:", name, content.length, "chars");
      }}
      emptyTitle="No instructions yet"
      emptyDescription="Add a CLAUDE.md to this agent's workspace to configure how it behaves."
    />
  );
}
