import { Badge } from "@deck-ui/core";
import { Circle, AlertTriangle, Star, Clock } from "lucide-react";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  QUICK_START_CODE,
  VARIANTS_CODE,
  AS_CHILD_CODE,
  WITH_ICON_CODE,
  BADGE_PROPS,
} from "./badge-data";

const VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const;

export function BadgePage() {
  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">Badge</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/core
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Status indicators and labels. Compact pill-shaped elements for
          categorization, counts, and status display.
        </p>
        <div className="rounded-xl border border-border p-6 space-y-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Variants
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {VARIANTS.map((v) => (
                <Badge key={v} variant={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              With icons
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">
                <Circle className="fill-green-500 text-green-500" />
                Online
              </Badge>
              <Badge variant="destructive">
                <AlertTriangle />
                Error
              </Badge>
              <Badge variant="outline">
                <Star />
                Featured
              </Badge>
              <Badge variant="secondary">
                <Clock />
                Pending
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              As link
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge asChild>
                <a href="#badge">Clickable default</a>
              </Badge>
              <Badge variant="secondary" asChild>
                <a href="#badge">Clickable secondary</a>
              </Badge>
              <Badge variant="outline" asChild>
                <a href="#badge">Clickable outline</a>
              </Badge>
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
        <PropsTable props={BADGE_PROPS} />
      </div>

      <hr className="border-border" />

      {/* Code Examples */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Variants</h2>
        <CodeBlock code={VARIANTS_CODE} />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">With Icons</h2>
        <CodeBlock code={WITH_ICON_CODE} />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">As Child</h2>
        <CodeBlock code={AS_CHILD_CODE} />
      </div>
    </div>
  );
}
