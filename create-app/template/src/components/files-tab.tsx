import { useState, useEffect, useCallback } from "react";
import { FilesBrowser } from "@deck-ui/workspace";
import type { FileEntry } from "@deck-ui/workspace";
import { tauriFiles } from "../lib/tauri";

interface FilesTabProps {
  workspacePath: string;
}

export function FilesTab({ workspacePath }: FilesTabProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await tauriFiles.list(workspacePath);
      setFiles(result);
    } catch (e) {
      console.error("[files] Failed to load:", e);
    } finally {
      setLoading(false);
    }
  }, [workspacePath]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  return (
    <FilesBrowser
      files={files}
      loading={loading}
      selectedPath={selectedPath}
      onSelect={(file) => setSelectedPath(file.path)}
      onOpen={(file) => tauriFiles.open(workspacePath, file.path)}
      onReveal={(file) => tauriFiles.reveal(workspacePath, file.path)}
      onDelete={async (file) => {
        await tauriFiles.delete(workspacePath, file.path);
        loadFiles();
      }}
      emptyTitle="No files yet"
      emptyDescription="Files created by your agent will appear here."
    />
  );
}
