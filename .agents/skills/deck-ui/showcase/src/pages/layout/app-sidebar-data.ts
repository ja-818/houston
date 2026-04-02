import type { PropDef } from "../../components/props-table";

/* ── Sample data ─────────────────────────────────────────────── */

export const SAMPLE_ITEMS = [
  { id: "p1", name: "Marketing Site" },
  { id: "p2", name: "API Backend" },
  { id: "p3", name: "Mobile App" },
  { id: "p4", name: "Design System" },
];

/* ── Code examples ───────────────────────────────────────────── */

export const QUICK_START_CODE = `import { useState } from "react"
import { AppSidebar } from "@deck-ui/layout"

const projects = [
  { id: "p1", name: "Marketing Site" },
  { id: "p2", name: "API Backend" },
  { id: "p3", name: "Mobile App" },
]

function MyApp() {
  const [selectedId, setSelectedId] = useState<string | null>("p1")

  return (
    <div className="h-screen flex">
      <AppSidebar
        logo={<span className="font-semibold">My App</span>}
        items={projects}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={() => createProject()}
        onDelete={(id) => deleteProject(id)}
        sectionLabel="Projects"
      >
        <MainContent projectId={selectedId} />
      </AppSidebar>
    </div>
  )
}`;

export const CALLBACKS_CODE = `<AppSidebar
  items={projects}
  selectedId={selectedId}
  onSelect={setSelectedId}
  onAdd={() => createProject()}
  onDelete={(id) => deleteProject(id)}
  sectionLabel="Workspaces"
>
  {children}
</AppSidebar>

{/* Delete: press Delete or Backspace while an item is focused */}`;

/* ── Props definitions ───────────────────────────────────────── */

export const SIDEBAR_PROPS: PropDef[] = [
  { name: "logo", type: "ReactNode", description: "Content rendered in the sidebar header (brand, icon, etc.)" },
  { name: "items", type: "{ id: string; name: string }[]", description: "List of navigable items shown in the sidebar" },
  { name: "selectedId", type: "string | null", description: "ID of the currently selected item" },
  { name: "onSelect", type: "(id: string) => void", description: "Called when an item is clicked" },
  { name: "onAdd", type: "() => void", description: "Called when the add button is clicked. Hides the button when omitted." },
  { name: "onDelete", type: "(id: string) => void", description: "Called on Delete/Backspace keypress while an item is focused" },
  { name: "sectionLabel", type: "string", description: "Optional label displayed above the item list" },
  { name: "children", type: "ReactNode", description: "Main content area rendered to the right of the sidebar" },
];
