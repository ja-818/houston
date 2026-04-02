export interface ScreenItem {
  id: string;
  label: string;
}

export const SCREENS: ScreenItem[] = [
  { id: "chat", label: "Chat" },
  { id: "kanban", label: "Kanban" },
  { id: "files", label: "Files" },
  { id: "instructions", label: "Instructions" },
  { id: "channels", label: "Channels" },
  { id: "connections", label: "Connections" },
  { id: "events", label: "Events" },
  { id: "memory", label: "Memory" },
  { id: "routines", label: "Routines" },
  { id: "layout", label: "Layout" },
];

export const PRIMITIVES: ScreenItem[] = [
  { id: "button", label: "Button" },
  { id: "badge", label: "Badge" },
  { id: "card", label: "Card" },
  { id: "input", label: "Input" },
  { id: "dialog", label: "Dialog" },
  { id: "empty", label: "Empty" },
  { id: "separator", label: "Separator" },
  { id: "stepper", label: "Stepper" },
];
