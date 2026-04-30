import type { StoreRowLabels } from "./add-skill-dialog-store-row"

export interface StoreViewLabels extends StoreRowLabels {
  searchPlaceholder?: string
  noResults?: (query: string) => string
  minQuery?: string
  searchUnavailable?: string
  typeToSearch?: string
}

export const DEFAULT_STORE_VIEW_LABELS: Required<StoreViewLabels> = {
  searchPlaceholder: "Search actions...",
  noResults: (query) => `No actions found for "${query}"`,
  minQuery: "Type at least 2 characters to search",
  searchUnavailable: "Action search is busy. Wait a moment and try again.",
  typeToSearch: "Type to search for actions",
  installCount: (_count, formatted) => `${formatted} installs`,
  installSkill: (name) => `Install ${name}`,
  installedSkill: (name) => `${name} installed`,
}
