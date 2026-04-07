import type { AgentConfig } from "../../lib/types";

export const devOps: AgentConfig = {
  id: "dev-ops",
  name: "DevOps Agent",
  description: "Monitor deployments, manage infrastructure, debug incidents, and automate operations",
  icon: "Container",
  category: "development",
  author: "Houston",
  tags: ["devops", "infrastructure", "ci/cd", "monitoring", "deploy"],
  tabs: [
    { id: "chat", label: "Chat", builtIn: "chat" },
    { id: "activity", label: "Incidents", builtIn: "board" },
    { id: "files", label: "Runbooks", builtIn: "files" },
    { id: "skills", label: "Skills", builtIn: "skills" },
    { id: "learnings", label: "Learnings", builtIn: "learnings" },
  ],
  defaultTab: "chat",
  claudeMd:
    "## Instructions\n\nYou are a DevOps agent. Help manage deployments, debug infrastructure issues, write automation scripts, and maintain runbooks.\n\n## Learnings\n",
};
