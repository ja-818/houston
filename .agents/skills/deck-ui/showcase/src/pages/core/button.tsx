import { useState } from "react";
import { Button } from "@deck-ui/core";
import { Plus, Settings, Trash2 } from "lucide-react";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  QUICK_START_CODE,
  VARIANTS_CODE,
  SIZES_CODE,
  ICON_BUTTON_CODE,
  AS_CHILD_CODE,
  BUTTON_PROPS,
} from "./button-data";

const VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

const SIZES = ["xs", "sm", "default", "lg"] as const;

export function ButtonPage() {
  const [clicks, setClicks] = useState(0);

  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">Button</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/core
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Primary action element with multiple variants, sizes, and icon-only
          modes. Supports the asChild pattern for polymorphic rendering.
        </p>
        <div className="rounded-xl border border-border p-6 space-y-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Variants
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {VARIANTS.map((v) => (
                <Button key={v} variant={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Sizes
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {SIZES.map((s) => (
                <Button key={s} size={s}>
                  {s === "default" ? "Default" : s.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Icon buttons
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="icon">
                <Plus />
              </Button>
              <Button size="icon-sm" variant="ghost">
                <Settings />
              </Button>
              <Button size="icon-xs" variant="outline">
                <Trash2 />
              </Button>
              <Button size="icon-lg" variant="secondary">
                <Plus />
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Interactive
            </p>
            <div className="flex items-center gap-3">
              <Button onClick={() => setClicks((c) => c + 1)}>
                Clicked {clicks} {clicks === 1 ? "time" : "times"}
              </Button>
              <Button variant="outline" disabled>
                Disabled
              </Button>
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
        <PropsTable props={BUTTON_PROPS} />
      </div>

      <hr className="border-border" />

      {/* Code Examples */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Variants</h2>
        <CodeBlock code={VARIANTS_CODE} />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Sizes</h2>
        <CodeBlock code={SIZES_CODE} />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Icon Buttons</h2>
        <CodeBlock code={ICON_BUTTON_CODE} />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">As Child</h2>
        <CodeBlock code={AS_CHILD_CODE} />
      </div>
    </div>
  );
}
