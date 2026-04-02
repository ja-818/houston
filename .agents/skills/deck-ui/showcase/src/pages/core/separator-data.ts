import type { PropDef } from "../../components/props-table";

/* ── Code examples ───────────────────────────────────────────── */

export const QUICK_START_CODE = `import { Separator } from "@deck-ui/core"

function ContentDivider() {
  return (
    <div>
      <p>Section one</p>
      <Separator className="my-4" />
      <p>Section two</p>
    </div>
  )
}`;

export const VERTICAL_CODE = `import { Separator } from "@deck-ui/core"

<div className="flex items-center gap-4 h-8">
  <span>Home</span>
  <Separator orientation="vertical" />
  <span>Settings</span>
  <Separator orientation="vertical" />
  <span>Profile</span>
</div>`;

export const IN_CARD_CODE = `import { Separator } from "@deck-ui/core"

<div className="rounded-xl border p-4">
  <h3 className="font-semibold">Title</h3>
  <p className="text-sm text-muted-foreground">Description</p>
  <Separator className="my-3" />
  <div className="flex gap-2">
    <Button size="sm">Action</Button>
  </div>
</div>`;

/* ── Props definitions ───────────────────────────────────────── */

export const SEPARATOR_PROPS: PropDef[] = [
  {
    name: "orientation",
    type: '"horizontal" | "vertical"',
    default: '"horizontal"',
    description: "Direction of the separator line",
  },
  {
    name: "decorative",
    type: "boolean",
    default: "true",
    description:
      'When true, the separator is purely visual (aria role="none"). Set to false for semantic separation.',
  },
  {
    name: "className",
    type: "string",
    description: "Additional CSS classes merged via cn()",
  },
  {
    name: "...props",
    type: "React.ComponentProps<typeof SeparatorPrimitive.Root>",
    description: "All Radix Separator props are forwarded",
  },
];
