/** Project from keel-db */
export interface Project {
  id: string;
  name: string;
  folder_path: string;
  created_at: string;
  updated_at: string;
}

/** Issue (kanban card) from keel-db */
export interface Issue {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  tags: string | null;
  position: number;
  session_id: string | null;
  claude_session_id: string | null;
  output_files: string | null;
  created_at: string;
  updated_at: string;
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
      type: "IssueStatusChanged";
      data: { issue_id: string; status: string };
    }
  | {
      type: "IssuesChanged";
      data: { project_id: string };
    }
  | {
      type: "Toast";
      data: { message: string; variant: string };
    }
  | {
      type: "AuthRequired";
      data: { message: string };
    }
  | {
      type: "CompletionToast";
      data: { title: string; issue_id: string | null };
    }
  | {
      type: "EventReceived";
      data: {
        event_id: string;
        event_type: string;
        source_channel: string;
        source_identifier: string;
        summary: string;
      };
    }
  | {
      type: "EventProcessed";
      data: { event_id: string; status: string };
    }
  | {
      type: "HeartbeatFired";
      data: { prompt: string; project_id: string | null };
    }
  | {
      type: "CronFired";
      data: { job_id: string; job_name: string; prompt: string };
    }
  | {
      type: "ChannelMessageReceived";
      data: {
        channel_type: string;
        channel_id: string;
        sender_name: string;
        text: string;
      };
    }
  | {
      type: "ChannelStatusChanged";
      data: {
        channel_id: string;
        channel_type: string;
        status: string;
        error: string | null;
      };
    }
  | {
      type: "MemoryChanged";
      data: { memory_id: string; project_id: string; category: string };
    }
  | {
      type: "MemoryDeleted";
      data: { memory_id: string; project_id: string };
    }
  | {
      type: "RoutineRunChanged";
      data: { routine_id: string; run_id: string; status: string };
    }
  | {
      type: "RoutinesChanged";
      data: { project_id: string };
    };
