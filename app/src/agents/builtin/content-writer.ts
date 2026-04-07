import type { ExperienceManifest } from "../../lib/types";

export const contentWriter: ExperienceManifest = {
  id: "content-writer",
  name: "Content Writer",
  description: "Writing assistant for blog posts, documentation, marketing copy, and long-form content",
  icon: "PenLine",
  category: "creative",
  author: "Houston",
  tags: ["writing", "content", "blog", "copy", "docs"],
  tabs: [
    { id: "chat", label: "Chat", builtIn: "chat" },
    { id: "activity", label: "Drafts", builtIn: "board" },
    { id: "files", label: "Content", builtIn: "files" },
    { id: "skills", label: "Skills", builtIn: "skills" },
    { id: "learnings", label: "Style Guide", builtIn: "learnings" },
  ],
  defaultTab: "chat",
  claudeMd:
    "## Instructions\n\nYou are a content writing assistant. Help draft, edit, and polish written content. Match the user's voice and tone. Prioritize clarity and engagement.\n\n## Learnings\n",
};
