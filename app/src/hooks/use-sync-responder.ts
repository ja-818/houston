/**
 * Self-contained sync responder. Listens for sync messages from the mobile
 * companion and responds by fetching data directly from Tauri commands.
 * Also forwards real-time feed items to the phone.
 *
 * Mount at the app root (Sidebar) so it's always active.
 */

import { useEffect } from "react";
import { tauriSync, tauriConversations, tauriChat } from "../lib/tauri";
import { emitOsEvent, listenOsEvent, subscribeHoustonEvents } from "../lib/events";
import { useAgentStore } from "../stores/agents";
import { useWorkspaceStore } from "../stores/workspaces";
import { useFeedStore } from "../stores/feeds";
import { logger } from "../lib/logger";
import { createMission } from "../lib/create-mission";
import type { HoustonEvent } from "@houston-ai/core";
import {
  SYNC_MSG_TYPES,
  nowIso,
  sessionKeyForActivity,
  type AgentNameEntry,
  type ConnectionPayload,
  type Conversation,
  type CreateMissionPayload,
  type FeedItem,
  type RequestChatHistoryPayload,
  type SendMessagePayload,
  type SyncMessage,
} from "@houston-ai/sync-protocol";

/** Whether a mobile companion is currently connected */
let mobileConnected = false;

function sendToMobile(type: string, payload: unknown): void {
  if (!mobileConnected) return;
  tauriSync.send({
    type,
    from: "desktop",
    ts: nowIso(),
    payload,
  }).catch(() => {});
}

// -- Data fetchers --

async function getConversationAgentPath(convoId: string): Promise<string | null> {
  const agents = useAgentStore.getState().agents;
  const paths = agents.map((a) => a.folderPath);
  try {
    const convos = await tauriConversations.listAll(paths);
    const convo = convos.find((c) => c.id === convoId);
    return convo?.agent_path ?? null;
  } catch {
    return null;
  }
}

async function fetchAndSendAgentList(): Promise<void> {
  const agents = useAgentStore.getState().agents;
  const workspace = useWorkspaceStore.getState().current;
  const paths = agents.map((a) => a.folderPath);

  const agentByPath: Record<string, { name: string; color?: string }> = {};
  for (const a of agents) agentByPath[a.folderPath] = { name: a.name, color: a.color };

  const agentNames: AgentNameEntry[] = agents.map((a) => ({ id: a.id, name: a.name }));
  const conversations: Conversation[] = [];

  if (paths.length > 0) {
    try {
      const convos = await tauriConversations.listAll(paths);
      for (const c of convos) {
        if (c.type === "activity" && c.status) {
          const agent = agentByPath[c.agent_path];
          conversations.push({
            id: c.id,
            title: c.title,
            description: c.description,
            agentName: agent?.name ?? c.agent_name,
            agentColor: agent?.color,
            status: c.status,
            updatedAt: c.updated_at ?? nowIso(),
            agentPath: c.agent_path,
          });
        }
      }
    } catch (e) {
      logger.error(`[sync] fetch conversations failed: ${e}`);
    }
  }

  sendToMobile(SYNC_MSG_TYPES.AGENT_LIST, {
    workspaceName: workspace?.name ?? "Workspace",
    conversations,
    agentNames,
  });
}

async function handleChatHistory(agentId: string, sessionKey: string): Promise<void> {
  // In-memory first
  const allItems = useFeedStore.getState().items;
  for (const bucket of Object.values(allItems)) {
    const cached = bucket[sessionKey];
    if (cached && cached.length > 0) {
      sendToMobile(SYNC_MSG_TYPES.CHAT_HISTORY, {
        agentId,
        sessionKey,
        feedItems: cached as FeedItem[],
      });
      return;
    }
  }

  // From disk
  const agentPath = await getConversationAgentPath(agentId);
  if (!agentPath) return;
  try {
    const history = await tauriChat.loadHistory(agentPath, sessionKeyForActivity(agentId));
    sendToMobile(SYNC_MSG_TYPES.CHAT_HISTORY, {
      agentId,
      sessionKey,
      feedItems: history as FeedItem[],
    });
  } catch (e) {
    logger.error(`[sync] load history failed: ${e}`);
  }
}

async function handleSendMessage(agentId: string, sessionKey: string, text: string): Promise<void> {
  const agentPath = await getConversationAgentPath(agentId);
  if (!agentPath) {
    logger.error(`[sync] No agent path for convo ${agentId}`);
    return;
  }

  // Claude's session machinery writes the user_message to the feed store via
  // the normal streaming path, identical to desktop-originated sends. Pushing
  // it here too would cause the mobile to see the message three times
  // (optimistic + this push echoed back + the Claude stream echo).
  logger.info(`[sync] Sending message from mobile: ${text.slice(0, 50)}...`);
  tauriChat.send(agentPath, text, sessionKey).catch((e) =>
    logger.error(`[sync] send failed: ${e}`),
  );
}

function handleCreateMission(p: CreateMissionPayload): void {
  const agent = useAgentStore.getState().agents.find((a) => a.id === p.agentId);
  if (!agent) {
    sendToMobile(SYNC_MSG_TYPES.MISSION_ERROR, {
      msgId: p.msgId,
      message: `Agent ${p.agentId} not found`,
    });
    return;
  }
  createMission(agent, p.text)
    .then((result) => {
      sendToMobile(SYNC_MSG_TYPES.MISSION_CREATED, {
        msgId: p.msgId,
        conversationId: result.conversationId,
        sessionKey: result.sessionKey,
        conversation: result.conversation,
      });
      // Push a fresh conversation list so the phone's list updates.
      return fetchAndSendAgentList();
    })
    .catch((e) => {
      logger.error(`[sync] create_mission failed: ${e}`);
      sendToMobile(SYNC_MSG_TYPES.MISSION_ERROR, {
        msgId: p.msgId,
        message:
          typeof e === "string"
            ? e
            : e instanceof Error
              ? e.message
              : "Failed to create mission",
      });
    });
}

/**
 * Mount once at the app root.
 */
export function useSyncResponder(): void {
  useEffect(() => {
    // 1) Listen for sync messages from mobile (via relay).
    // Backed by Tauri `emit("sync-message", ...)` today — engine path not yet wired.
    const unlistenSync = listenOsEvent<SyncMessage>("sync-message", (msg) => {
      switch (msg.type) {
        case SYNC_MSG_TYPES.PEER_CONNECTED:
          mobileConnected = true;
          fetchAndSendAgentList();
          // Surface phone-connected state to the QR dialog.
          emitOsEvent("sync-connection", { state: "connected" } satisfies ConnectionPayload).catch(
            () => {},
          );
          break;

        case SYNC_MSG_TYPES.PEER_DISCONNECTED:
          mobileConnected = false;
          emitOsEvent("sync-connection", { state: "disconnected" } satisfies ConnectionPayload).catch(
            () => {},
          );
          break;

        case SYNC_MSG_TYPES.CONNECTION: {
          // Re-emit dedicated Tauri event for UI layers (QR dialog) that
          // only care about the connection state, not the full sync stream.
          const p = msg.payload as ConnectionPayload;
          emitOsEvent("sync-connection", p).catch(() => {});
          break;
        }

        case SYNC_MSG_TYPES.REQUEST_AGENTS:
          fetchAndSendAgentList();
          break;

        case SYNC_MSG_TYPES.REQUEST_CHAT_HISTORY: {
          const p = msg.payload as RequestChatHistoryPayload;
          handleChatHistory(p.agentId, p.sessionKey);
          break;
        }

        case SYNC_MSG_TYPES.SEND_MESSAGE: {
          // `msgId` is required by the new payload type but is only meaningful
          // to the mobile client for dedupe; desktop just routes the text.
          const p = msg.payload as SendMessagePayload;
          handleSendMessage(p.agentId, p.sessionKey, p.text);
          break;
        }

        case SYNC_MSG_TYPES.CREATE_MISSION: {
          const p = msg.payload as CreateMissionPayload;
          handleCreateMission(p);
          break;
        }
      }
    });

    // 2) Forward real-time houston events to mobile
    const unlistenEvents = subscribeHoustonEvents((payload: HoustonEvent) => {
      if (!mobileConnected) return;

      switch (payload.type) {
        case "FeedItem":
          sendToMobile(SYNC_MSG_TYPES.FEED_ITEM, {
            agentId: payload.data.agent_path,
            sessionKey: payload.data.session_key,
            item: payload.data.item,
          });
          break;

        case "SessionStatus":
          sendToMobile(SYNC_MSG_TYPES.SESSION_STATUS, {
            agentId: payload.data.agent_path,
            sessionKey: payload.data.session_key,
            status: payload.data.status,
          });
          // Refresh conversation list when status changes
          fetchAndSendAgentList();
          break;

        case "ActivityChanged":
        case "ConversationsChanged":
          // Refresh conversation list
          fetchAndSendAgentList();
          break;
      }
    });

    return () => {
      unlistenSync();
      unlistenEvents();
      mobileConnected = false;
    };
  }, []);
}
