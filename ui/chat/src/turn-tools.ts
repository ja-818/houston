import type { ChatStatus } from "./chat-panel-types";
import type { ChatMessage, ToolEntry } from "./feed-to-messages";

export function computeTurnEndTools(
  messages: ChatMessage[],
  status: ChatStatus,
): Map<number, ToolEntry[]> {
  const result = new Map<number, ToolEntry[]>();
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.from !== "assistant") continue;
    const next = messages[i + 1];
    const isEndOfTurn = next ? next.from !== "assistant" : status === "ready";
    if (!isEndOfTurn) continue;
    const tools: ToolEntry[] = [];
    for (let j = i; j >= 0; j--) {
      const m = messages[j];
      if (m.from !== "assistant") break;
      tools.unshift(...m.tools);
    }
    result.set(i, tools);
  }
  return result;
}
