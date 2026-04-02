import {
  Button,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@deck-ui/core";
import { ExternalLink } from "lucide-react";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  BASIC_CODE,
  WITH_ACTION_CODE,
  EMPTY_PROPS,
  EMPTY_HEADER_PROPS,
  EMPTY_TITLE_PROPS,
  EMPTY_DESCRIPTION_PROPS,
  EMPTY_CONTENT_PROPS,
} from "./empty-data";

export function EmptyPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold mb-1">Empty</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/core
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          A compound placeholder for views with no content. Supports icons,
          titles, descriptions, and call-to-action buttons.
        </p>

        {/* Live Demos */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Empty className="border rounded-lg py-12">
            <EmptyHeader>
              <EmptyTitle>No messages</EmptyTitle>
              <EmptyDescription>
                Your inbox is empty. New messages will show up here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>

          <Empty className="border rounded-lg py-12">
            <EmptyHeader>
              <EmptyTitle>No routines</EmptyTitle>
              <EmptyDescription>
                Routines run on a schedule — daily reports, weekly research,
                and more.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button className="rounded-full">
                Create a routine
                <ExternalLink className="size-3.5 ml-1.5" />
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </div>

      {/* Architecture */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Architecture</h2>
        <pre className="text-[13px] text-muted-foreground bg-secondary rounded-lg p-4 leading-relaxed font-mono">
          {[
            "Empty                ← centered flex container",
            "├── EmptyHeader      ← groups title + description",
            "│   ├── EmptyTitle   ← large heading",
            "│   └── EmptyDescription ← muted body text",
            "├── EmptyContent     ← optional slot for forms / extra content",
            "└── (actions)        ← buttons placed as direct children",
          ].join("\n")}
        </pre>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Start</h2>
        <CodeBlock code={BASIC_CODE} />
      </div>

      <hr className="border-border" />

      {/* Sub-component sections */}
      <ComponentSection name="Empty" description="Root container. Centered flex column with dashed border styling by default. Add border/rounded classes for a visible boundary." props={EMPTY_PROPS} />
      <ComponentSection name="EmptyHeader" description="Groups the title and description into a centered column with max-width constraint." props={EMPTY_HEADER_PROPS} />
      <ComponentSection name="EmptyTitle" description="Large, semibold heading with tight tracking." props={EMPTY_TITLE_PROPS} />
      <ComponentSection name="EmptyDescription" description="Muted body text with relaxed line height. Links inside are auto-styled with underline." props={EMPTY_DESCRIPTION_PROPS} />
      <ComponentSection name="EmptyContent" description="Optional slot below the header for additional content like forms or button groups. Max-width constrained and centered." props={EMPTY_CONTENT_PROPS} code={WITH_ACTION_CODE} codeLabel="With action" />
    </div>
  );
}

/* ── Sub-component section ───────────────────────────────────── */

function ComponentSection({ name, description, props, code, codeLabel }: {
  name: string;
  description: string;
  props: import("../../components/props-table").PropDef[];
  code?: string;
  codeLabel?: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-1">{name}</h2>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-2">Props</h3>
          <PropsTable props={props} />
        </div>
        {code && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">{codeLabel ?? "Usage"}</h3>
            <CodeBlock code={code} />
          </div>
        )}
      </div>
    </div>
  );
}
