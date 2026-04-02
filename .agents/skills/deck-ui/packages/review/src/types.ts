export type RunStatus =
  | "running"
  | "completed"
  | "failed"
  | "approved"
  | "needs_you"
  | "done"
  | "error";

export interface ReviewItemData {
  id: string;
  title: string;
  subtitle: string;
  status: RunStatus;
  createdAt: string;
  sessionId: string | null;
  routineId: string | null;
}
