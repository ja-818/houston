import { useState } from "react";
import { HeartbeatConfigPanel } from "@deck-ui/routines";
import type { HeartbeatConfig } from "@deck-ui/routines";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  DEFAULT_HEARTBEAT,
  USAGE_CODE,
  HEARTBEAT_TYPE_CODE,
  HEARTBEAT_PROPS,
} from "./heartbeat-config-data";

export function HeartbeatConfigPage() {
  const [heartbeat, setHeartbeat] = useState<HeartbeatConfig>(DEFAULT_HEARTBEAT);

  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">HeartbeatConfigPanel</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/routines
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Configuration form for agent heartbeat check-ins. Includes an
          enable toggle, interval picker, prompt editor, active hours, and
          an advanced section for the suppression token.
        </p>
        <div className="max-w-md rounded-xl border border-border p-6">
          <HeartbeatConfigPanel config={heartbeat} onChange={setHeartbeat} />
        </div>
      </div>

      {/* Props */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Props</h2>
        <PropsTable props={HEARTBEAT_PROPS} />
      </div>

      {/* Usage */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Usage</h2>
        <CodeBlock code={USAGE_CODE} />
      </div>

      <hr className="border-border" />

      {/* Types */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Types</h2>
        <CodeBlock code={HEARTBEAT_TYPE_CODE} language="typescript" />
      </div>
    </div>
  );
}
