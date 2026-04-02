import type { PropDef } from "../../components/props-table";

/* ── Code examples ───────────────────────────────────────────── */

export const BASIC_CODE = `import {
  Card, CardHeader, CardTitle,
  CardDescription, CardContent, CardFooter,
} from "@deck-ui/core"

<Card>
  <CardHeader>
    <CardTitle>Project Settings</CardTitle>
    <CardDescription>
      Manage your project configuration and preferences.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card body content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button size="sm">Save Changes</Button>
  </CardFooter>
</Card>`;

export const WITH_ACTION_CODE = `import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@deck-ui/core"

<Card>
  <CardHeader>
    <CardTitle>Notifications</CardTitle>
    <CardAction>
      <Button variant="ghost" size="sm">Mark all read</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <p>You have 3 unread notifications.</p>
  </CardContent>
</Card>`;

export const MINIMAL_CODE = `<Card className="p-4">
  <CardContent className="px-0">
    A minimal card with just content — no header or footer.
  </CardContent>
</Card>`;

/* ── Props definitions ───────────────────────────────────────── */

export const CARD_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Card sub-components (CardHeader, CardContent, etc.)" },
];

export const CARD_HEADER_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Typically CardTitle, CardDescription, and optionally CardAction" },
];

export const CARD_TITLE_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Title text or elements" },
];

export const CARD_DESCRIPTION_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Description text" },
];

export const CARD_ACTION_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Action elements (buttons, menus) pinned to header top-right" },
];

export const CARD_CONTENT_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Main body content" },
];

export const CARD_FOOTER_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Footer content (actions, metadata)" },
];
