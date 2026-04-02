import { Separator } from "@deck-ui/core";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  QUICK_START_CODE,
  VERTICAL_CODE,
  IN_CARD_CODE,
  SEPARATOR_PROPS,
} from "./separator-data";

export function SeparatorPage() {
  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">Separator</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/core
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Visual divider between content sections. Built on Radix UI Separator
          with horizontal and vertical orientations.
        </p>
        <div className="rounded-xl border border-border p-6 space-y-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Horizontal
            </p>
            <div className="space-y-3 max-w-md">
              <div>
                <p className="text-sm font-medium">Section title</p>
                <p className="text-sm text-muted-foreground">
                  Description of the first section with some detail.
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Another section</p>
                <p className="text-sm text-muted-foreground">
                  Description of the second section with more detail.
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Final section</p>
                <p className="text-sm text-muted-foreground">
                  Description of the last section.
                </p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Vertical
            </p>
            <div className="flex items-center gap-4 h-8">
              <span className="text-sm">Home</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Settings</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Profile</span>
              <Separator orientation="vertical" />
              <span className="text-sm text-muted-foreground">Logout</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">
              In a card
            </p>
            <div className="rounded-xl border border-border p-4 max-w-sm">
              <h3 className="text-sm font-semibold">Card Title</h3>
              <p className="text-sm text-muted-foreground">
                Card description goes here.
              </p>
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground">
                Footer content below the separator.
              </p>
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
        <PropsTable props={SEPARATOR_PROPS} />
      </div>

      <hr className="border-border" />

      {/* Code Examples */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Vertical Separator</h2>
        <CodeBlock code={VERTICAL_CODE} />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">In a Card</h2>
        <CodeBlock code={IN_CARD_CODE} />
      </div>
    </div>
  );
}
