import type { AgentConfig } from "../../lib/types";

export const defaultExperience: AgentConfig = {
  id: "default",
  name: "AI Assistant",
  description: "Chat with an AI assistant that can manage tasks, skills, and files",
  icon: "Bot",
  category: "productivity",
  author: "Houston",
  tags: ["general", "assistant", "activity"],
  tabs: [
    { id: "activity", label: "Activity", builtIn: "board" },
    { id: "files", label: "Files", builtIn: "files" },
    { id: "learnings", label: "Learnings", builtIn: "learnings" },
    { id: "connections", label: "Connections", builtIn: "connections" },
    { id: "skills", label: "Skills", builtIn: "skills" },
    { id: "instructions", label: "Instructions", builtIn: "instructions" },
  ],
  defaultTab: "activity",
  claudeMd: "## Instructions\n\nYou are a helpful AI assistant.\n\n## Learnings\n",
};
