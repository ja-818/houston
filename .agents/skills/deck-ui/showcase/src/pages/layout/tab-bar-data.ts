import type { PropDef } from "../../components/props-table";

/* ── Sample data ─────────────────────────────────────────────── */

export const SAMPLE_TABS = [
  { id: "chat", label: "Chat", badge: 2 },
  { id: "board", label: "Board" },
  { id: "events", label: "Events", badge: 5 },
  { id: "routines", label: "Routines" },
];

/* ── Code examples ───────────────────────────────────────────── */

export const QUICK_START_CODE = `import { useState } from "react"
import { TabBar } from "@deck-ui/layout"

const tabs = [
  { id: "chat", label: "Chat", badge: 2 },
  { id: "board", label: "Board" },
  { id: "events", label: "Events", badge: 5 },
]

function MyLayout() {
  const [activeTab, setActiveTab] = useState("chat")

  return (
    <TabBar
      title="My Project"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  )
}`;

export const ACTIONS_CODE = `import { Button } from "@deck-ui/core"
import { Settings, Plus } from "lucide-react"

<TabBar
  title="My Project"
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  actions={
    <>
      <Button variant="ghost" size="icon">
        <Plus className="size-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Settings className="size-4" />
      </Button>
    </>
  }
  menu={
    <span className="text-xs text-muted-foreground">v2.1</span>
  }
/>`;

/* ── Props definitions ───────────────────────────────────────── */

export const TAB_BAR_PROPS: PropDef[] = [
  { name: "title", type: "string", description: "Title displayed above the tab strip" },
  { name: "tabs", type: "{ id: string; label: string; badge?: number }[]", description: "Tab definitions — each with an id, label, and optional badge count" },
  { name: "activeTab", type: "string", description: "The id of the currently active tab" },
  { name: "onTabChange", type: "(id: string) => void", description: "Called when a tab is clicked" },
  { name: "actions", type: "ReactNode", description: "Action buttons rendered on the right side of the title row" },
  { name: "menu", type: "ReactNode", description: "Content rendered next to the title (e.g., dropdown, version badge)" },
];
