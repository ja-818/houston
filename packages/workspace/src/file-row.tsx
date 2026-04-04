/**
 * Finder-style file and folder rows.
 * Files: click to select, double-click to open, right-click context menu, draggable.
 * Folders: click to expand/collapse, drop target for moves.
 */
import { useEffect, useState } from "react"
import { cn } from "@deck-ui/core"
import type { FileEntry } from "./types"
import type { FolderNode } from "./tree"
import { INTERNAL_DRAG_TYPE, useFolderDropTarget } from "./drop-zone"
import { FolderIcon, DisclosureChevron, getFileIcon } from "./finder-icons"
import { formatSize, formatFinderDate, getKind } from "./utils"
import { FileMenu } from "./file-menu"

const DEPTH_INDENT = 20
const BASE_INDENT = 12
const TRIANGLE_AREA = 16

/** Column grid shared between header and rows. */
export const COL_GRID = "1fr 190px 80px 130px"

export function FolderSection({
  node, depth, selectedPath, onSelect, onOpen, onReveal, onDelete,
  onFilesDropped, onDragActive, onMove,
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
  onMove?: (sourcePath: string, targetFolder: string | null) => void
}) {
  const [open, setOpen] = useState(true)
  const [dragging, setDragging] = useState(false)
  const { isOver, folderHandlers } = useFolderDropTarget()

  useEffect(() => {
    onDragActive?.(isOver ? node.path : null)
  }, [isOver, node.path, onDragActive])

  const padLeft = BASE_INDENT + depth * DEPTH_INDENT

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        draggable={!!onMove}
        onDragStart={(e) => { e.dataTransfer.setData(INTERNAL_DRAG_TYPE, node.path); e.dataTransfer.effectAllowed = "move"; setDragging(true) }}
        onDragEnd={() => setDragging(false)}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => e.key === "Enter" && setOpen(!open)}
        className={cn(
          "h-[24px] select-none cursor-default items-center",
          isOver ? "!bg-[rgba(0,122,255,0.12)] !rounded-lg" : "",
          dragging && "opacity-40",
        )}
        style={{ display: "grid", gridTemplateColumns: COL_GRID }}
        {...folderHandlers}
      >
        <div className="flex items-center gap-1.5 min-w-0" style={{ paddingLeft: padLeft }}>
          <DisclosureChevron open={open} />
          <FolderIcon />
          <span className="text-[13px] truncate">{node.name}</span>
        </div>
        <span className="text-[11px] text-[#6d6d6d] truncate px-2">{"\u2014"}</span>
        <span className="text-[11px] text-[#6d6d6d] text-right px-2">--</span>
        <span className="text-[11px] text-[#6d6d6d] truncate px-2">Folder</span>
      </div>
      {open &&
        node.children.map((child) =>
          child.kind === "folder" ? (
            <FolderSection
              key={child.path} node={child} depth={depth + 1}
              selectedPath={selectedPath} onSelect={onSelect}
              onOpen={onOpen} onReveal={onReveal} onDelete={onDelete}
              onFilesDropped={onFilesDropped} onDragActive={onDragActive} onMove={onMove}
            />
          ) : (
            <FileRow
              key={child.entry.path} file={child.entry} depth={depth + 1}
              selected={selectedPath === child.entry.path}
              onSelect={onSelect} onOpen={onOpen}
              onReveal={onReveal} onDelete={onDelete} onMove={onMove}
            />
          ),
        )}
    </>
  )
}

export function FileRow({
  file, depth = 0, selected, onSelect, onOpen, onReveal, onDelete, onMove,
}: {
  file: FileEntry
  depth?: number
  selected?: boolean
  onSelect?: (file: FileEntry) => void
  onOpen?: (file: FileEntry) => void
  onReveal?: (file: FileEntry) => void
  onDelete?: (file: FileEntry) => void
  onMove?: (sourcePath: string, targetFolder: string | null) => void
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const padLeft = BASE_INDENT + depth * DEPTH_INDENT + TRIANGLE_AREA
  const hasMenu = onOpen || onReveal || onDelete
  const sec = selected ? "text-white/80" : "text-[#6d6d6d]"

  return (
    <>
      <div
        role="row"
        tabIndex={0}
        draggable={!!onMove}
        onDragStart={(e) => { e.dataTransfer.setData(INTERNAL_DRAG_TYPE, file.path); e.dataTransfer.effectAllowed = "move"; setDragging(true) }}
        onDragEnd={() => setDragging(false)}
        onClick={() => onSelect?.(file)}
        onDoubleClick={() => onOpen?.(file)}
        onContextMenu={(e) => {
          if (!hasMenu) return
          e.preventDefault()
          onSelect?.(file)
          setMenu({ x: e.clientX, y: e.clientY })
        }}
        data-selected={selected || undefined}
        className={cn(
          "h-[24px] cursor-default select-none items-center outline-none",
          selected && "!bg-[#2068d0] text-white rounded-lg",
          dragging && "opacity-40",
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
