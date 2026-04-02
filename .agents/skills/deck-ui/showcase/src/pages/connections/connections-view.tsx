import { ConnectionsView } from "@deck-ui/connections";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  SAMPLE_CONNECTIONS,
  SAMPLE_CHANNELS,
  QUICK_START_CODE,
  CONNECTION_ROW_CODE,
  CHANNEL_CARD_CODE,
  TYPES_CODE,
  VIEW_PROPS,
  ROW_PROPS,
  CHANNEL_CARD_PROPS,
  CHANNELS_SECTION_PROPS,
} from "./connections-view-data";

export function ConnectionsViewPage() {
  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">ConnectionsView</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/connections
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Full-page view for managing connected apps and channel integrations.
          Handles five states automatically: loading, not_configured, needs_auth,
          error, and ok (with connections grid + channels section).
        </p>
        <div className="min-h-[420px] rounded-xl border border-border overflow-hidden">
          <ConnectionsView
            result={{ status: "ok", connections: SAMPLE_CONNECTIONS }}
            loading={false}
            onRetry={() => console.log("Retry")}
            onManage={() => console.log("Manage")}
            channels={SAMPLE_CHANNELS}
            onChannelConnect={(ch) => console.log("Connect:", ch.id)}
            onChannelDisconnect={(ch) => console.log("Disconnect:", ch.id)}
            onAddChannel={(type) => console.log("Add channel:", type)}
          />
        </div>
      </div>

      {/* Architecture */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Architecture</h2>
        <pre className="text-[13px] text-muted-foreground bg-secondary rounded-lg p-4 leading-relaxed font-mono">
          {[
            "ConnectionsView             <- entry point, state machine for result status",
            "├── ConnectionRow            <- single app row with logo + connected badge",
            "└── ChannelsSection          <- section header + Add Channel dropdown",
            "    └── ChannelConnectionCard <- channel card with status + action buttons",
          ].join("\n")}
        </pre>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Start</h2>
        <CodeBlock code={QUICK_START_CODE} />
      </div>

      <hr className="border-border" />

      {/* ConnectionsView */}
      <ComponentSection
        name="ConnectionsView"
        description="Top-level component. Pass a ConnectionsResult to control which state is shown. When status is 'ok', displays a grid of ConnectionRow items and an optional ChannelsSection below."
        props={VIEW_PROPS}
      />

      {/* ConnectionRow */}
      <ComponentSection
        name="ConnectionRow"
        description="Displays a single connected app with logo (initial-letter fallback on error), name, email or description, and a green checkmark badge."
        props={ROW_PROPS}
        codeLabel="Standalone usage"
        code={CONNECTION_ROW_CODE}
      />

      {/* ChannelConnectionCard */}
      <ComponentSection
        name="ChannelConnectionCard"
        description="Card for a Slack or Telegram channel connection. Shows status dot, message count, last active date, and connect/disconnect/configure/delete action buttons."
        props={CHANNEL_CARD_PROPS}
        codeLabel="Standalone usage"
        code={CHANNEL_CARD_CODE}
      />

      {/* ChannelsSection */}
      <ComponentSection
        name="ChannelsSection"
        description="Section wrapper with header, Add Channel dropdown, empty state, and a list of ChannelConnectionCards. Used internally by ConnectionsView."
        props={CHANNELS_SECTION_PROPS}
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
