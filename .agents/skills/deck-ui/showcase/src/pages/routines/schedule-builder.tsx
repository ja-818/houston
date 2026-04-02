import { useState } from "react";
import { ScheduleBuilder } from "@deck-ui/routines";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  USAGE_CODE,
  CUSTOM_PRESETS_CODE,
  PRESET_TYPE_CODE,
  SCHEDULE_PROPS,
} from "./schedule-builder-data";

export function ScheduleBuilderPage() {
  const [cron, setCron] = useState("0 9 * * *");

  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">ScheduleBuilder</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/routines
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Visual cron schedule builder with preset buttons. Supports
          every-30-min through monthly presets, plus a custom cron input.
          Shows context-specific fields (time picker, day-of-week, day-of-month)
          based on the active preset.
        </p>
        <div className="max-w-md rounded-xl border border-border p-6">
          <ScheduleBuilder value={cron} onChange={setCron} />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Current value: <code className="text-foreground font-mono">{cron}</code>
        </p>
      </div>

      {/* Props */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Props</h2>
        <PropsTable props={SCHEDULE_PROPS} />
      </div>

      {/* Usage */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Usage</h2>
        <CodeBlock code={USAGE_CODE} />
      </div>

      {/* Custom presets */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Custom Presets</h2>
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          Pass a subset of presets to limit which buttons are shown.
        </p>
        <CodeBlock code={CUSTOM_PRESETS_CODE} />
      </div>

      <hr className="border-border" />

      {/* Types */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Types</h2>
        <CodeBlock code={PRESET_TYPE_CODE} language="typescript" />
      </div>
    </div>
  );
}
