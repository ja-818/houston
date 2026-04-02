/**
 * FilesBrowser — file browser for an agent workspace.
 * Shows files grouped by folder with icons, sizes, and actions.
 * Extracted from Houston's FilesView, made props-driven.
 */
import { useState } from "react"
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@deck-ui/core"
import {
  ChevronRight,
  ExternalLink,
  FileText,
  FolderSearch,
  Image as ImageIcon,
  MoreVertical,
  Trash2,
} from "lucide-react"
import type { FileEntry } from "./types"

export interface FilesBrowserProps {
  /** Files to display */
  files: FileEntry[]
  /** Show loading state */
  loading?: boolean
  /** Called when a file row is clicked */
  onOpen?: (file: FileEntry) => void
  /** Called when "Show in Finder" is selected */
  onReveal?: (file: FileEntry) => void
  /** Called when delete is selected */
  onDelete?: (file: FileEntry) => void
  /** Title for empty state */
  emptyTitle?: string
  /** Description for empty state */
  emptyDescription?: string
}

export function FilesBrowser({
  files,
  loading,
  onOpen,
  onReveal,
  onDelete,
  emptyTitle = "Your work shows up here",
  emptyDescription = "When agents create files, they'll appear here for you to open and review.",
}: FilesBrowserProps) {
  if (!loading && files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center pt-[20vh] gap-4 px-8">
        <div className="space-y-2 text-center max-w-md">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {emptyTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
      </div>
    )
  }

  const grouped = groupByFolder(files)
  const folders = Object.keys(grouped).sort()

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex items-center h-8 px-6 text-[11px] font-medium text-muted-foreground/40 border-b border-black/[0.06] shrink-0 select-none">
        <span className="flex-1 pl-8">Name</span>
        <span className="w-20 text-right">Size</span>
        <span className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground/50">Loading...</p>
          </div>
        ) : (
          <div>
            {folders.map((folder) =>
              folder ? (
                <FolderSection
                  key={folder}
                  name={folder}
                  files={grouped[folder]}
                  onOpen={onOpen}
                  onReveal={onReveal}
                  onDelete={onDelete}
                />
              ) : (
                grouped[folder].map((f) => (
                  <FileRow
                    key={f.path}
                    file={f}
                    onOpen={onOpen}
                    onReveal={onReveal}
                    onDelete={onDelete}
                  />
                ))
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function groupByFolder(files: FileEntry[]): Record<string, FileEntry[]> {
  const grouped: Record<string, FileEntry[]> = {}
  for (const f of files) {
    const parts = f.path.split("/")
    const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : ""
    ;(grouped[folder] ??= []).push(f)
  }
  return grouped
}

function FolderSection({
  name,
  files,
  onOpen,
  onReveal,
  onDelete,
}: {
  name: string
  files: FileEntry[]
  onOpen?: (file: FileEntry) => void
  onReveal?: (file: FileEntry) => void
  onDelete?: (file: FileEntry) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center h-8 px-6 hover:bg-secondary transition-colors duration-150 select-none"
      >
        <ChevronRight
          className={cn(
            "size-3.5 text-muted-foreground/40 transition-transform duration-200 mr-2",
            open && "rotate-90",
          )}
        />
        <span className="text-xs font-medium text-muted-foreground/60 flex-1 text-left">
          {name}
        </span>
        <span className="text-[10px] text-muted-foreground/30">
          {files.length}
        </span>
      </button>
      {open && (
        <div>
          {files.map((f) => (
            <FileRow
              key={f.path}
              file={f}
              indent
              onOpen={onOpen}
              onReveal={onReveal}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FileRow({
  file,
  indent,
  onOpen,
  onReveal,
  onDelete,
}: {
  file: FileEntry
  indent?: boolean
  onOpen?: (file: FileEntry) => void
  onReveal?: (file: FileEntry) => void
  onDelete?: (file: FileEntry) => void
}) {
  const ext = file.extension
  const hasActions = onOpen || onReveal || onDelete

  return (
    <button
      onClick={() => onOpen?.(file)}
      className={cn(
        "w-full flex items-center h-9 px-6 hover:bg-secondary",
        "active:bg-accent transition-colors duration-100 text-left group",
        indent && "pl-11",
      )}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <FileIcon extension={ext} />
        <span className="text-[13px] text-foreground truncate">
          {file.name}
        </span>
      </div>
      <span className="w-20 text-right text-[11px] text-muted-foreground/30">
        {formatSize(file.size)}
      </span>
      {hasActions && (
        <div className="w-10 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span
                role="button"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center w-6 h-6 rounded text-muted-foreground/20 hover:text-foreground hover:bg-black/[0.05] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150"
              >
                <MoreVertical className="size-3.5" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onOpen && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpen(file)
                  }}
                >
                  <ExternalLink className="size-4 mr-2" />
                  Open
                </DropdownMenuItem>
              )}
              {onReveal && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onReveal(file)
                  }}
                >
                  <FolderSearch className="size-4 mr-2" />
                  Show in Finder
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(file)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </button>
  )
}

function FileIcon({ extension }: { extension: string }) {
  if (["png", "jpg", "jpeg", "svg", "gif", "webp"].includes(extension)) {
    return <ImageIcon className="size-4 shrink-0 text-muted-foreground/50" />
  }
  if (extension === "pdf") {
    return (
      <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none">
        <rect width="16" height="16" rx="3" fill="#E5252A" />
        <text
          x="8"
          y="11"
          textAnchor="middle"
          fill="white"
          fontSize="7"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          PDF
        </text>
      </svg>
    )
  }
  return <FileText className="size-4 shrink-0 text-muted-foreground/50" />
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
