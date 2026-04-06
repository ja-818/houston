import { lazy, type ComponentType } from "react";
import type { ExperienceTab, Experience, TabProps } from "../lib/types";
import ChatTab from "../components/tabs/chat-tab";
import BoardTab from "../components/tabs/board-tab";
import SkillsTab from "../components/tabs/skills-tab";
import LearningsTab from "../components/tabs/learnings-tab";
import FilesTab from "../components/tabs/files-tab";
import ConnectionsTab from "../components/tabs/connections-tab";
import ContextTab from "../components/tabs/context-tab";
import RoutinesTab from "../components/tabs/routines-tab";
import ChannelsTab from "../components/tabs/channels-tab";
import EventsTab from "../components/tabs/events-tab";

const BUILTIN_TABS: Record<string, ComponentType<TabProps>> = {
  chat: ChatTab,
  board: BoardTab,
  skills: SkillsTab,
  learnings: LearningsTab,
  files: FilesTab,
  connections: ConnectionsTab,
  context: ContextTab,
  routines: RoutinesTab,
  channels: ChannelsTab,
  events: EventsTab,
};

// Cache for custom bundle components so they're not re-created on every render
const bundleCache = new Map<string, ComponentType<TabProps>>();

export function resolveTabComponent(
  tab: ExperienceTab,
  experience: Experience,
): ComponentType<TabProps> {
  // Built-in tab — eager, no loading delay
  if (tab.builtIn && BUILTIN_TABS[tab.builtIn]) {
    return BUILTIN_TABS[tab.builtIn];
  }

  // Custom component from bundle (tier 2) — lazy with cache
  if (tab.customComponent && experience.bundleUrl) {
    const cacheKey = `${experience.bundleUrl}:${tab.customComponent}`;
    if (!bundleCache.has(cacheKey)) {
      const component = lazy(async () => {
        const module = await import(/* @vite-ignore */ experience.bundleUrl!);
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
