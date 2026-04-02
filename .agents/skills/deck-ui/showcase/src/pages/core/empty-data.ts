import type { PropDef } from "../../components/props-table";

/* ── Code examples ───────────────────────────────────────────── */

export const BASIC_CODE = `import {
  Empty, EmptyHeader, EmptyTitle, EmptyDescription,
} from "@deck-ui/core"

<Empty>
  <EmptyHeader>
    <EmptyTitle>No events</EmptyTitle>
    <EmptyDescription>
      Events will appear here as they happen.
    </EmptyDescription>
  </EmptyHeader>
</Empty>`;

export const WITH_ACTION_CODE = `import {
  Empty, EmptyHeader, EmptyTitle,
  EmptyDescription, EmptyContent, Button,
} from "@deck-ui/core"

<Empty>
  <EmptyHeader>
    <EmptyTitle>No apps connected</EmptyTitle>
    <EmptyDescription>
      Connect services so your agent can use them.
    </EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button className="rounded-full">Add a connection</Button>
  </EmptyContent>
</Empty>`;

/* ── Props definitions ───────────────────────────────────────── */

export const EMPTY_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "EmptyHeader, action buttons, EmptyContent, etc." },
];

export const EMPTY_HEADER_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "EmptyTitle and EmptyDescription" },
];

export const EMPTY_TITLE_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Title text" },
];

export const EMPTY_DESCRIPTION_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Description text. Links inside are auto-styled with underline." },
];

export const EMPTY_CONTENT_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Additional content below the header (forms, buttons, etc.)" },
];
