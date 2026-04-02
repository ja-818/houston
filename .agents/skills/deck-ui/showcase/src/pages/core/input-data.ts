import type { PropDef } from "../../components/props-table";

/* ── Code examples ───────────────────────────────────────────── */

export const QUICK_START_CODE = `import { Input } from "@deck-ui/core"

function SearchField() {
  return <Input placeholder="Search..." />
}`;

export const CONTROLLED_CODE = `import { useState } from "react"
import { Input } from "@deck-ui/core"

function NameField() {
  const [name, setName] = useState("")

  return (
    <Input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Enter your name"
    />
  )
}`;

export const TYPES_CODE = `<Input type="text" placeholder="Text" />
<Input type="password" placeholder="Password" />
<Input type="email" placeholder="Email" />
<Input type="number" placeholder="Number" />
<Input type="search" placeholder="Search" />`;

export const WITH_LABEL_CODE = `import { Input } from "@deck-ui/core"

<div className="space-y-1.5">
  <label htmlFor="email" className="text-sm font-medium">
    Email
  </label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>`;

/* ── Props definitions ───────────────────────────────────────── */

export const INPUT_PROPS: PropDef[] = [
  {
    name: "type",
    type: "string",
    default: '"text"',
    description:
      "HTML input type — text, password, email, number, search, etc.",
  },
  {
    name: "placeholder",
    type: "string",
    description: "Placeholder text shown when the input is empty",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables the input and reduces opacity",
  },
  {
    name: "className",
    type: "string",
    description: "Additional CSS classes merged via cn()",
  },
  {
    name: "...props",
    type: 'React.ComponentProps<"input">',
    description:
      "All native input attributes (value, onChange, etc.) are forwarded",
  },
];
