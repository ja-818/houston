import { FilesBrowser } from "@deck-ui/workspace"
import type { FileEntry } from "@deck-ui/workspace"
import { CodeBlock } from "../../components/code-block"

const SAMPLE_FILES: FileEntry[] = [
  { path: "report.pdf", name: "report.pdf", extension: "pdf", size: 245000 },
  { path: "notes.md", name: "notes.md", extension: "md", size: 1200 },
  { path: "docs/design.md", name: "design.md", extension: "md", size: 3400 },
  { path: "docs/api.md", name: "api.md", extension: "md", size: 8200 },
  { path: "output/chart.png", name: "chart.png", extension: "png", size: 52000 },
  { path: "output/data.xlsx", name: "data.xlsx", extension: "xlsx", size: 18700 },
]

const USAGE_CODE = `import { FilesBrowser } from "@deck-ui/workspace"
import type { FileEntry } from "@deck-ui/workspace"

function MyFiles({ files }: { files: FileEntry[] }) {
  return (
    <FilesBrowser
      files={files}
      onOpen={(f) => openFile(f.path)}
      onReveal={(f) => showInFinder(f.path)}
      onDelete={(f) => deleteFile(f.path)}
      emptyTitle="Your work shows up here"
      emptyDescription="When agents create files, they'll appear here."
    />
  )
}`

export function FilesScreen() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold mb-1">Files</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/workspace
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          File browser for an agent workspace. Groups files by folder, shows
          icons by type, file sizes, and open/reveal/delete actions via dropdown
          menu.
        </p>
        <div className="h-[340px] rounded-xl border border-border overflow-hidden">
          <FilesBrowser
            files={SAMPLE_FILES}
            onOpen={(f) => console.log("Open:", f.path)}
            onReveal={(f) => console.log("Reveal:", f.path)}
            onDelete={(f) => console.log("Delete:", f.path)}
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
