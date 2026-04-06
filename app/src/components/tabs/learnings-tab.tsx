import { useState, useEffect, useCallback } from "react";
import { LearningsPanel } from "@houston-ai/memory";
import type { LearningEntry } from "@houston-ai/memory";
import { ContentArea } from "../shell/content-area";
import { tauriLearnings } from "../../lib/tauri";
import type { TabProps } from "../../lib/types";

export default function LearningsTab({ workspace }: TabProps) {
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const path = workspace.folderPath;

  const load = useCallback(async () => {
    try {
      const result = await tauriLearnings.load(path);
      setEntries(result.entries);
    } catch (e) {
      console.error("[learnings] Failed to load:", e);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (text: string) => {
    try {
      await tauriLearnings.add(path, text);
      await load();
    } catch (e) {
      console.error("[learnings] Failed to add entry:", e);
    }
  };

  const handleRemove = async (index: number) => {
    try {
      await tauriLearnings.remove(path, index);
      await load();
    } catch (e) {
      console.error("[learnings] Failed to remove entry:", e);
    }
  };

  return (
    <ContentArea centered>
      <LearningsPanel
        entries={entries}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />
    </ContentArea>
  );
}
