import { osReadRecentLogs } from "./os-bridge";

const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/PLACEHOLDER";

interface BugReportContext {
  command: string;
  error: string;
  spaceName?: string;
  workspaceName?: string;
  timestamp: string;
  appVersion: string;
}

/** Fetch the last N lines from backend + frontend log files. */
async function getRecentLogs(lines = 50): Promise<{ backend: string; frontend: string }> {
  try {
    return await osReadRecentLogs(lines);
  } catch {
    return { backend: "(unavailable)", frontend: "(unavailable)" };
  }
}

export async function reportBug(context: BugReportContext): Promise<void> {
  const logs = await getRecentLogs();

  const fields = [
    { title: "Command", value: `\`${context.command}\``, short: true },
    { title: "Timestamp", value: context.timestamp, short: true },
    { title: "App Version", value: context.appVersion, short: true },
  ];

  if (context.spaceName) {
    fields.push({ title: "Space", value: context.spaceName, short: true });
  }
  if (context.workspaceName) {
    fields.push({ title: "Workspace", value: context.workspaceName, short: true });
  }

  // Truncate logs to fit Slack's 3000 char limit per field
  const truncate = (s: string, max: number) =>
    s.length > max ? `...\n${s.slice(-max)}` : s;

  const payload = {
    attachments: [
      {
        color: "#e02e2a",
        title: "Bug Report from Houston",
        fields,
        text: `\`\`\`${context.error}\`\`\``,
        footer: "Houston Desktop App",
        ts: Math.floor(Date.now() / 1000),
      },
      {
        color: "#6b7280",
        title: "Backend Logs (last 50 lines)",
        text: `\`\`\`${truncate(logs.backend, 2900)}\`\`\``,
      },
      {
        color: "#6b7280",
        title: "Frontend Logs (last 50 lines)",
        text: `\`\`\`${truncate(logs.frontend, 2900)}\`\`\``,
      },
    ],
  };

  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status}`);
  }
}
