/**
 * Per-tool formatting for ToolBlock content display.
 *
 * Maps tool names to icons, detail strings, and formatted result components.
 * Designed for non-technical users: friendly labels, clean code blocks,
 * smart truncation. No Houston-specific logic.
 */

import { useState, memo } from "react";
import type { ComponentType } from "react";
import {
  TerminalIcon,
  FileTextIcon,
  PencilIcon,
  FilePlusIcon,
  SearchIcon,
  FolderSearchIcon,
  GlobeIcon,
  DownloadIcon,
  WrenchIcon,
} from "lucide-react";
import type { ToolEntry } from "./feed-to-messages";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

type LucideIcon = ComponentType<{ className?: string }>;

const TOOL_ICONS: Record<string, LucideIcon> = {
  Bash: TerminalIcon,
  Read: FileTextIcon,
  Edit: PencilIcon,
  Write: FilePlusIcon,
  Grep: SearchIcon,
  Glob: FolderSearchIcon,
  WebSearch: GlobeIcon,
  WebFetch: DownloadIcon,
};

export function getToolIcon(name: string): LucideIcon {
  const short = name.includes("__") ? name.split("__").pop()! : name;
  return TOOL_ICONS[short] ?? WrenchIcon;
}

// ---------------------------------------------------------------------------
// Detail strings (shown in header next to label)
// ---------------------------------------------------------------------------

export function getToolDetail(name: string, input: unknown): string | null {
  const inp = input as Record<string, unknown> | null | undefined;
  if (!inp) return null;
  const short = name.includes("__") ? name.split("__").pop()! : name;

  switch (short) {
    case "Bash": {
      const cmd = inp.command as string | undefined;
      if (!cmd) return null;
      return cmd.length > 80 ? cmd.slice(0, 77) + "..." : cmd;
    }
    case "Read":
    case "Write":
    case "Edit":
      return shortPath(inp.file_path as string | undefined);
    case "Grep":
    case "Glob":
      return inp.pattern as string | undefined ?? null;
    case "WebSearch":
      return inp.query as string | undefined ?? null;
    case "WebFetch":
      return shortUrl(inp.url as string | undefined);
    default:
      return null;
  }
}

function shortPath(fp: string | undefined): string | null {
  if (!fp) return null;
  const parts = fp.split("/");
  return parts.length > 2 ? parts.slice(-2).join("/") : fp;
}

function shortUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return url.length > 60 ? url.slice(0, 57) + "..." : url;
  }
}

// ---------------------------------------------------------------------------
// Tool content renderer
// ---------------------------------------------------------------------------

export const ToolContent = memo(({ tool }: { tool: ToolEntry }) => {
  const short = tool.name.includes("__") ? tool.name.split("__").pop()! : tool.name;
  const inp = tool.input as Record<string, unknown> | null | undefined;
  const result = tool.result;

  switch (short) {
    case "Bash":
      return <BashContent command={inp?.command as string} result={result} />;
    case "Read":
      return <FileContent result={result} />;
    case "Edit":
      return <EditContent input={inp} result={result} />;
    case "Write":
      return <FileContent result={result} label="Written" />;
    case "Grep":
    case "Glob":
      return <SearchContent result={result} />;
    default:
      return <GenericContent result={result} />;
  }
});
ToolContent.displayName = "ToolContent";

// ---------------------------------------------------------------------------
// Per-tool content components
// ---------------------------------------------------------------------------

function BashContent({
  command,
  result,
}: {
  command?: string;
  result?: ToolEntry["result"];
}) {
  return (
    <div className="rounded-lg bg-zinc-900 text-zinc-100 overflow-hidden">
      {command && (
        <div className="px-3 py-2 text-xs font-mono border-b border-zinc-800">
          <span className="text-zinc-500">$ </span>
          {command}
        </div>
      )}
      {result && (
        <TruncatedCode
          content={result.content}
          maxLines={15}
          isError={result.is_error}
          dark
        />
      )}
    </div>
  );
}

function FileContent({
  result,
  label,
}: {
  result?: ToolEntry["result"];
  label?: string;
}) {
  if (!result) return null;
  if (label && result.content === "ok") {
    return <p className="text-xs text-muted-foreground py-1">{label}</p>;
  }
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <TruncatedCode content={result.content} maxLines={20} />
    </div>
  );
}

function EditContent({
  input,
  result,
}: {
  input?: Record<string, unknown> | null;
  result?: ToolEntry["result"];
}) {
  if (result?.is_error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {result.content}
      </div>
    );
  }
  const oldStr = input?.old_string as string | undefined;
  const newStr = input?.new_string as string | undefined;
  if (!oldStr && !newStr) {
    return <GenericContent result={result} />;
  }
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden text-xs font-mono">
      {oldStr && (
        <div className="bg-red-50 px-3 py-1.5 border-b border-border/30">
          <span className="text-red-400 select-none">- </span>
          <span className="text-red-700">{truncateStr(oldStr, 200)}</span>
        </div>
      )}
      {newStr && (
        <div className="bg-green-50 px-3 py-1.5">
          <span className="text-green-400 select-none">+ </span>
          <span className="text-green-700">{truncateStr(newStr, 200)}</span>
        </div>
      )}
    </div>
  );
}

function SearchContent({ result }: { result?: ToolEntry["result"] }) {
  if (!result) return null;
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <TruncatedCode content={result.content} maxLines={12} />
    </div>
  );
}

function GenericContent({ result }: { result?: ToolEntry["result"] }) {
  if (!result) return null;
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <TruncatedCode content={result.content} maxLines={10} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// TruncatedCode — code block with max-height + "show more"
// ---------------------------------------------------------------------------

const TruncatedCode = memo(
  ({
    content,
    maxLines,
    isError,
    dark,
  }: {
    content: string;
    maxLines: number;
    isError?: boolean;
    dark?: boolean;
  }) => {
    const [expanded, setExpanded] = useState(false);
    const lines = content.split("\n");
    const needsTruncation = lines.length > maxLines;
    const display = expanded ? content : lines.slice(0, maxLines).join("\n");
    const remaining = lines.length - maxLines;

    return (
      <div>
        <pre
          className={`px-3 py-2 text-xs font-mono whitespace-pre-wrap break-words overflow-x-auto ${
            dark
              ? isError
                ? "text-red-400"
                : "text-zinc-300"
              : isError
                ? "text-red-600 bg-red-50"
                : "text-foreground bg-muted/50"
          }`}
        >
          {display}
        </pre>
        {needsTruncation && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className={`w-full px-3 py-1 text-[10px] text-center transition-colors ${
              dark
                ? "text-zinc-500 hover:text-zinc-300 border-t border-zinc-800"
                : "text-muted-foreground hover:text-foreground border-t border-border/30"
            }`}
          >
            {remaining} more lines
          </button>
        )}
      </div>
    );
  },
);
TruncatedCode.displayName = "TruncatedCode";

function truncateStr(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}
