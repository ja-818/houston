import { useState, useEffect, useCallback } from "react";
import { FilesBrowser } from "@houston-ai/workspace";
import type { FileEntry } from "@houston-ai/workspace";
import { Button } from "@houston-ai/core";
import { FolderOpen } from "lucide-react";
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
    <div className="h-full overflow-auto">
      <div className="flex items-center justify-end px-4 pt-3 pb-1">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-1.5"
          onClick={() => tauriFiles.revealWorkspace(path)}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Open in Finder
        </Button>
      </div>
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
    </div>
  );
}
