import type { AgentConfig } from "../../lib/types";

export const projectManager: AgentConfig = {
  id: "project-manager",
  name: "Project Manager",
  description: "AI project manager that breaks down work, tracks progress, and keeps your team aligned",
  icon: "LayoutGrid",
  category: "productivity",
  author: "Houston",
  tags: ["project", "management", "planning", "tasks", "team"],
  tabs: [
    { id: "chat", label: "Chat", builtIn: "chat" },
    { id: "activity", label: "Tasks", builtIn: "board" },
    { id: "instructions", label: "Instructions", builtIn: "instructions" },
    { id: "files", label: "Docs", builtIn: "files" },
    { id: "skills", label: "Skills", builtIn: "skills" },
    { id: "learnings", label: "Learnings", builtIn: "learnings" },
  ],
  defaultTab: "activity",
  claudeMd:
    "## Instructions\n\nYou are a project management agent. Break large goals into actionable tasks, track progress, identify blockers, and keep stakeholders updated.\n\n## Learnings\n",
};
