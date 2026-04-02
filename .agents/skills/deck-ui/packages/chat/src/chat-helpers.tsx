/**
 * Chat helper components -- tool activity display.
 *
 * Generic version: no Houston-specific tool detection. Consumers can provide
 * custom tool mappings or a renderToolResult render prop to handle
 * application-specific tool results.
 */

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ToolEntry } from "./feed-to-messages";
import { Loader2, CheckIcon } from "lucide-react";

// Re-export types and conversion for convenient imports
export type { ToolEntry, ChatMessage } from "./feed-to-messages";
export { feedItemsToMessages } from "./feed-to-messages";

// ---------------------------------------------------------------------------
// ToolActivity -- shows tool usage with a live, alive feel
// ---------------------------------------------------------------------------

const DEFAULT_TOOL_LABELS: Record<string, string> = {
  Read: "Reading file",
  Write: "Writing file",
  Edit: "Editing file",
  Bash: "Running command",
  Glob: "Searching files",
  Grep: "Searching code",
  WebSearch: "Searching the web",
  WebFetch: "Fetching page",
  ToolSearch: "Looking up tools",
};

function humanizeToolName(
  name: string,
  customLabels?: Record<string, string>,
): string {
  const short = name.includes("__") ? name.split("__").pop()! : name;
  const labels = { ...DEFAULT_TOOL_LABELS, ...customLabels };
  return labels[short] || short.replace(/_/g, " ");
}

function collapseToolEntries(
  tools: ToolEntry[],
): { name: string; count: number; hasResult: boolean }[] {
  const result: { name: string; count: number; hasResult: boolean }[] = [];
  for (const tool of tools) {
    const last = result[result.length - 1];
    if (last && last.name === tool.name) {
      last.count++;
      if (tool.result) last.hasResult = true;
    } else {
      result.push({ name: tool.name, count: 1, hasResult: !!tool.result });
    }
  }
  return result;
}

export interface ToolActivityProps {
  tools: ToolEntry[];
  isStreaming: boolean;
  /** Custom tool name → human label mappings, merged with defaults */
  toolLabels?: Record<string, string>;
}

export function ToolActivity({
  tools,
  isStreaming,
  toolLabels,
}: ToolActivityProps) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!isStreaming) return;
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const collapsed = collapseToolEntries(tools);
  const lastIdx = collapsed.length - 1;

  return (
    <div className="space-y-0.5 py-1">
      {collapsed.map((item, i) => {
        const isLast = i === lastIdx;
        const hasResult = item.hasResult;
        const isActive = isLast && isStreaming && !hasResult;
        return (
          <div
            key={i}
            className={`flex items-center gap-2 text-xs py-0.5 transition-opacity duration-300 ${
              isActive ? "text-foreground/70" : "text-muted-foreground/40"
            }`}
          >
            {isActive ? (
              <Loader2 className="size-3 animate-spin text-foreground/40 shrink-0" />
            ) : (
              <CheckIcon className="size-3 text-muted-foreground/30 shrink-0" />
            )}
            <span className={isActive ? "font-medium" : ""}>
              {humanizeToolName(item.name, toolLabels)}
            </span>
            {item.count > 1 && (
              <span className="text-muted-foreground/30">{item.count}x</span>
            )}
          </div>
        );
      })}
      {isStreaming && tools.length > 0 && (
        <div className="text-[10px] text-muted-foreground/30 pl-5 pt-0.5">
          {tools.length} {tools.length === 1 ? "step" : "steps"} · {elapsed}s
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToolsAndCards -- generic version with optional custom tool result rendering
// ---------------------------------------------------------------------------

export interface ToolsAndCardsProps {
  tools: ToolEntry[];
  isStreaming: boolean;
  /** Custom tool name → human label mappings for ToolActivity */
  toolLabels?: Record<string, string>;
  /**
   * Predicate to identify "special" tools that should be rendered via
   * renderToolResult instead of the default ToolActivity list.
   * Defaults to returning false (all tools shown in ToolActivity).
   */
  isSpecialTool?: (toolName: string) => boolean;
  /**
   * Render prop for special tool results. Called for each tool where
   * isSpecialTool returns true and the tool has a result.
   */
  renderToolResult?: (tool: ToolEntry, index: number) => ReactNode;
}

export function ToolsAndCards({
  tools,
  isStreaming,
  toolLabels,
  isSpecialTool,
  renderToolResult,
}: ToolsAndCardsProps) {
  const specialTools = isSpecialTool
    ? tools.filter((t) => isSpecialTool(t.name) && t.result)
    : [];
  const otherTools = isSpecialTool
    ? tools.filter((t) => !isSpecialTool(t.name))
    : tools;

  return (
    <>
      {otherTools.length > 0 && (
        <ToolActivity
          tools={otherTools}
          isStreaming={isStreaming}
          toolLabels={toolLabels}
        />
      )}
      {renderToolResult &&
        specialTools.map((t, i) => (
          <div key={`special-${i}`} className="py-3">
            {renderToolResult(t, i)}
          </div>
        ))}
    </>
  );
}
