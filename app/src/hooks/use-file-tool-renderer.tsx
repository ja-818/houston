import { useCallback, useMemo } from "react";
import { ToolBlock } from "@houston-ai/chat";
import type { ToolEntry } from "@houston-ai/chat";
import { FileCard } from "../components/file-card";
import { TurnFileSummary } from "../components/turn-file-summary";

/** Tool short names that produce files the user might want to open. */
const FILE_TOOLS = new Set(["Write", "Edit"]);

function shortName(name: string): string {
  return name.includes("__") ? name.split("__").pop()! : name;
}

/**
 * Extract file paths from Bash stdout. Catches two patterns Claude uses
 * when creating files via shell/Python:
 *
 * 1. Labeled — "Saved: /path/to/file.ext", "Created: /path/...", etc.
 * 2. Bare   — a standalone absolute path on its own line
 */
function extractPathsFromBashOutput(output: string): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();

  const add = (raw: string) => {
    const p = raw.trim();
    if (p && !seen.has(p)) { seen.add(p); paths.push(p); }
  };

  // "Saved: /…/file.xlsx", "Created: /…/file.py", etc.
  const labeled = /(?:saved|created|wrote|written|output|file):\s*([^\r\n]+\.[a-zA-Z0-9]{1,10})/gi;
  let m: RegExpExecArray | null;
  while ((m = labeled.exec(output)) !== null) add(m[1]);

  // Bare absolute path alone on a line: "/Users/…/file.ext"
  const bare = /^(\/[^\r\n]+\.[a-zA-Z0-9]{1,10})\s*$/gm;
  while ((m = bare.exec(output)) !== null) add(m[1]);

  return paths;
}

/**
 * Returns `isSpecialTool`, `renderToolResult`, and `renderTurnSummary`
 * callbacks for rendering clickable file cards on Write/Edit tool results
 * and an aggregated end-of-turn file summary.
 */
export function useFileToolRenderer(agentPath: string) {
  const isSpecialTool = useCallback(
    (toolName: string) => FILE_TOOLS.has(shortName(toolName)),
    [],
  );

  const renderToolResult = useCallback(
    (tool: ToolEntry, index: number) => {
      const inp = tool.input as Record<string, unknown> | null | undefined;
      const filePath = inp?.file_path as string | undefined;
      const isError = tool.result?.is_error ?? false;

      return (
        <div key={index} className="space-y-2">
          <ToolBlock tool={tool} isActive={false} />
          {filePath && !isError && (
            <FileCard filePath={filePath} agentPath={agentPath} />
          )}
        </div>
      );
    },
    [agentPath],
  );

  const renderTurnSummary = useCallback(
    (tools: ToolEntry[]) => {
      const seen = new Set<string>();
      const filePaths: string[] = [];

      const add = (fp: string) => {
        if (!seen.has(fp)) { seen.add(fp); filePaths.push(fp); }
      };

      for (const tool of tools) {
        if (!tool.result || tool.result.is_error) continue;
        const sn = shortName(tool.name);

        if (FILE_TOOLS.has(sn)) {
          // Write / Edit: file path is in the tool input
          const inp = tool.input as Record<string, unknown> | null | undefined;
          const fp = inp?.file_path as string | undefined;
          if (fp) add(fp);
        } else if (sn === "Bash") {
          // Bash: Claude typically prints the path when it creates a file
          for (const fp of extractPathsFromBashOutput(tool.result.content)) {
            add(fp);
          }
        }
      }

      if (filePaths.length === 0) return null;
      return <TurnFileSummary filePaths={filePaths} agentPath={agentPath} />;
    },
    [agentPath],
  );

  return useMemo(
    () => ({ isSpecialTool, renderToolResult, renderTurnSummary }),
    [isSpecialTool, renderToolResult, renderTurnSummary],
  );
}
