import { useState } from "react";
import { KanbanBoard } from "@deck-ui/board";
import type { KanbanItem } from "@deck-ui/board";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  SAMPLE_COLUMNS,
  SAMPLE_ITEMS,
  QUICK_START_CODE,
  BOARD_CALLBACKS_CODE,
  CUSTOM_CARD_CODE,
  DETAIL_PANEL_CODE,
  TYPES_CODE,
  BOARD_PROPS,
  COLUMN_PROPS,
  CARD_PROPS,
  DETAIL_PANEL_PROPS,
} from "./kanban-board-data";

export function KanbanBoardPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState(SAMPLE_ITEMS);

  const handleApprove = (item: KanbanItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "done" } : i)),
    );
  };

  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">Kanban Board</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/board
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          A column-based kanban board that groups items by status, with animated
          cards that glow when AI agents are running.
        </p>
        <div className="h-[400px] rounded-xl border border-border overflow-hidden">
          <KanbanBoard
            columns={SAMPLE_COLUMNS}
            items={items}
            selectedId={selectedId}
            onSelect={(item) => setSelectedId(item.id)}
            onApprove={handleApprove}
            runningStatuses={["running"]}
            approveStatuses={["needs_you"]}
          />
        </div>
        {selectedId && (
          <p className="text-sm text-muted-foreground mt-2">
            Selected: <code className="text-foreground">{selectedId}</code>
          </p>
        )}
      </div>

      {/* Architecture */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Architecture</h2>
        <pre className="text-[13px] text-muted-foreground bg-secondary rounded-lg p-4 leading-relaxed font-mono">
          {[
            "KanbanBoard            ← entry point, groups items into columns",
            "├── KanbanColumn       ← one per column, animates card list",
            "│   └── KanbanCard     ← individual card with status glow",
            "└── KanbanDetailPanel  ← independent side panel",
          ].join("\n")}
        </pre>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Start</h2>
        <CodeBlock code={QUICK_START_CODE} />
      </div>

      <hr className="border-border" />

      {/* KanbanBoard */}
      <ComponentSection
        name="KanbanBoard"
        description="Top-level component. Pass column definitions, items, and callbacks. Items are automatically grouped into columns by matching status values."
        props={BOARD_PROPS}
        codeLabel="With callbacks"
        code={BOARD_CALLBACKS_CODE}
      />

      {/* KanbanColumn */}
      <ComponentSection
        name="KanbanColumn"
        description="Renders a single column with an animated card list. Used internally by KanbanBoard — use directly only for custom board layouts."
        props={COLUMN_PROPS}
      />

      {/* KanbanCard */}
      <ComponentSection
        name="KanbanCard"
        description="Individual card with title, subtitle, status glow, and optional delete/approve actions. Override the default card by passing renderCard to KanbanBoard."
        props={CARD_PROPS}
        codeLabel="Custom card renderer"
        code={CUSTOM_CARD_CODE}
      />

      {/* KanbanDetailPanel */}
      <ComponentSection
        name="KanbanDetailPanel"
        description="Side panel for displaying details of a selected item. Independent of the board — use it anywhere. Shows a spinning indicator for running statuses."
        props={DETAIL_PANEL_PROPS}
        codeLabel="Usage"
        code={DETAIL_PANEL_CODE}
      />

      <hr className="border-border" />

      {/* Types */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Types</h2>
        <CodeBlock code={TYPES_CODE} language="typescript" />
      </div>
    </div>
  );
}

/* ── Sub-component section ───────────────────────────────────── */

function ComponentSection({
  name,
  description,
  props,
  code,
  codeLabel,
}: {
  name: string;
  description: string;
  props: import("../../components/props-table").PropDef[];
  code?: string;
  codeLabel?: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-1">{name}</h2>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            Props
          </h3>
          <PropsTable props={props} />
        </div>
        {code && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">
              {codeLabel ?? "Usage"}
            </h3>
            <CodeBlock code={code} />
          </div>
        )}
      </div>
    </div>
  );
}
