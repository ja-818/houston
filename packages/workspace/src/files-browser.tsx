/**
 * FilesBrowser — macOS Finder list-view clone.
 * Column headers with sort, file/folder tree, status bar, drag-and-drop.
 */
import { useCallback, useMemo, useState } from "react"
import { cn, Button } from "@deck-ui/core"
import { FolderPlus, Upload, FolderOpen } from "lucide-react"
import type { FileEntry } from "./types"
import { useDropZone } from "./drop-zone"
import { FileRow, FolderSection, NewFolderInput, COL_GRID } from "./file-row"
import { buildTree } from "./tree"
import { sortTree, type SortKey, type SortDirection } from "./utils"

export interface FilesBrowserProps {
  files: FileEntry[]
  loading?: boolean
  selectedPath?: string | null
  onSelect?: (file: FileEntry) => void
  onOpen?: (file: FileEntry) => void
  onReveal?: (file: FileEntry) => void
  onDelete?: (file: FileEntry) => void
  onFilesDropped?: (files: File[], targetFolder?: string) => void
  onCreateFolder?: (name: string) => void
  onBrowse?: () => void
  onRevealWorkspace?: () => void
  emptyTitle?: string
  emptyDescription?: string
}

export function FilesBrowser({
  files, loading, selectedPath, onSelect, onOpen, onReveal, onDelete,
  onFilesDropped, onCreateFolder, onBrowse, onRevealWorkspace,
  emptyTitle = "No files yet",
  emptyDescription = "When agents create files, they\u2019ll appear here.",
}: FilesBrowserProps) {
  const { isDragging, dragHandlers } = useDropZone(onFilesDropped)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [folderDropTarget, setFolderDropTarget] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDirection>("asc")
  const isEmpty = !loading && files.length === 0
  const isRootTarget = isDragging && folderDropTarget === null

  const onDragActive = useCallback((f: string | null) => setFolderDropTarget(f), [])

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); return prev }
      setSortDir("asc")
      return key
    })
  }, [])

  const tree = useMemo(() => {
    if (isEmpty) return null
    return sortTree(buildTree(files), sortKey, sortDir)
  }, [files, isEmpty, sortKey, sortDir])

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center pt-[20vh] gap-4 px-8">
        <div className="space-y-2 text-center max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">{emptyTitle}</h1>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
        {(onBrowse || onRevealWorkspace) && (
          <div className="flex items-center gap-2">
            {onBrowse && (
              <Button variant="default" size="sm" onClick={onBrowse}>
                <Upload className="size-4 mr-1.5" /> Browse files
              </Button>
            )}
            {onRevealWorkspace && (
              <Button variant="outline" size="sm" onClick={onRevealWorkspace}>
                <FolderOpen className="size-4 mr-1.5" /> Open folder
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="relative flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-white"
      {...(onFilesDropped ? dragHandlers : {})}
    >
      <div
        className="h-[22px] shrink-0 border-b border-[#ddd] bg-[#f6f6f6] select-none items-center"
        style={{ display: "grid", gridTemplateColumns: COL_GRID }}
      >
        <HeaderCell label="Name" col="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="pl-7" />
        <HeaderCell label="Date Modified" col="dateModified" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
        <HeaderCell label="Size" col="size" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="justify-end" />
        <HeaderCell label="Kind" col="kind" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} last />
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: isRootTarget ? "rgba(0,122,255,0.06)" : undefined }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground/50">Loading\u2026</p>
          </div>
        ) : (
          <div>
            {creatingFolder && (
              <NewFolderInput
                onConfirm={(n) => { onCreateFolder?.(n); setCreatingFolder(false) }}
                onCancel={() => setCreatingFolder(false)}
              />
            )}
            {tree?.children.map((child) =>
              child.kind === "folder" ? (
                <FolderSection
                  key={child.path} node={child} depth={0}
                  selectedPath={selectedPath} onSelect={onSelect}
                  onOpen={onOpen} onReveal={onReveal} onDelete={onDelete}
                  onFilesDropped={onFilesDropped} onDragActive={onDragActive}
                />
              ) : (
                <FileRow
                  key={child.entry.path} file={child.entry}
                  selected={selectedPath === child.entry.path}
                  onSelect={onSelect} onOpen={onOpen}
                  onReveal={onReveal} onDelete={onDelete}
                />
              ),
            )}
          </div>
        )}
      </div>

      <div className="h-[22px] shrink-0 border-t border-[#ddd] bg-[#f6f6f6] flex items-center justify-center">
        <span className="text-[11px] text-[#808080]">
          {files.length} item{files.length !== 1 ? "s" : ""}
          {onCreateFolder && (
            <button
              onClick={() => setCreatingFolder(true)}
              className="ml-3 hover:text-[#333] transition-colors"
            >
              <FolderPlus className="size-3 inline -mt-px" />
            </button>
          )}
        </span>
      </div>
    </div>
  )
}

function HeaderCell({ label, col, sortKey, sortDir, onSort, className, last }: {
  label: string
  col: SortKey
  sortKey: SortKey
  sortDir: SortDirection
  onSort: (key: SortKey) => void
  className?: string
  last?: boolean
}) {
  const active = sortKey === col
  return (
    <button
      onClick={() => onSort(col)}
      className={cn(
        "flex items-center h-full px-2 text-[11px] font-medium text-[#808080] hover:bg-[#eaeaea] transition-colors",
        !last && "border-r border-[#ddd]",
        className,
      )}
    >
      <span className="truncate">{label}</span>
      {active && (
        <svg className="size-[6px] ml-1 shrink-0" viewBox="0 0 8 5" fill="#808080">
          {sortDir === "asc"
            ? <path d="M0 5L4 0L8 5Z" />
            : <path d="M0 0L4 5L8 0Z" />}
        </svg>
      )}
    </button>
  )
}
