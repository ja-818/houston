export interface GroupItem {
  id: string;
  label: string;
}

export interface Group {
  label: string;
  items: GroupItem[];
}

export const GROUPS: Group[] = [
  {
    label: "Core",
    items: [
      { id: "button", label: "Button" },
      { id: "badge", label: "Badge" },
      { id: "card", label: "Card" },
      { id: "input", label: "Input" },
      { id: "dialog", label: "Dialog" },
      { id: "empty", label: "Empty" },
      { id: "separator", label: "Separator" },
    ],
  },
  {
    label: "Board",
    items: [{ id: "kanban-board", label: "KanbanBoard" }],
  },
  {
    label: "Chat",
    items: [
      { id: "chat-panel", label: "ChatPanel" },
      { id: "channel-avatar", label: "ChannelAvatar + Utilities" },
    ],
  },
  {
    label: "Events",
    items: [{ id: "event-feed", label: "EventFeed" }],
  },
  {
    label: "Memory",
    items: [{ id: "memory-browser", label: "MemoryBrowser" }],
  },
  {
    label: "Routines",
    items: [
      { id: "routines-grid", label: "RoutinesGrid" },
      { id: "heartbeat-config", label: "HeartbeatConfig" },
      { id: "schedule-builder", label: "ScheduleBuilder" },
    ],
  },
  {
    label: "Connections",
    items: [
      { id: "connections-view", label: "ConnectionsView" },
      { id: "channel-setup-form", label: "ChannelSetupForm" },
    ],
  },
  {
    label: "Layout",
    items: [
      { id: "tab-bar", label: "TabBar" },
      { id: "split-view", label: "SplitView" },
      { id: "app-sidebar", label: "AppSidebar" },
    ],
  },
];
