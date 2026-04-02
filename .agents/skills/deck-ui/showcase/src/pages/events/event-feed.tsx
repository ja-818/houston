import { useState } from "react";
import type { EventType } from "@deck-ui/events";
import { EventFeed } from "@deck-ui/events";
import { CodeBlock } from "../../components/code-block";
import { PropsTable } from "../../components/props-table";
import {
  SAMPLE_EVENTS,
  QUICK_START_CODE,
  EVENT_ITEM_CODE,
  EVENT_FILTER_CODE,
  EVENT_EMPTY_CODE,
  TYPES_CODE,
  EVENT_FEED_PROPS,
  EVENT_ITEM_PROPS,
  EVENT_FILTER_PROPS,
  EVENT_EMPTY_PROPS,
} from "./event-feed-data";

export function EventFeedPage() {
  const [filter, setFilter] = useState<EventType | null>(null);

  return (
    <div className="space-y-10">
      {/* Header + Live Demo */}
      <div>
        <h1 className="text-xl font-semibold mb-1">EventFeed</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/events
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Filterable event stream with type indicators, status dots, and
          auto-scroll. Renders heartbeats, messages, cron jobs, webhooks, and
          agent messages with animated enter/exit transitions.
        </p>
        <div className="h-[400px] rounded-xl border border-border overflow-hidden">
          <EventFeed
            events={SAMPLE_EVENTS}
            filter={filter}
            onFilterChange={setFilter}
            onEventClick={(e) => console.log("Event clicked:", e.id)}
            maxHeight="400px"
          />
        </div>
      </div>

      {/* Architecture */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Architecture</h2>
        <pre className="text-[13px] text-muted-foreground bg-secondary rounded-lg p-4 leading-relaxed font-mono">
          {[
            "EventFeed          <- entry point, filter bar + scrollable list",
            "├── EventFilter    <- horizontal pill buttons with badge counts",
            "├── EventItem      <- single event row with icon, summary, status",
            "└── EventEmpty     <- empty state when no events match",
          ].join("\n")}
        </pre>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Start</h2>
        <CodeBlock code={QUICK_START_CODE} />
      </div>

      <hr className="border-border" />

      {/* EventFeed */}
      <ComponentSection
        name="EventFeed"
        description="Top-level component. Pass events, an optional filter, and callbacks. Internally renders EventFilter (when onFilterChange is provided), an animated list of EventItem rows, and EventEmpty when the list is empty."
        props={EVENT_FEED_PROPS}
      />

      {/* EventItem */}
      <ComponentSection
        name="EventItem"
        description="Single event row showing a type icon, summary text, source channel, relative timestamp, and a status indicator dot. Suppressed heartbeats render at reduced opacity with strikethrough text."
        props={EVENT_ITEM_PROPS}
        code={EVENT_ITEM_CODE}
      />

      {/* EventFilter */}
      <ComponentSection
        name="EventFilter"
        description="Horizontal row of pill buttons -- one per EventType plus an 'All' button. Each pill can show a badge count. Clicking a pill toggles the filter; clicking the active pill resets to 'All'."
        props={EVENT_FILTER_PROPS}
        code={EVENT_FILTER_CODE}
      />

      {/* EventEmpty */}
      <ComponentSection
        name="EventEmpty"
        description="Empty state shown when no events match the current filter. Uses the shared Empty component from @deck-ui/core."
        props={EVENT_EMPTY_PROPS}
        code={EVENT_EMPTY_CODE}
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
