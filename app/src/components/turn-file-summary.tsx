import { useCallback, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@houston-ai/core";
import { tauriFiles } from "../lib/tauri";
import { getFileIcon } from "./file-card";

interface TurnFileSummaryProps {
  filePaths: string[];
  agentPath: string;
}

export function TurnFileSummary({ filePaths, agentPath }: TurnFileSummaryProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(
    (path: string) => {
      tauriFiles.open(agentPath, path).catch(console.error);
    },
    [agentPath],
  );

  if (filePaths.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-border/50 bg-secondary overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
        <span>
          {filePaths.length === 1
            ? "1 file updated"
            : `${filePaths.length} files updated`}
        </span>
      </button>
      {open && (
        <div className="border-t border-border/50 divide-y divide-border/50">
          {filePaths.map((path) => {
            const fileName = path.split("/").pop() ?? path;
            const ext = fileName.includes(".")
              ? fileName.split(".").pop()?.toLowerCase()
              : undefined;
            const Icon = getFileIcon(ext);
            return (
              <button
                key={path}
                type="button"
                onClick={() => handleOpen(path)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{fileName}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
