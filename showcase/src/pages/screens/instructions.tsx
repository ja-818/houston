import { InstructionsPanel } from "@deck-ui/workspace"
import type { InstructionFile } from "@deck-ui/workspace"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@deck-ui/core"
import { CodeBlock } from "../../components/code-block"

const SIMPLE_FILES: InstructionFile[] = [
  {
    name: "CLAUDE.md",
    label: "CLAUDE.md",
    content: `# My Agent

## Role
You are a helpful assistant for managing my project.

## Rules
- Always be concise
- Ask before making destructive changes
- Use the keel CLI for task management`,
  },
]

const RICH_FILES: InstructionFile[] = [
  {
    name: "description",
    label: "What is this project?",
    content:
      "A test project used to explore and validate task and routine management capabilities. It serves as a sandbox for experimenting with agent workflows and automation features.",
  },
  {
    name: "audience",
    label: "Who is it for?",
    content:
      "Internal team members and developers evaluating the platform as an AI project management tool.",
  },
  {
    name: "tone",
    label: "Voice and tone",
    content:
      "Casual and technical — this is an internal test environment, not a customer-facing product.",
  },
  {
    name: "constraints",
    label: "Constraints",
    content:
      "No hard deadlines or budget constraints. This is a sandbox environment for testing purposes only.",
  },
]

const USAGE_CODE = `import { InstructionsPanel } from "@deck-ui/workspace"
import type { InstructionFile } from "@deck-ui/workspace"

function MyInstructions({ files }: { files: InstructionFile[] }) {
  return (
    <InstructionsPanel
      files={files}
      onSave={async (name, content) => {
        await saveFile(name, content)
      }}
    />
  )
}`

export function InstructionsScreen() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold mb-1">Instructions</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/workspace
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Editable workspace files for configuring an agent. Each file is
          represented as a labeled textarea that auto-saves on blur.
        </p>

        <Tabs defaultValue="rich">
          <TabsList>
            <TabsTrigger value="simple">Single file</TabsTrigger>
            <TabsTrigger value="rich">Multiple instruction files</TabsTrigger>
          </TabsList>
          <TabsContent value="simple">
            <div className="rounded-xl border border-border overflow-hidden mt-4">
              <InstructionsPanel
                files={SIMPLE_FILES}
                onSave={async (name, content) =>
                  console.log("Save:", name, content.slice(0, 50) + "...")
                }
              />
            </div>
          </TabsContent>
          <TabsContent value="rich">
            <div className="rounded-xl border border-border overflow-hidden mt-4">
              <InstructionsPanel
                files={RICH_FILES}
                onSave={async (name, content) =>
                  console.log("Save:", name, content.slice(0, 50) + "...")
                }
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Usage</h2>
        <CodeBlock code={USAGE_CODE} />
      </div>
    </div>
  )
}
