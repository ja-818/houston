const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/PLACEHOLDER";

interface BugReportContext {
  command: string;
  error: string;
  spaceName?: string;
  workspaceName?: string;
  timestamp: string;
  appVersion: string;
}

export async function reportBug(context: BugReportContext): Promise<void> {
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
