import { useState, useEffect, useCallback } from "react";
import { FilesBrowser } from "@houston-ai/workspace";
import type { FileEntry } from "@houston-ai/workspace";
import { ContentArea } from "../shell/content-area";
import { tauriFiles } from "../../lib/tauri";
import type { TabProps } from "../../lib/types";

export default function FilesTab({ workspace }: TabProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const path = workspace.folderPath;

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await tauriFiles.list(path);
      setFiles(result);
    } catch (e) {
      console.error("[files] Failed to load:", e);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return (
    <ContentArea>
      <FilesBrowser
        files={files}
        loading={loading}
        onOpen={(file) => tauriFiles.open(path, file.path)}
        onReveal={(file) => tauriFiles.reveal(path, file.path)}
        onDelete={async (file) => {
          await tauriFiles.delete(path, file.path);
          loadFiles();
        }}
        onRename={async (file, newName) => {
          await tauriFiles.rename(path, file.path, newName);
          loadFiles();
        }}
        onCreateFolder={async (name) => {
          await tauriFiles.createFolder(path, name);
          loadFiles();
        }}
        emptyTitle="No files yet"
        emptyDescription="Files created by your assistant will appear here."
      />
    </ContentArea>
  );
}
