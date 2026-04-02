import { RoutinesGrid } from "@deck-ui/routines";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  SAMPLE_ROUTINES,
  QUICK_START_CODE,
  ROUTINE_CARD_CODE,
  TYPES_CODE,
  GRID_PROPS,
  CARD_PROPS,
} from "./routines-grid-data";

export function RoutinesGridPage() {
  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">RoutinesGrid</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/routines
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          A responsive card grid for displaying configured routines. Cards are
          sorted by status (active first, then needs_setup, error, paused) and
          then alphabetically. Shows empty and loading states automatically.
        </p>
        <div className="h-[340px] rounded-xl border border-border overflow-hidden">
          <RoutinesGrid
            routines={SAMPLE_ROUTINES}
            onSelectRoutine={(id) => console.log("Select routine:", id)}
          />
        </div>
      </div>

      {/* Architecture */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Architecture</h2>
        <pre className="text-[13px] text-muted-foreground bg-secondary rounded-lg p-4 leading-relaxed font-mono">
          {[
            "RoutinesGrid       ← entry point, sorts routines, handles empty/loading",
            "└── RoutineCard    ← individual card with status dot, trigger label, run count",
          ].join("\n")}
        </pre>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Start</h2>
        <CodeBlock code={QUICK_START_CODE} />
      </div>

      <hr className="border-border" />

      {/* RoutinesGrid */}
      <ComponentSection
        name="RoutinesGrid"
        description="Top-level component. Pass routines and a selection callback. Items are automatically sorted by status priority, then alphabetically by name. Shows empty state or loading spinner when appropriate."
        props={GRID_PROPS}
      />

      {/* RoutineCard */}
      <ComponentSection
        name="RoutineCard"
        description="Individual routine card showing name, description, status dot, trigger type, run count, and last run date. Used internally by RoutinesGrid."
        props={CARD_PROPS}
        codeLabel="Standalone usage"
        code={ROUTINE_CARD_CODE}
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
