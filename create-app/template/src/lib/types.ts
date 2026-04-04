export interface Agent {
  name: string;
  path: string;
}

export interface SkillSummary {
  name: string;
  description: string;
  version: number;
  tags: string[];
  created: string | null;
  last_used: string | null;
}

export interface SkillDetail {
  name: string;
  description: string;
  version: number;
  content: string;
}

export interface FileEntry {
  path: string;
  name: string;
  extension: string;
  size: number;
}

/** Events emitted from the Rust backend via keel-tauri */
export type KeelEvent =
  | {
      type: "FeedItem";
      data: { session_key: string; item: import("@deck-ui/chat").FeedItem };
    }
  | {
      type: "SessionStatus";
      data: { session_key: string; status: string; error: string | null };
    }
  | {
      type: "Toast";
      data: { message: string; variant: string };
    };
