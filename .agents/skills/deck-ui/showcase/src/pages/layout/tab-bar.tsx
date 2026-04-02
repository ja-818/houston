import { useState } from "react";
import { TabBar } from "@deck-ui/layout";
import { Button } from "@deck-ui/core";
import { Plus, Settings } from "lucide-react";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  SAMPLE_TABS,
  TAB_BAR_PROPS,
  QUICK_START_CODE,
  ACTIONS_CODE,
} from "./tab-bar-data";

export function TabBarPage() {
  const [activeTab, setActiveTab] = useState("chat");
  const [showActions, setShowActions] = useState(true);

  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">TabBar</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/layout
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Horizontal tab navigation with a title row, badge counts, and
          optional action and menu slots. Used as the primary navigation
          within a content area.
        </p>

        {/* Demo controls */}
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showActions}
              onChange={(e) => setShowActions(e.target.checked)}
              className="rounded"
            />
            Show actions
          </label>
        </div>

        {/* Live demo */}
        <div className="rounded-xl border border-border overflow-hidden">
          <TabBar
            title="My Project"
            tabs={SAMPLE_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            actions={
              showActions ? (
                <>
                  <Button variant="ghost" size="icon" className="size-8">
                    <Plus className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8">
                    <Settings className="size-4" />
                  </Button>
                </>
              ) : undefined
            }
            menu={
              showActions ? (
                <span className="text-xs text-muted-foreground">v2.1</span>
              ) : undefined
            }
          />
          <div className="h-20 flex items-center justify-center text-sm text-muted-foreground border-t border-border">
            Active tab: <code className="ml-1 text-foreground">{activeTab}</code>
          </div>
        </div>
      </div>

      {/* Props */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Props</h2>
        <PropsTable props={TAB_BAR_PROPS} />
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Start</h2>
        <CodeBlock code={QUICK_START_CODE} />
      </div>

      {/* With Actions */}
      <div>
        <h2 className="text-sm font-semibold mb-3">With Actions & Menu</h2>
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          Use the <code className="text-foreground">actions</code> slot for
          right-aligned buttons and{" "}
          <code className="text-foreground">menu</code> for content next to
          the title.
        </p>
        <CodeBlock code={ACTIONS_CODE} />
      </div>
    </div>
  );
}
