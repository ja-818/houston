/**
 * Finder-style file and folder rows.
 * Files: click to select, double-click to open, right-click context menu.
 * Folders: click to expand/collapse with disclosure triangle.
 */
import { useEffect, useRef, useState } from "react"
import { cn } from "@deck-ui/core"
import type { FileEntry } from "./types"
import type { FolderNode } from "./tree"
import { useFolderDropTarget } from "./drop-zone"
import { FolderIcon, DisclosureTriangle, getFileIcon } from "./finder-icons"
import { formatSize, formatFinderDate, getKind } from "./utils"
import { FileMenu } from "./file-menu"

// Indentation constants (px)
const DEPTH_INDENT = 20
const BASE_INDENT = 8
const TRIANGLE_AREA = 16

/** Column grid shared between header and rows. */
export const COL_GRID = "1fr 150px 70px 120px"

// ---------------------------------------------------------------------------
// FolderSection
// ---------------------------------------------------------------------------

export function FolderSection({
  node, depth, selectedPath, onSelect, onOpen, onReveal, onDelete,
  onFilesDropped, onDragActive,
}: {
  node: FolderNode
  depth: number
  selectedPath?: string | null
  onSelect?: (file: FileEntry) => void
  onOpen?: (file: FileEntry) => void
  onReveal?: (file: FileEntry) => void
  onDelete?: (file: FileEntry) => void
  onFilesDropped?: (files: File[], targetFolder?: string) => void
  onDragActive?: (folder: string | null) => void
}) {
  const [open, setOpen] = useState(true)
  const { isOver, folderHandlers } = useFolderDropTarget(node.path, onFilesDropped)

  useEffect(() => {
    onDragActive?.(isOver ? node.path : null)
  }, [isOver, node.path, onDragActive])

  const padLeft = BASE_INDENT + depth * DEPTH_INDENT

  return (
    <div {...(onFilesDropped ? folderHandlers : {})}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => e.key === "Enter" && setOpen(!open)}
        className={cn(
          "h-[22px] select-none cursor-default items-center",
          isOver ? "bg-[rgba(0,122,255,0.08)]" : "hover:bg-[#f0f0f0]",
        )}
        style={{ display: "grid", gridTemplateColumns: COL_GRID }}
      >
        <div className="flex items-center gap-1.5 min-w-0" style={{ paddingLeft: padLeft }}>
          <DisclosureTriangle open={open} />
          <FolderIcon />
          <span className="text-[13px] truncate">{node.name}</span>
        </div>
        <span className="text-[11px] text-[#999] truncate px-2">{"\u2014"}</span>
        <span className="text-[11px] text-[#999] text-right px-2">{"\u2014"}</span>
        <span className="text-[11px] text-[#999] truncate px-2">Folder</span>
      </div>
      {open &&
        node.children.map((child) =>
          child.kind === "folder" ? (
            <FolderSection
              key={child.path} node={child} depth={depth + 1}
              selectedPath={selectedPath} onSelect={onSelect}
              onOpen={onOpen} onReveal={onReveal} onDelete={onDelete}
              onFilesDropped={onFilesDropped} onDragActive={onDragActive}
            />
          ) : (
            <FileRow
              key={child.entry.path} file={child.entry} depth={depth + 1}
              selected={selectedPath === child.entry.path}
              onSelect={onSelect} onOpen={onOpen}
              onReveal={onReveal} onDelete={onDelete}
            />
          ),
        )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FileRow
// ---------------------------------------------------------------------------

export function FileRow({
  file, depth = 0, selected, onSelect, onOpen, onReveal, onDelete,
}: {
  file: FileEntry
  depth?: number
  selected?: boolean
  onSelect?: (file: FileEntry) => void
  onOpen?: (file: FileEntry) => void
  onReveal?: (file: FileEntry) => void
  onDelete?: (file: FileEntry) => void
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const padLeft = BASE_INDENT + depth * DEPTH_INDENT + TRIANGLE_AREA
  const hasMenu = onOpen || onReveal || onDelete
  const sec = selected ? "text-white/70" : "text-[#999]"

  return (
    <>
      <div
        role="row"
        tabIndex={0}
        onClick={() => onSelect?.(file)}
        onDoubleClick={() => onOpen?.(file)}
        onContextMenu={(e) => {
          if (!hasMenu) return
          e.preventDefault()
          onSelect?.(file)
          setMenu({ x: e.clientX, y: e.clientY })
        }}
        className={cn(
          "h-[22px] cursor-default select-none items-center outline-none transition-colors duration-75",
          selected ? "bg-[#0058D0] text-white" : "hover:bg-[#f0f0f0]",
        )}
        style={{ display: "grid", gridTemplateColumns: COL_GRID }}
      >
        <div className="flex items-center gap-1.5 min-w-0" style={{ paddingLeft: padLeft }}>
          {getFileIcon(file.extension)}
          <span className="text-[13px] truncate">{file.name}</span>
        </div>
        <span className={cn("text-[11px] truncate px-2", sec)}>
          {formatFinderDate(file.dateModified)}
        </span>
        <span className={cn("text-[11px] text-right px-2", sec)}>
          {formatSize(file.size)}
        </span>
        <span className={cn("text-[11px] truncate px-2", sec)}>
          {getKind(file.extension)}
        </span>
      </div>
      {menu && (
        <FileMenu
          file={file} position={menu}
          onClose={() => setMenu(null)}
          onOpen={onOpen} onReveal={onReveal} onDelete={onDelete}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// NewFolderInput (inline, styled as a selected folder row)
// ---------------------------------------------------------------------------

export function NewFolderInput({ onConfirm, onCancel }: {
  onConfirm: (name: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div
      className="h-[22px] bg-[#0058D0] items-center"
      style={{ display: "grid", gridTemplateColumns: COL_GRID }}
    >
      <div className="flex items-center gap-1.5 min-w-0 pl-2">
        <DisclosureTriangle open={false} className="invisible" />
        <FolderIcon />
        <input
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) onConfirm(value.trim())
            if (e.key === "Escape") onCancel()
          }}
          onBlur={() => (value.trim() ? onConfirm(value.trim()) : onCancel())}
          placeholder="untitled folder"
          className="flex-1 text-[13px] bg-transparent text-white outline-none placeholder:text-white/50 min-w-0"
        />
      </div>
      <span />
      <span />
      <span className="text-[11px] text-white/70 px-2">Folder</span>
    </div>
  )
}
