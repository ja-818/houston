import { useState } from "react"
import { FilesBrowser } from "@deck-ui/workspace"
import type { FileEntry } from "@deck-ui/workspace"
import { CodeBlock } from "../../components/code-block"

const now = Date.now()
const hour = 3600000
const day = 86400000

const INITIAL_FILES: FileEntry[] = [
  { path: "report.pdf", name: "report.pdf", extension: "pdf", size: 245000, dateModified: now - 2 * hour },
  { path: "notes.md", name: "notes.md", extension: "md", size: 1200, dateModified: now - 5 * hour },
  { path: "docs/design.md", name: "design.md", extension: "md", size: 3400, dateModified: now - day },
  { path: "docs/api.md", name: "api.md", extension: "md", size: 8200, dateModified: now - 2 * day },
  { path: "output/chart.png", name: "chart.png", extension: "png", size: 52000, dateModified: now - 3 * hour },
  { path: "output/data.xlsx", name: "data.xlsx", extension: "xlsx", size: 18700, dateModified: now - day - 4 * hour },
  { path: "src/index.ts", name: "index.ts", extension: "ts", size: 420, dateModified: now - 30 * 60000 },
  { path: "archive.zip", name: "archive.zip", extension: "zip", size: 1540000, dateModified: now - 7 * day },
]

const USAGE_CODE = `import { FilesBrowser } from "@deck-ui/workspace"
import type { FileEntry } from "@deck-ui/workspace"

function MyFiles({ files }: { files: FileEntry[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <FilesBrowser
      files={files}
      selectedPath={selected}
      onSelect={(f) => setSelected(f.path)}
      onOpen={(f) => openFile(f.path)}
      onReveal={(f) => showInFinder(f.path)}
      onDelete={(f) => deleteFile(f.path)}
      onFilesDropped={(dropped, folder) => importFiles(dropped, folder)}
    />
  )
}`

export function FilesScreen() {
  const [files, setFiles] = useState<FileEntry[]>(INITIAL_FILES)
  const [selected, setSelected] = useState<string | null>(null)

  function handleDrop(dropped: File[], targetFolder?: string) {
    const newEntries: FileEntry[] = dropped.map((f) => {
      const ext = f.name.includes(".") ? f.name.split(".").pop()! : ""
      const path = targetFolder ? `${targetFolder}/${f.name}` : f.name
      return { path, name: f.name, extension: ext, size: f.size, dateModified: Date.now() }
    })
    setFiles((prev) => [...prev, ...newEntries])
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold mb-1">Files</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/workspace
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          macOS Finder-style file browser for agent workspaces. Column headers
          with sort, disclosure triangles, selection, right-click context menu,
          drag-and-drop, and a status bar.
        </p>
        <div className="h-[340px] rounded-xl border border-border overflow-hidden">
          <FilesBrowser
            files={files}
            selectedPath={selected}
            onSelect={(f) => setSelected(f.path)}
            onOpen={(f) => console.log("Open:", f.path)}
            onReveal={(f) => console.log("Reveal:", f.path)}
            onDelete={(f) => setFiles((prev) => prev.filter((p) => p.path !== f.path))}
            onFilesDropped={handleDrop}
            onMove={(src, target) => {
              setFiles((prev) => {
                const file = prev.find((f) => f.path === src)
                if (!file) return prev
                const newPath = target ? `${target}/${file.name}` : file.name
                return prev.map((f) => f.path === src ? { ...f, path: newPath } : f)
              })
            }}
            onCreateFolder={(name) => console.log("Create folder:", name)}
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Usage</h2>
        <CodeBlock code={USAGE_CODE} />
      </div>
    </div>
  )
}
