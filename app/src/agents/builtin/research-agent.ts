import type { ExperienceManifest } from "../../lib/types";

export const researchAgent: ExperienceManifest = {
  id: "research-agent",
  name: "Research Agent",
  description: "Deep research assistant that investigates topics, synthesizes findings, and produces structured reports",
  icon: "Search",
  category: "research",
  author: "Houston",
  tags: ["research", "analysis", "reports", "web"],
  tabs: [
    { id: "chat", label: "Chat", builtIn: "chat" },
    { id: "activity", label: "Research", builtIn: "board" },
    { id: "files", label: "Notes", builtIn: "files" },
    { id: "skills", label: "Skills", builtIn: "skills" },
    { id: "learnings", label: "Learnings", builtIn: "learnings" },
  ],
  defaultTab: "chat",
  claudeMd:
    "## Instructions\n\nYou are a research agent. When given a topic, break it into sub-questions, investigate each thoroughly, and produce a structured report with citations.\n\n## Learnings\n",
};
