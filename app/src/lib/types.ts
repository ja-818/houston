/** A space that contains workspaces */
export interface Space {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

/** Tab definition in an experience manifest */
export interface ExperienceTab {
  /** Tab identifier. Built-in: "chat", "board", "skills", "files", "connections", "context", "routines", "channels", "events", "learnings". Custom: any string. */
  id: string;
  /** Display label in the tab bar */
  label: string;
  /** If this maps to a built-in tab component. Must be one of the built-in IDs. */
  builtIn?: string;
  /** Export name from bundle.js for custom React components */
  customComponent?: string;
  /** Badge source: "tasks" shows count of active tasks */
  badge?: "tasks" | "none";
}

/** Experience category for marketplace filtering */
export type ExperienceCategory =
  | "productivity"
  | "development"
  | "research"
  | "creative"
  | "business";

/** The experience manifest (manifest.json schema) */
export interface ExperienceManifest {
  id: string;
  name: string;
  description: string;
  version?: string;
  icon?: string;           // Lucide icon name
  color?: string;          // Brand color override
  category?: ExperienceCategory;
  author?: string;         // e.g. "Houston" for official, user name for community
  tags?: string[];         // Searchable tags
  tabs: ExperienceTab[];
  defaultTab?: string;     // Tab ID to show by default, defaults to first tab
  claudeMd?: string;       // CLAUDE.md content template
  systemPrompt?: string;   // System prompt for the assistant
  workspaceSeeds?: Record<string, string>;  // Files to seed in new workspaces
  features?: string[];     // Rust feature flags needed
}

/** A resolved experience (manifest + where it came from) */
export interface Experience {
  manifest: ExperienceManifest;
  source: "builtin" | "installed";
  path?: string;           // For installed: ~/.houston/experiences/{id}/
  bundleUrl?: string;      // For custom React: URL to bundle.js
}

/** A user workspace (an instance of an experience) */
export interface Workspace {
  id: string;
  name: string;
  folderPath: string;      // ~/Documents/Houston/{name}/
  experienceId: string;    // Points to an Experience
  createdAt: string;
  lastOpenedAt?: string;
}

/** Props injected into every tab component */
export interface TabProps {
  workspace: Workspace;
  experience: Experience;
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

/** A channel entry from .houston/channels.json */
export interface ChannelEntry {
  id: string;
  channel_type: string;
  name: string;
  token: string;
}
