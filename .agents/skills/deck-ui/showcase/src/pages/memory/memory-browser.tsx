import { useState } from "react";
import type { MemoryCategory } from "@deck-ui/memory";
import { MemoryBrowser } from "@deck-ui/memory";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  SAMPLE_MEMORIES,
  QUICK_START_CODE,
  MEMORY_GRID_CODE,
  MEMORY_CARD_CODE,
  MEMORY_DETAIL_CODE,
  MEMORY_SEARCH_CODE,
  CATEGORY_FILTER_CODE,
  MEMORY_EMPTY_CODE,
  TYPES_CODE,
} from "./memory-browser-data";
import {
  MEMORY_BROWSER_PROPS,
  MEMORY_GRID_PROPS,
  MEMORY_CARD_PROPS,
  MEMORY_DETAIL_PROPS,
  MEMORY_SEARCH_PROPS,
  CATEGORY_FILTER_PROPS,
  MEMORY_EMPTY_PROPS,
} from "./memory-browser-props";

export function MemoryBrowserPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MemoryCategory | null>(null);

  const filtered = SAMPLE_MEMORIES.filter((m) => {
    if (category && m.category !== category) return false;
    if (search && !m.content.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">MemoryBrowser</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/memory
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Search, filter, and browse agent memories by category. Combines a
          search input, category pill filter, and a responsive card grid with
          loading skeletons and empty state.
        </p>
        <div className="h-[500px] rounded-xl border border-border overflow-hidden">
          <MemoryBrowser
            memories={filtered}
            searchQuery={search}
            onSearch={setSearch}
            selectedCategory={category}
            onCategoryFilter={setCategory}
            onMemoryClick={(m) => console.log("Memory clicked:", m.id)}
            onMemoryDelete={(m) => console.log("Memory delete:", m.id)}
            onMemoryCreate={() => console.log("Create memory")}
          />
        </div>
      </div>

      {/* Architecture */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Architecture</h2>
        <pre className="text-[13px] text-muted-foreground bg-secondary rounded-lg p-4 leading-relaxed font-mono">
          {[
            "MemoryBrowser            <- entry point, toolbar + grid",
            "├── MemorySearch         <- debounced search input",
            "├── MemoryCategoryFilter <- horizontal category pills",
            "├── MemoryGrid           <- responsive card grid + skeletons",
            "│   └── MemoryCard       <- individual memory card",
            "├── MemoryDetail         <- full view with inline editing",
            "└── MemoryEmpty          <- empty state",
          ].join("\n")}
        </pre>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Start</h2>
        <CodeBlock code={QUICK_START_CODE} />
      </div>

      <hr className="border-border" />

      <ComponentSection
        name="MemoryBrowser"
        description="Top-level orchestrator. Renders MemorySearch (when onSearch is provided), MemoryCategoryFilter (when onCategoryFilter is provided), an 'Add Memory' button (when onMemoryCreate is provided), and MemoryGrid. Shows MemoryEmpty when the list is empty."
        props={MEMORY_BROWSER_PROPS}
      />
      <ComponentSection
        name="MemoryGrid"
        description="Responsive card grid (1/2/3 columns). Shows 6 skeleton cards when loading is true and memories is empty."
        props={MEMORY_GRID_PROPS}
        code={MEMORY_GRID_CODE}
      />
      <ComponentSection
        name="MemoryCard"
        description="Individual card with a category badge + icon, content preview (3-line clamp), tags, source label, and a hover-visible delete button."
        props={MEMORY_CARD_PROPS}
        code={MEMORY_CARD_CODE}
      />
      <ComponentSection
        name="MemoryDetail"
        description="Full memory view with inline editing for content and tags. Shows category badge, source, timestamps. Edit mode includes a textarea and comma-separated tag input with save/cancel."
        props={MEMORY_DETAIL_PROPS}
        code={MEMORY_DETAIL_CODE}
      />
      <ComponentSection
        name="MemorySearch"
        description="Search input with a magnifying glass icon and 300ms debounced onChange. Syncs with the controlled value prop."
        props={MEMORY_SEARCH_PROPS}
        code={MEMORY_SEARCH_CODE}
      />
      <ComponentSection
        name="MemoryCategoryFilter"
        description="Horizontal row of category pill buttons -- conversation, preference, context, skill, fact -- plus an 'All' button. Optional badge counts per category."
        props={CATEGORY_FILTER_PROPS}
        code={CATEGORY_FILTER_CODE}
      />
      <ComponentSection
        name="MemoryEmpty"
        description="Empty state using the shared Empty component from @deck-ui/core."
        props={MEMORY_EMPTY_PROPS}
        code={MEMORY_EMPTY_CODE}
      />

      <hr className="border-border" />

      {/* Types */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Types</h2>
        <CodeBlock code={TYPES_CODE} language="typescript" />
      </div>
    </div>
  );
}

/* -- Sub-component section ------------------------------------------------ */

function ComponentSection({
  name,
  description,
  props,
  code,
  codeLabel,
}: {
  name: string;
  description: string;
  props: import("../../components/props-table").PropDef[];
  code?: string;
  codeLabel?: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-1">{name}</h2>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            Props
          </h3>
          <PropsTable props={props} />
        </div>
        {code && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">
              {codeLabel ?? "Usage"}
            </h3>
            <CodeBlock code={code} />
          </div>
        )}
      </div>
    </div>
  );
}
