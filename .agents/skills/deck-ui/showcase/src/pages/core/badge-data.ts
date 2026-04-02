import type { PropDef } from "../../components/props-table";

/* ── Code examples ───────────────────────────────────────────── */

export const QUICK_START_CODE = `import { Badge } from "@deck-ui/core"

function StatusLabel() {
  return <Badge>Active</Badge>
}`;

export const VARIANTS_CODE = `<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="ghost">Ghost</Badge>
<Badge variant="link">Link</Badge>`;

export const AS_CHILD_CODE = `import { Badge } from "@deck-ui/core"

{/* Renders as an <a> tag with badge styles */}
<Badge asChild>
  <a href="/status">View status</a>
</Badge>`;

export const WITH_ICON_CODE = `import { Badge } from "@deck-ui/core"
import { Circle, AlertTriangle } from "lucide-react"

<Badge variant="secondary">
  <Circle className="fill-green-500 text-green-500" />
  Online
</Badge>
<Badge variant="destructive">
  <AlertTriangle />
  Error
</Badge>`;

/* ── Props definitions ───────────────────────────────────────── */

export const BADGE_PROPS: PropDef[] = [
  {
    name: "variant",
    type: '"default" | "secondary" | "destructive" | "outline" | "ghost" | "link"',
    default: '"default"',
    description: "Visual style of the badge",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description:
      "Merge props onto the child element instead of rendering a <span>",
  },
  {
    name: "className",
    type: "string",
    description: "Additional CSS classes merged via cn()",
  },
  {
    name: "...props",
    type: 'React.ComponentProps<"span">',
    description: "All native span attributes are forwarded",
  },
];
