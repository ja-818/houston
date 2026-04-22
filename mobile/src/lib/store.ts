import { create } from "zustand";
import type {
  FeedItem,
  Conversation,
  AgentNameEntry,
  ConnectionState,
} from "./types";

/** Trailing optimistic-send buffer used to dedupe echoed user messages. */
export interface OptimisticUserMessage {
  msgId: string;
  text: string;
  sentAt: number;
}

const OPTIMISTIC_CAP = 20;
const OPTIMISTIC_TTL_MS = 15_000;

interface MobileState {
  // Connection
  connectionState: ConnectionState;
  pairingUrl: string | null;

  // Data from desktop
  workspaceName: string;
  conversations: Conversation[];
  agentNames: AgentNameEntry[];

  // Current view
  currentConvoId: string | null;
  chatHistory: FeedItem[];

  // Filters
  agentFilter: string;

  // Optimistic-send dedupe buffer (mobile-initiated user messages)
  optimisticUserMessages: OptimisticUserMessage[];

  // Actions
  setConnectionState: (state: ConnectionState) => void;
  setPairingUrl: (url: string) => void;
  setConversations: (convos: Conversation[]) => void;
  setAgentNames: (names: AgentNameEntry[]) => void;
  setWorkspaceName: (name: string) => void;
  setCurrentConvo: (id: string | null) => void;
  setChatHistory: (items: FeedItem[]) => void;
  appendFeedItem: (item: FeedItem) => void;
  setAgentFilter: (filter: string) => void;
  pushOptimisticMessage: (msg: OptimisticUserMessage) => void;
  removeOptimisticMessage: (msgId: string) => void;

  // Computed
  currentConvo: () => Conversation | undefined;
  filteredConversations: () => Conversation[];
  isConnected: () => boolean;
}

/** Drop expired entries and enforce the 20-item cap. */
function gcOptimistic(
  list: OptimisticUserMessage[],
): OptimisticUserMessage[] {
  const cutoff = Date.now() - OPTIMISTIC_TTL_MS;
  const live = list.filter((m) => m.sentAt >= cutoff);
  if (live.length <= OPTIMISTIC_CAP) return live;
  return live.slice(live.length - OPTIMISTIC_CAP);
}

export const useMobileStore = create<MobileState>((set, get) => ({
  connectionState: "disconnected",
  pairingUrl: null,

  workspaceName: "",
  conversations: [],
  agentNames: [],

  currentConvoId: null,
  chatHistory: [],

  agentFilter: "all",
  optimisticUserMessages: [],

  setConnectionState: (state) => set({ connectionState: state }),
  setPairingUrl: (url) => set({ pairingUrl: url }),
  setConversations: (conversations) => set({ conversations }),
  setAgentNames: (agentNames) => set({ agentNames }),
  setWorkspaceName: (name) => set({ workspaceName: name }),
  setCurrentConvo: (id) => set({ currentConvoId: id }),
  setChatHistory: (items) => set({ chatHistory: items }),
  appendFeedItem: (item) =>
    set((s) => ({ chatHistory: [...s.chatHistory, item] })),
  setAgentFilter: (filter) => set({ agentFilter: filter }),

  pushOptimisticMessage: (msg) =>
    set((s) => ({
      optimisticUserMessages: gcOptimistic([...s.optimisticUserMessages, msg]),
    })),

  removeOptimisticMessage: (msgId) =>
    set((s) => ({
      optimisticUserMessages: gcOptimistic(
        s.optimisticUserMessages.filter((m) => m.msgId !== msgId),
      ),
    })),

  currentConvo: () => {
    const { conversations, currentConvoId } = get();
    return conversations.find((c) => c.id === currentConvoId);
  },

  filteredConversations: () => {
    const { conversations, agentFilter } = get();
    if (agentFilter === "all") return conversations;
    return conversations.filter((c) => c.agentName === agentFilter);
  },

  isConnected: () => get().connectionState === "connected",
}));
