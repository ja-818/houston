import { lazy, type ComponentType } from "react";
import type { AgentTab, AgentDefinition, TabProps } from "../lib/types";
import ChatTab from "../components/tabs/chat-tab";
import BoardTab from "../components/tabs/board-tab";
import FilesTab from "../components/tabs/files-tab";
import ConnectionsTab from "../components/tabs/connections-tab";
import IntegrationsTab from "../components/tabs/integrations-tab";
import JobDescriptionTab from "../components/tabs/job-description-tab";
import RoutinesTab from "../components/tabs/routines-tab";
import EventsTab from "../components/tabs/events-tab";

const BUILTIN_TABS: Record<string, ComponentType<TabProps>> = {
  chat: ChatTab,
  board: BoardTab,
  files: FilesTab,
  integrations: IntegrationsTab,
  connections: ConnectionsTab,
  "job-description": JobDescriptionTab,
  routines: RoutinesTab,
  events: EventsTab,
};

// Cache for custom bundle components so they're not re-created on every render
const bundleCache = new Map<string, ComponentType<TabProps>>();

export function resolveTabComponent(
  tab: AgentTab,
  agentDef: AgentDefinition,
): ComponentType<TabProps> {
  // Built-in tab — eager, no loading delay
  if (tab.builtIn && BUILTIN_TABS[tab.builtIn]) {
    return BUILTIN_TABS[tab.builtIn];
  }

  // Custom component from bundle (tier 2) — lazy with cache
  if (tab.customComponent && agentDef.bundleUrl) {
    const cacheKey = `${agentDef.bundleUrl}:${tab.customComponent}`;
    if (!bundleCache.has(cacheKey)) {
      const component = lazy(async () => {
        const module = await import(/* @vite-ignore */ agentDef.bundleUrl!);
        const Component = module[tab.customComponent!];
        if (!Component) throw new Error(`Bundle does not export "${tab.customComponent}"`);
        return { default: Component };
      });
      bundleCache.set(cacheKey, component);
    }
    return bundleCache.get(cacheKey)!;
  }

  // Fallback
  return BUILTIN_TABS.chat;
}
