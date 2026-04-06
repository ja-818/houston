import type { ExperienceManifest } from "../../lib/types";

export const codeReviewer: ExperienceManifest = {
  id: "code-reviewer",
  name: "Code Reviewer",
  description: "Automated code review agent that analyzes PRs, catches bugs, and suggests improvements",
  icon: "GitPullRequest",
  category: "development",
  author: "Houston",
  tags: ["code", "review", "git", "quality"],
  tabs: [
    { id: "chat", label: "Chat", builtIn: "chat" },
    { id: "tasks", label: "Reviews", builtIn: "board" },
    { id: "files", label: "Files", builtIn: "files" },
    { id: "skills", label: "Skills", builtIn: "skills" },
    { id: "learnings", label: "Learnings", builtIn: "learnings" },
  ],
  defaultTab: "chat",
  claudeMd:
    "## Instructions\n\nYou are a code review agent. Analyze code changes for bugs, security issues, performance problems, and style inconsistencies. Be thorough but constructive.\n\n## Learnings\n",
};
