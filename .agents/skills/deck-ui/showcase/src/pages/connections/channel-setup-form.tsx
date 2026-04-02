import { useState } from "react";
import { ChannelSetupForm } from "@deck-ui/connections";
import type { ChannelType } from "@deck-ui/connections";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import { USAGE_CODE, FORM_PROPS } from "./channel-setup-form-data";

export function ChannelSetupFormPage() {
  const [channelType, setChannelType] = useState<ChannelType>("slack");

  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">ChannelSetupForm</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/connections
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Configuration form for Slack or Telegram channel setup. Shows
          type-specific fields — Slack requires bot token + app token, Telegram
          requires a single bot token. Includes a Test Connection submit button
          and optional Cancel.
        </p>

        {/* Type switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setChannelType("slack")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              channelType === "slack"
                ? "bg-accent text-foreground font-medium border-border"
                : "text-muted-foreground border-transparent hover:bg-accent/50"
            }`}
          >
            Slack
          </button>
          <button
            onClick={() => setChannelType("telegram")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              channelType === "telegram"
                ? "bg-accent text-foreground font-medium border-border"
                : "text-muted-foreground border-transparent hover:bg-accent/50"
            }`}
          >
            Telegram
          </button>
        </div>

        <div className="max-w-md rounded-xl border border-border p-6">
          <ChannelSetupForm
            type={channelType}
            onSubmit={(config) => console.log("Submit:", config)}
            onCancel={() => console.log("Cancel")}
            loading={false}
            error={null}
          />
        </div>
      </div>

      {/* Props */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Props</h2>
        <PropsTable props={FORM_PROPS} />
      </div>

      {/* Usage */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Usage</h2>
        <CodeBlock code={USAGE_CODE} />
      </div>
    </div>
  );
}
