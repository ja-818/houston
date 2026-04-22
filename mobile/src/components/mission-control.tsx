import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@houston-ai/core";
import { useMobileStore } from "@/lib/store";
import type { Conversation } from "@/lib/types";
import { ConversationRow } from "./conversation-row";
import { ConnectionIndicator } from "./connection-indicator";
import { NewMissionSheet } from "./new-mission-sheet";
import { AccordionSection, EmptyState } from "./mission-list-parts";

/**
 * Status section definitions in display order.
 *
 * Anything not matching one of the `ids` falls into the "Other" bucket
 * at the end — we never silently drop statuses.
 */
const SECTIONS = [
  { id: "needs_you", label: "Needs you", defaultOpen: true },
  { id: "running", label: "Running", defaultOpen: true },
  { id: "queue", label: "Queued", defaultOpen: true },
  { id: "done", label: "Done", defaultOpen: true },
] as const;

const KNOWN_STATUSES = new Set<string>(SECTIONS.map((s) => s.id));

export function MissionControl() {
  const navigate = useNavigate();
  const connectionState = useMobileStore((s) => s.connectionState);
  const isConnected = useMobileStore((s) => s.isConnected);
  const connected = isConnected();
  const conversations = useMobileStore((s) => s.filteredConversations);
  const agentNames = useMobileStore((s) => s.agentNames);
  const agentFilter = useMobileStore((s) => s.agentFilter);
  const setAgentFilter = useMobileStore((s) => s.setAgentFilter);

  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = conversations();

  // Group by status: known sections first, then "Other" for everything else.
  const { groups, other } = useMemo(() => {
    const map = new Map<string, Conversation[]>();
    for (const c of filtered) {
      const existing = map.get(c.status) ?? [];
      existing.push(c);
      map.set(c.status, existing);
    }

    const known = SECTIONS
      .filter((s) => map.has(s.id))
      .map((s) => ({ ...s, conversations: map.get(s.id)! }));

    const otherBucket: Conversation[] = [];
    for (const [status, items] of map) {
      if (!KNOWN_STATUSES.has(status)) otherBucket.push(...items);
    }

    return { groups: known, other: otherBucket };
  }, [filtered]);

  function handleSelect(convo: Conversation) {
    navigate(`/chat/${convo.id}`);
  }

  const listDimmed = !connected;

  return (
    <div className="flex min-h-full flex-col bg-background safe-top">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-5 pb-2">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold leading-tight">Houston</h1>
          <ConnectionIndicator state={connectionState} className="mt-0.5" />
        </div>
        <Button
          size="sm"
          className="touchable rounded-full gap-1.5 h-9"
          onClick={() => setSheetOpen(true)}
        >
          <Plus className="size-3.5" />
          New mission
        </Button>
      </header>

      {/* Agent filter */}
      <div className="px-4 pt-2 pb-3">
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="h-8 rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground appearance-none pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239b9b9b%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]"
        >
          <option value="all">All agents</option>
          {agentNames.map((a) => (
            <option key={a.id} value={a.name}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Conversation list with accordion sections. Dim when offline so
          stale data is visibly not live. */}
      <div
        className={`flex-1 overflow-y-auto no-scrollbar transition-opacity ${
          listDimmed ? "opacity-60" : "opacity-100"
        }`}
      >
        {groups.map((group) => (
          <AccordionSection
            key={group.id}
            label={group.label}
            count={group.conversations.length}
            defaultOpen={group.defaultOpen}
          >
            {group.conversations.map((convo) => (
              <ConversationRow
                key={convo.id}
                conversation={convo}
                onSelect={() => handleSelect(convo)}
              />
            ))}
          </AccordionSection>
        ))}

        {other.length > 0 && (
          <AccordionSection
            label="Other"
            count={other.length}
            defaultOpen={false}
          >
            {other.map((convo) => (
              <ConversationRow
                key={convo.id}
                conversation={convo}
                onSelect={() => handleSelect(convo)}
              />
            ))}
          </AccordionSection>
        )}

        {/* Empty states */}
        {!connected && groups.length === 0 && other.length === 0 && (
          <EmptyState
            title="Not connected"
            description="Open Houston on your desktop, click the phone icon, and scan the QR code."
          />
        )}
        {connected && groups.length === 0 && other.length === 0 && (
          <EmptyState
            title="No missions yet"
            description="Tap “New mission” to start one from here, or kick one off on your desktop."
          />
        )}
      </div>

      <NewMissionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}

