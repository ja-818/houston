import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
} from "@deck-ui/core";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  BASIC_CODE,
  CONTROLLED_CODE,
  NO_CLOSE_CODE,
  DIALOG_PROPS,
  DIALOG_TRIGGER_PROPS,
  DIALOG_CONTENT_PROPS,
  DIALOG_HEADER_PROPS,
  DIALOG_TITLE_PROPS,
  DIALOG_DESCRIPTION_PROPS,
  DIALOG_FOOTER_PROPS,
  DIALOG_CLOSE_PROPS,
} from "./dialog-data";

export function DialogPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold mb-1">Dialog</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/core
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          A modal dialog built on Radix UI for focused interactions. Supports
          controlled and uncontrolled modes with animated overlay and content.
        </p>

        {/* Live Demos */}
        <div className="flex flex-wrap gap-3">
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button>Confirmation</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete item?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. The item will be permanently
                  removed.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => setConfirmOpen(false)}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">With Form</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
                <DialogDescription>
                  Enter a name for your new project.
                </DialogDescription>
              </DialogHeader>
              <Input placeholder="Project name" />
              <DialogFooter>
                <Button variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setFormOpen(false)}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Architecture */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Architecture</h2>
        <pre className="text-[13px] text-muted-foreground bg-secondary rounded-lg p-4 leading-relaxed font-mono">
          {[
            "Dialog               ← root provider (manages open state)",
            "├── DialogTrigger    ← button that opens the dialog",
            "└── DialogContent    ← portal + overlay + centered panel",
            "    ├── DialogHeader ← flex column for title area",
            "    │   ├── DialogTitle       ← accessible heading",
            "    │   └── DialogDescription ← accessible description",
            "    ├── (your content)        ← forms, text, etc.",
            "    └── DialogFooter ← action buttons row",
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
      <ComponentSection name="Dialog" description="Root component that manages open/close state. Wraps Radix Dialog.Root." props={DIALOG_PROPS} code={CONTROLLED_CODE} codeLabel="Controlled mode" />
      <ComponentSection name="DialogTrigger" description="Renders a button (or merges onto a child via asChild) that opens the dialog." props={DIALOG_TRIGGER_PROPS} />
      <ComponentSection name="DialogContent" description="The modal panel. Renders inside a portal with an overlay backdrop. Animates in/out with fade and zoom." props={DIALOG_CONTENT_PROPS} code={NO_CLOSE_CODE} codeLabel="Without close button" />
      <ComponentSection name="DialogHeader" description="Flex column container for the title area. Centers text on mobile, left-aligns on desktop." props={DIALOG_HEADER_PROPS} />
      <ComponentSection name="DialogTitle" description="Accessible dialog heading. Required for screen readers." props={DIALOG_TITLE_PROPS} />
      <ComponentSection name="DialogDescription" description="Accessible description in muted foreground. Pairs with DialogTitle for ARIA." props={DIALOG_DESCRIPTION_PROPS} />
      <ComponentSection name="DialogFooter" description="Action button row. Stacks vertically on mobile, horizontal on desktop. Can auto-append a close button." props={DIALOG_FOOTER_PROPS} />
      <ComponentSection name="DialogClose" description="Wraps any element to make it dismiss the dialog on click." props={DIALOG_CLOSE_PROPS} />
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
