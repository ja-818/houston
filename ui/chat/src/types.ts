// Chat-related types extracted from Houston's type system.
// Only the types needed by chat components are included here.

export type FeedItem =
  | { feed_type: "assistant_text"; data: string }
  | { feed_type: "assistant_text_streaming"; data: string }
  | { feed_type: "thinking"; data: string }
  | { feed_type: "thinking_streaming"; data: string }
  | { feed_type: "user_message"; data: string }
  | { feed_type: "tool_call"; data: { name: string; input: unknown } }
  | { feed_type: "tool_result"; data: { content: string; is_error: boolean } }
  | { feed_type: "system_message"; data: string }
  | {
      feed_type: "file_changes";
      data: { created: string[]; modified: string[] };
    }
  | {
      feed_type: "final_result";
      data: {
        result: string;
        cost_usd: number | null;
        duration_ms: number | null;
      };
    };

export type RunStatus =
  | "running"
  | "completed"
  | "failed"
  | "approved"
  | "needs_you"
  | "done"
  | "error";
