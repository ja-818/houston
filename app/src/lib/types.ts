/** A workspace (top-level container, formerly "Space") */
export interface Workspace {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

/** Tab definition in an agent config */
export interface AgentTab {
  /** Tab identifier. Built-in: "chat", "board", "files", "job-description", "integrations", "connections", "routines", "events". Custom: any string. */
  id: string;
  /** Display label in the tab bar */
  label: string;
  /** If this maps to a built-in tab component. Must be one of the built-in IDs. */
  builtIn?: string;
  /** Export name from bundle.js for custom React components */
  customComponent?: string;
  /** Badge source: "activity" shows count of active items */
  badge?: "activity" | "none";
  /** If true, the tab is non-clickable (shown muted in the tab bar). */
  disabled?: boolean;
  /** Optional text chip shown next to the label (e.g. "Soon"). */
  chip?: string;
}

/** Agent category for Houston Store filtering */
export type AgentCategory =
  | "productivity"
  | "development"
  | "research"
  | "creative"
  | "business";

/** The agent config (houston.json schema) */
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  version?: string;
  icon?: string;           // Lucide icon name (fallback if no image)
  image?: string;          // Image URL for store card
  color?: string;          // Brand color override
  category?: AgentCategory;
  author?: string;         // e.g. "Houston" for official, user name for community
  tags?: string[];         // Searchable tags
  tabs: AgentTab[];
  defaultTab?: string;     // Tab ID to show by default, defaults to first tab
  claudeMd?: string;       // CLAUDE.md content template
  systemPrompt?: string;   // System prompt for the assistant
  agentSeeds?: Record<string, string>;  // Files to seed in new agents
  features?: string[];     // Rust feature flags needed
}

/** A resolved agent definition (config + where it came from) */
export interface AgentDefinition {
  config: AgentConfig;
  source: "builtin" | "installed";
  path?: string;           // For installed: ~/.houston/agents/{id}/
  bundleUrl?: string;      // For custom React: URL to bundle.js
}

/** An agent instance (formerly "Workspace") */
export interface Agent {
  id: string;
  name: string;
  folderPath: string;      // ~/Documents/Houston/{WorkspaceName}/{AgentName}/
  configId: string;      // Points to an AgentConfig
  color?: string;        // User-chosen color for avatar
  createdAt: string;
  lastOpenedAt?: string;
}

/** Props injected into every tab component */
export interface TabProps {
  agent: Agent;
  agentDef: AgentDefinition;
}

/** Props injected into custom (bundle.js) tab components */
export interface CustomTabProps extends TabProps {
  readFile: (name: string) => Promise<string>;
  writeFile: (name: string, content: string) => Promise<void>;
  listFiles: () => Promise<Array<{ path: string; name: string; size: number }>>;
  sendMessage: (text: string) => void;
}

/** Skill summary returned by list_skills */
export interface SkillSummary {
  name: string;
  description: string;
  version: number;
  tags: string[];
  created: string | null;
  last_used: string | null;
}

/** Skill detail returned by load_skill */
export interface SkillDetail {
  name: string;
  description: string;
  version: number;
  content: string;
}

/** Community skill search result */
export interface CommunitySkillResult {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
}

/** A skill discovered in a GitHub repo */
export interface RepoSkill {
  id: string;
  name: string;
  description: string;
  path: string;
}

/** File entry returned by list_project_files */
export interface FileEntry {
  path: string;
  name: string;
  extension: string;
  size: number;
}

/** Learnings data returned by load_learnings */
export interface LearningsData {
  entries: { index: number; text: string }[];
  chars: number;
  limit: number;
}

/** A tracked Composio integration for an agent */
export interface TrackedIntegration {
  toolkit: string;
  first_used_at: string;
  last_used_at: string;
  use_count: number;
}

/** A channel entry from .houston/channels.json */
export interface ChannelEntry {
  id: string;
  channel_type: string;
  name: string;
  token: string;
}

/** A listing from the Houston Store registry */
export interface StoreListing {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  tags: string[];
  icon_url: string;
  repo: string;
  installs: number;
  registered_at: string;
}
