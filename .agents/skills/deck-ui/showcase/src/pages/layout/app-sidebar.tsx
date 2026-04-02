import { useState } from "react";
import { AppSidebar } from "@deck-ui/layout";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  SAMPLE_ITEMS,
  SIDEBAR_PROPS,
  QUICK_START_CODE,
  CALLBACKS_CODE,
} from "./app-sidebar-data";

export function AppSidebarPage() {
  const [items, setItems] = useState(SAMPLE_ITEMS);
  const [selectedId, setSelectedId] = useState<string | null>("p1");

  const handleAdd = () => {
    const id = `p${Date.now()}`;
    setItems((prev) => [...prev, { id, name: `Project ${prev.length + 1}` }]);
    setSelectedId(id);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) {
      setSelectedId(items.length > 1 ? items[0].id : null);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">AppSidebar</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/layout
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          A 200px fixed sidebar for item navigation. Includes a logo header,
          add button, section label, and keyboard-driven delete. The main
          content area is rendered as children to the right.
        </p>

        {/* Live demo */}
        <div className="h-[320px] rounded-xl border border-border overflow-hidden flex">
          <AppSidebar
            logo={
              <span className="text-sm font-semibold text-foreground">
                My App
              </span>
            }
            items={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={handleAdd}
            onDelete={handleDelete}
            sectionLabel="Projects"
          >
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              {selectedId ? (
                <span>
                  Selected:{" "}
                  <code className="text-foreground">{selectedId}</code>
                </span>
              ) : (
                "No item selected"
              )}
            </div>
          </AppSidebar>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Click + to add items. Focus an item and press Delete to remove it.
        </p>
      </div>

      {/* Props */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Props</h2>
        <PropsTable props={SIDEBAR_PROPS} />
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Start</h2>
        <CodeBlock code={QUICK_START_CODE} />
      </div>

      {/* Callbacks */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Add & Delete</h2>
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          Provide <code className="text-foreground">onAdd</code> to show the
          + button. Provide{" "}
          <code className="text-foreground">onDelete</code> to enable
          keyboard deletion (Delete or Backspace while an item is focused).
        </p>
        <CodeBlock code={CALLBACKS_CODE} />
      </div>
    </div>
  );
}
