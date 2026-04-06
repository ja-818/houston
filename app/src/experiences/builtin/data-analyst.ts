import type { ExperienceManifest } from "../../lib/types";

export const dataAnalyst: ExperienceManifest = {
  id: "data-analyst",
  name: "Data Analyst",
  description: "Analyze datasets, generate insights, create visualizations, and build reports from your data",
  icon: "BarChart3",
  category: "research",
  author: "Houston",
  tags: ["data", "analysis", "visualization", "reports", "csv"],
  tabs: [
    { id: "chat", label: "Chat", builtIn: "chat" },
    { id: "tasks", label: "Analyses", builtIn: "board" },
    { id: "files", label: "Data", builtIn: "files" },
    { id: "skills", label: "Skills", builtIn: "skills" },
    { id: "learnings", label: "Learnings", builtIn: "learnings" },
  ],
  defaultTab: "chat",
  claudeMd:
    "## Instructions\n\nYou are a data analysis agent. When given data or questions about data, perform thorough analysis, generate insights, and produce clear visualizations and summaries.\n\n## Learnings\n",
};
