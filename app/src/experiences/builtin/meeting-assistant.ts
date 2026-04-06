import type { ExperienceManifest } from "../../lib/types";

export const meetingAssistant: ExperienceManifest = {
  id: "meeting-assistant",
  name: "Meeting Assistant",
  description: "Summarize meetings, extract action items, draft follow-ups, and keep everyone accountable",
  icon: "Users",
  category: "productivity",
  author: "Houston",
  tags: ["meetings", "notes", "action items", "follow-up"],
  tabs: [
    { id: "chat", label: "Chat", builtIn: "chat" },
    { id: "tasks", label: "Actions", builtIn: "board" },
    { id: "files", label: "Notes", builtIn: "files" },
    { id: "skills", label: "Skills", builtIn: "skills" },
    { id: "learnings", label: "Learnings", builtIn: "learnings" },
  ],
  defaultTab: "chat",
  claudeMd:
    "## Instructions\n\nYou are a meeting assistant. When given meeting notes or transcripts, extract key decisions, action items with owners, and draft follow-up messages.\n\n## Learnings\n",
};
