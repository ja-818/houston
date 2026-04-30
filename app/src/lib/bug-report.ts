import { osReadRecentLogs, osReportBug } from "./os-bridge";

interface BugReportContext {
  command: string;
  error: string;
  spaceName?: string;
  workspaceName?: string;
  userEmail?: string | null;
  timestamp: string;
  appVersion: string;
}

async function getRecentLogs(lines = 50): Promise<{ backend: string; frontend: string }> {
  try {
    return await osReadRecentLogs(lines);
  } catch {
    return { backend: "(unavailable)", frontend: "(unavailable)" };
  }
}

export async function reportBug(context: BugReportContext): Promise<void> {
  const logs = await getRecentLogs();

  await osReportBug({
    ...context,
    logs,
  });
}
