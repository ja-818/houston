import { useEffect, useState } from "react";
import { InstructionsPanel } from "@houston-ai/workspace";
import type { InstructionFile } from "@houston-ai/workspace";
import { tauriWorkspace } from "../../lib/tauri";
import type { TabProps } from "../../lib/types";

const PROMPT_FILES: { name: string; label: string }[] = [
  { name: "CLAUDE.md", label: "CLAUDE.md" },
  {
    name: ".houston/prompts/system.md",
    label: "System Prompt",
  },
  {
    name: ".houston/prompts/self-improvement.md",
    label: "Self-Improvement",
  },
];

export default function ContextTab({ workspace }: TabProps) {
  const [files, setFiles] = useState<InstructionFile[]>([]);

  useEffect(() => {
    Promise.all(
      PROMPT_FILES.map(async ({ name, label }) => {
        const content = await tauriWorkspace
          .readFile(workspace.folderPath, name)
          .catch(() => "");
        return { name, label, content };
      }),
    ).then(setFiles);
  }, [workspace.folderPath]);

  const handleSave = async (name: string, content: string) => {
    await tauriWorkspace.writeFile(workspace.folderPath, name, content);
    setFiles((prev) =>
      prev.map((f) => (f.name === name ? { ...f, content } : f)),
    );
  };

  return (
    <InstructionsPanel
      files={files}
      onSave={handleSave}
      emptyTitle="No prompt files found"
      emptyDescription="Prompt files will be created when the workspace initializes."
    />
  );
}
