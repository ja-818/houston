import { SplitView } from "@deck-ui/layout";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  SPLIT_VIEW_PROPS,
  QUICK_START_CODE,
  CUSTOM_SIZES_CODE,
} from "./split-view-data";

function PanelPlaceholder({
  label,
  bg,
}: {
  label: string;
  bg: string;
}) {
  return (
    <div
      className={`flex items-center justify-center h-full text-sm text-muted-foreground ${bg}`}
    >
      {label}
    </div>
  );
}

export function SplitViewPage() {
  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">SplitView</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/layout
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          A resizable two-panel layout with a draggable divider. Defaults to
          a 55/45 split. Built on top of{" "}
          <code className="text-foreground">react-resizable-panels</code>.
        </p>

        {/* Live demo */}
        <div className="h-[280px] rounded-xl border border-border overflow-hidden">
          <SplitView
            left={
              <PanelPlaceholder label="Left panel (drag the divider)" bg="bg-secondary/30" />
            }
            right={
              <PanelPlaceholder label="Right panel" bg="bg-secondary/50" />
            }
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Drag the divider between panels to resize.
        </p>
      </div>

      {/* Props */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Props</h2>
        <PropsTable props={SPLIT_VIEW_PROPS} />
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Start</h2>
        <CodeBlock code={QUICK_START_CODE} />
      </div>

      {/* Custom Sizes */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Custom Sizes</h2>
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          Override the default 55/45 split and minimum sizes with percentage
          values. The parent container must have a defined height.
        </p>
        <CodeBlock code={CUSTOM_SIZES_CODE} />
      </div>
    </div>
  );
}
