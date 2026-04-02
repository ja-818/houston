import type { PropDef } from "../../components/props-table";

/* ── Code examples ───────────────────────────────────────────── */

export const BASIC_CODE = `import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@deck-ui/core"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

export const CONTROLLED_CODE = `const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Controlled Dialog</DialogTitle>
      <DialogDescription>
        Manage open state externally for programmatic control.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter showCloseButton>
      <Button onClick={() => { save(); setOpen(false) }}>
        Save
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

export const NO_CLOSE_CODE = `<DialogContent showCloseButton={false}>
  <DialogHeader>
    <DialogTitle>Processing...</DialogTitle>
    <DialogDescription>
      Please wait while we complete the operation.
    </DialogDescription>
  </DialogHeader>
</DialogContent>`;

/* ── Props definitions ───────────────────────────────────────── */

export const DIALOG_PROPS: PropDef[] = [
  { name: "open", type: "boolean", description: "Controlled open state" },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
  { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state (uncontrolled)" },
  { name: "modal", type: "boolean", default: "true", description: "Whether the dialog blocks interaction with the rest of the page" },
];

export const DIALOG_TRIGGER_PROPS: PropDef[] = [
  { name: "asChild", type: "boolean", default: "false", description: "Merge props onto child element instead of rendering a button" },
  { name: "children", type: "ReactNode", description: "Trigger element" },
];

export const DIALOG_CONTENT_PROPS: PropDef[] = [
  { name: "showCloseButton", type: "boolean", default: "true", description: "Show the X close button in the top-right corner" },
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Dialog body (DialogHeader, form content, DialogFooter)" },
  { name: "onOpenAutoFocus", type: "(e: Event) => void", description: "Called when focus moves into the dialog on open" },
  { name: "onCloseAutoFocus", type: "(e: Event) => void", description: "Called when focus returns after close" },
  { name: "onEscapeKeyDown", type: "(e: KeyboardEvent) => void", description: "Called on Escape — call e.preventDefault() to prevent close" },
];

export const DIALOG_HEADER_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Typically DialogTitle and DialogDescription" },
];

export const DIALOG_TITLE_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Title text" },
];

export const DIALOG_DESCRIPTION_PROPS: PropDef[] = [
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Description text" },
];

export const DIALOG_FOOTER_PROPS: PropDef[] = [
  { name: "showCloseButton", type: "boolean", default: "false", description: "Append an outline Close button that dismisses the dialog" },
  { name: "className", type: "string", description: "Additional CSS classes" },
  { name: "children", type: "ReactNode", description: "Action buttons" },
];

export const DIALOG_CLOSE_PROPS: PropDef[] = [
  { name: "asChild", type: "boolean", default: "false", description: "Merge props onto child instead of rendering a button" },
  { name: "children", type: "ReactNode", description: "Close trigger element" },
];
