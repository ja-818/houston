import type { PropDef } from "../../components/props-table";

/* ── Code examples ───────────────────────────────────────────── */

export const QUICK_START_CODE = `import { SplitView } from "@deck-ui/layout"

function MyLayout() {
  return (
    <div className="h-screen">
      <SplitView
        left={<MainContent />}
        right={<DetailPanel />}
      />
    </div>
  )
}`;

export const CUSTOM_SIZES_CODE = `<SplitView
  left={<MainContent />}
  right={<DetailPanel />}
  defaultLeftSize={65}
  defaultRightSize={35}
  minLeftSize={40}
  minRightSize={20}
/>`;

/* ── Props definitions ───────────────────────────────────────── */

export const SPLIT_VIEW_PROPS: PropDef[] = [
  { name: "left", type: "ReactNode", description: "Content rendered in the left panel" },
  { name: "right", type: "ReactNode", description: "Content rendered in the right panel" },
  { name: "defaultLeftSize", type: "number", default: "55", description: "Initial width of the left panel as a percentage" },
  { name: "defaultRightSize", type: "number", default: "45", description: "Initial width of the right panel as a percentage" },
  { name: "minLeftSize", type: "number", default: "30", description: "Minimum width of the left panel as a percentage" },
  { name: "minRightSize", type: "number", default: "25", description: "Minimum width of the right panel as a percentage" },
];
