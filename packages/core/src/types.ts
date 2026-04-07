/**
 * Events emitted from the Rust backend via houston-tauri.
 *
 * Mirrors the Rust `HoustonEvent` enum in `houston-tauri/src/events.rs`.
 * Apps can extend this with app-specific event types.
 */
export type HoustonEvent =
  | {
      type: "FeedItem";
      data: { session_key: string; item: { feed_type: string; data: unknown } };
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
      type: "IssueOutputFilesChanged";
      data: { issue_id: string; files: string[] };
    }
  | {
      type: "IssueTitleChanged";
      data: { issue_id: string; title: string };
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
      type: "RoutineRunChanged";
      data: { routine_id: string; run_id: string; status: string };
    }
  | {
      type: "RoutinesChanged";
      data: { project_id: string };
    }
  | {
      type: "ConversationsChanged";
      data: { project_id: string; workspace_path: string };
    }
  | {
      type: "ActivityChanged";
      data: { workspace_path: string };
    }
  | {
      type: "SkillsChanged";
      data: { workspace_path: string };
    }
  | {
      type: "LearningsChanged";
      data: { workspace_path: string };
    }
  | {
      type: "ChannelsConfigChanged";
      data: { workspace_path: string };
    }
  | {
      type: "FilesChanged";
      data: { workspace_path: string };
    }
  | {
      type: "ConfigChanged";
      data: { workspace_path: string };
    }
  | {
      type: "ContextChanged";
      data: { workspace_path: string };
    };
