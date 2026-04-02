import type { PropDef } from "../../components/props-table";

/* ── Code examples ───────────────────────────────────────────── */

export const QUICK_START_CODE = `import { Button } from "@deck-ui/core"

function MyApp() {
  return (
    <Button onClick={() => console.log("clicked")}>
      Save changes
    </Button>
  )
}`;

export const VARIANTS_CODE = `<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>`;

export const SIZES_CODE = `<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>`;

export const ICON_BUTTON_CODE = `import { Plus, Settings, Trash2 } from "lucide-react"

<Button size="icon"><Plus /></Button>
<Button size="icon-sm" variant="ghost"><Settings /></Button>
<Button size="icon-xs" variant="outline"><Trash2 /></Button>`;

export const AS_CHILD_CODE = `import { Button } from "@deck-ui/core"

{/* Renders as an <a> tag with button styles */}
<Button asChild>
  <a href="/docs">Read the docs</a>
</Button>`;

/* ── Props definitions ───────────────────────────────────────── */

export const BUTTON_PROPS: PropDef[] = [
  {
    name: "variant",
    type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"',
    default: '"default"',
    description: "Visual style of the button",
  },
  {
    name: "size",
    type: '"default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"',
    default: '"default"',
    description: "Size preset — text sizes include padding, icon sizes are square",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description: "Merge props onto the child element instead of rendering a <button>",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables the button and reduces opacity",
  },
  {
    name: "className",
    type: "string",
    description: "Additional CSS classes merged via cn()",
  },
  {
    name: "...props",
    type: "React.ComponentProps<\"button\">",
    description: "All native button attributes are forwarded",
  },
];
