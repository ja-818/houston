import type { KanbanItem } from "@houston-ai/board";
import type { FeedItem } from "@houston-ai/chat";

export type MissionSearchMode = "none" | "title" | "text";

export interface MissionSearchResult<T> {
  items: T[];
  mode: MissionSearchMode;
  query: string;
  hasQuery: boolean;
}

const COMBINING_MARKS = /[\u0300-\u036f]/g;

export function normalizeMissionSearchQuery(value: string): string {
  return value
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .trim()
    .toLocaleLowerCase();
}

function queryTerms(query: string): string[] {
  return normalizeMissionSearchQuery(query).split(/\s+/).filter(Boolean);
}

function matchesTerms(value: string | undefined, terms: string[]): boolean {
  if (!value || terms.length === 0) return false;
  const normalized = normalizeMissionSearchQuery(value);
  return terms.every((term) => normalized.includes(term));
}

function feedValueToText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function feedItemToSearchText(item: FeedItem): string {
  switch (item.feed_type) {
    case "tool_call":
      return `${item.data.name} ${feedValueToText(item.data.input)}`;
    case "tool_result":
      return item.data.content;
    case "file_changes":
      return [...item.data.created, ...item.data.modified].join("\n");
    case "final_result":
      return item.data.result;
    default:
      return feedValueToText(item.data);
  }
}

export function buildMissionHistorySearchText(items: FeedItem[]): string {
  return items.map(feedItemToSearchText).filter(Boolean).join("\n");
}

export function searchMissions<T extends KanbanItem>(
  items: T[],
  rawQuery: string,
  historyTextById: Record<string, string> = {},
): MissionSearchResult<T> {
  const query = normalizeMissionSearchQuery(rawQuery);
  const terms = queryTerms(rawQuery);
  if (terms.length === 0) {
    return { items, mode: "none", query, hasQuery: false };
  }

  const titleMatches = items.filter((item) => matchesTerms(item.title, terms));
  if (titleMatches.length > 0) {
    return { items: titleMatches, mode: "title", query, hasQuery: true };
  }

  const textMatches = items.filter((item) => {
    const text = [item.description, historyTextById[item.id]]
      .filter(Boolean)
      .join("\n");
    return matchesTerms(text, terms);
  });

  return { items: textMatches, mode: "text", query, hasQuery: true };
}
