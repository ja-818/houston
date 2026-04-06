import type { ExperienceManifest } from "../../lib/types";

export const defaultExperience: ExperienceManifest = {
  id: "default",
  name: "AI Assistant",
  description: "Chat with an AI assistant that can manage tasks, skills, and files",
  icon: "Bot",
  tabs: [
    { id: "chat", label: "Chat", builtIn: "chat" },
    { id: "tasks", label: "Tasks", builtIn: "board" },
    { id: "context", label: "Context", builtIn: "context" },
    { id: "skills", label: "Skills", builtIn: "skills" },
    { id: "learnings", label: "Learnings", builtIn: "learnings" },
    { id: "files", label: "Files", builtIn: "files" },
    { id: "channels", label: "Channels", builtIn: "channels" },
  ],
  defaultTab: "chat",
  claudeMd: "## Instructions\n\nYou are a helpful AI assistant.\n\n## Learnings\n",
};
