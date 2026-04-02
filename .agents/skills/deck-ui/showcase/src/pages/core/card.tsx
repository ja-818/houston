import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@deck-ui/core";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  BASIC_CODE,
  WITH_ACTION_CODE,
  MINIMAL_CODE,
  CARD_PROPS,
  CARD_HEADER_PROPS,
  CARD_TITLE_PROPS,
  CARD_DESCRIPTION_PROPS,
  CARD_ACTION_PROPS,
  CARD_CONTENT_PROPS,
  CARD_FOOTER_PROPS,
} from "./card-data";

export function CardPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold mb-1">Card</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/core
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          A compound container for grouping related content with optional
          header, body, footer, and action slots.
        </p>

        {/* Live Demo */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>
                Manage your project configuration and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Card content goes here with any layout you need.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Save Changes</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardAction>
                <Button variant="ghost" size="sm">Mark all read</Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use CardAction to pin controls to the header top-right.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Architecture */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Architecture</h2>
        <pre className="text-[13px] text-muted-foreground bg-secondary rounded-lg p-4 leading-relaxed font-mono">
          {[
            "Card                 ← outer container with border + shadow",
            "├── CardHeader       ← grid layout for title area",
            "│   ├── CardTitle    ← primary heading",
            "│   ├── CardDescription ← secondary text",
            "│   └── CardAction   ← top-right slot for buttons",
            "├── CardContent      ← main body area",
            "└── CardFooter       ← bottom bar for actions",
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
      <ComponentSection name="Card" description="Root container. Renders a flex column with border, rounded corners, and subtle shadow." props={CARD_PROPS} />
      <ComponentSection name="CardHeader" description="Grid-based header area. Automatically arranges title, description, and action into a responsive layout." props={CARD_HEADER_PROPS} />
      <ComponentSection name="CardTitle" description="Primary heading rendered as a div with semibold weight." props={CARD_TITLE_PROPS} />
      <ComponentSection name="CardDescription" description="Secondary text in muted foreground color." props={CARD_DESCRIPTION_PROPS} />
      <ComponentSection name="CardAction" description="Slots into the top-right of CardHeader. Use for action buttons, menus, or badges." props={CARD_ACTION_PROPS} code={WITH_ACTION_CODE} codeLabel="With header action" />
      <ComponentSection name="CardContent" description="Main body area with horizontal padding. Accepts any content." props={CARD_CONTENT_PROPS} code={MINIMAL_CODE} codeLabel="Minimal card" />
      <ComponentSection name="CardFooter" description="Bottom bar with flex layout. Typically holds action buttons." props={CARD_FOOTER_PROPS} />
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
