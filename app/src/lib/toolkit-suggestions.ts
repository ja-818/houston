export interface ToolkitSuggestion {
  id: string;
  toolkits: string[];
  image: string;
}

export const TOOLKIT_SUGGESTIONS: ToolkitSuggestion[] = [
  {
    id: "findLeadsLinkedin",
    toolkits: ["linkedin", "apify"],
    image: "bullseye",
  },
  {
    id: "planMyDay",
    toolkits: ["gmail", "googlecalendar", "outlook"],
    image: "calendar",
  },
  {
    id: "researchAccount",
    toolkits: ["firecrawl", "perplexityai"],
    image: "magnifying-glass-tilted-left",
  },
  {
    id: "draftOutreach",
    toolkits: ["gmail", "outlook", "instantly"],
    image: "envelope",
  },
  {
    id: "writeContent",
    toolkits: ["notion", "googledocs"],
    image: "memo",
  },
  {
    id: "analyzeSpreadsheet",
    toolkits: ["googlesheets"],
    image: "bar-chart",
  },
  {
    id: "manageCrm",
    toolkits: ["hubspot", "salesforce", "pipedrive", "attio"],
    image: "briefcase",
  },
  {
    id: "summarizeCalls",
    toolkits: ["fireflies", "gong"],
    image: "headphone",
  },
];

export function deriveToolkitSuggestions(
  connected: Set<string>,
  max = 3,
): ToolkitSuggestion[] {
  const out: ToolkitSuggestion[] = [];
  for (const suggestion of TOOLKIT_SUGGESTIONS) {
    if (suggestion.toolkits.some((toolkit) => connected.has(toolkit))) {
      out.push(suggestion);
      if (out.length === max) break;
    }
  }
  return out;
}
