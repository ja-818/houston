import { useState } from "react";
import { Input } from "@deck-ui/core";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  QUICK_START_CODE,
  CONTROLLED_CODE,
  TYPES_CODE,
  WITH_LABEL_CODE,
  INPUT_PROPS,
} from "./input-data";

export function InputPage() {
  const [controlled, setControlled] = useState("");

  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">Input</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/core
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Text input field with consistent styling, focus ring, and support for
          all native HTML input types.
        </p>
        <div className="rounded-xl border border-border p-6 space-y-6">
          <div className="max-w-sm space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Default
              </p>
              <Input placeholder="Type something..." />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Controlled
              </p>
              <Input
                value={controlled}
                onChange={(e) => setControlled(e.target.value)}
                placeholder="Controlled input"
              />
              {controlled && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Value: <code className="text-foreground">{controlled}</code>
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Disabled
              </p>
              <Input disabled placeholder="Disabled input" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                With label
              </p>
              <div className="space-y-1.5">
                <label
                  htmlFor="demo-email"
                  className="text-sm font-medium"
                >
                  Email
                </label>
                <Input
                  id="demo-email"
                  type="email"
                  placeholder="you@example.com"
                />
              </div>
            </div>
          </div>
          <div className="max-w-sm">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Input types
            </p>
            <div className="space-y-3">
              <Input type="text" placeholder="Text" />
              <Input type="password" placeholder="Password" />
              <Input type="email" placeholder="Email" />
              <Input type="number" placeholder="Number" />
              <Input type="search" placeholder="Search" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Start</h2>
        <CodeBlock code={QUICK_START_CODE} />
      </div>

      <hr className="border-border" />

      {/* Props */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Props</h2>
        <PropsTable props={INPUT_PROPS} />
      </div>

      <hr className="border-border" />

      {/* Code Examples */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Controlled Input</h2>
        <CodeBlock code={CONTROLLED_CODE} />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Input Types</h2>
        <CodeBlock code={TYPES_CODE} />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">With Label</h2>
        <CodeBlock code={WITH_LABEL_CODE} />
      </div>
    </div>
  );
}
