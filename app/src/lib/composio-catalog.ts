export interface ComposioApp {
  toolkit: string;
  name: string;
  description: string;
  logoUrl: string;
}

const fav = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const COMPOSIO_CATALOG: ComposioApp[] = [
  // Google
  { toolkit: "gmail", name: "Gmail", description: "Send and read emails", logoUrl: "https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png" },
  { toolkit: "googledrive", name: "Google Drive", description: "Access files and folders", logoUrl: "https://www.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png" },
  { toolkit: "googlecalendar", name: "Google Calendar", description: "Manage events and schedules", logoUrl: "https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png" },
  { toolkit: "googlesheets", name: "Google Sheets", description: "Read and edit spreadsheets", logoUrl: "https://www.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png" },
  { toolkit: "googledocs", name: "Google Docs", description: "Create and edit documents", logoUrl: "https://www.gstatic.com/images/branding/product/2x/docs_2020q4_48dp.png" },
  // Microsoft
  { toolkit: "outlook", name: "Outlook", description: "Send and read emails", logoUrl: fav("outlook.com") },
  { toolkit: "microsoft_teams", name: "Microsoft Teams", description: "Chat and video meetings", logoUrl: fav("teams.microsoft.com") },
  { toolkit: "onedrive", name: "OneDrive", description: "Cloud file storage", logoUrl: fav("onedrive.com") },
  // Communication
  { toolkit: "slack", name: "Slack", description: "Send and read messages", logoUrl: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png" },
  { toolkit: "discord", name: "Discord", description: "Send and read messages", logoUrl: fav("discord.com") },
  { toolkit: "twilio", name: "Twilio", description: "Send SMS and make calls", logoUrl: fav("twilio.com") },
  { toolkit: "sendgrid", name: "SendGrid", description: "Send transactional emails", logoUrl: fav("sendgrid.com") },
  // Project management
  { toolkit: "linear", name: "Linear", description: "Track issues and projects", logoUrl: "https://linear.app/static/apple-touch-icon.png" },
  { toolkit: "jira", name: "Jira", description: "Track issues and sprints", logoUrl: fav("jira.atlassian.com") },
  { toolkit: "asana", name: "Asana", description: "Manage tasks and projects", logoUrl: fav("asana.com") },
  { toolkit: "monday", name: "Monday.com", description: "Work management platform", logoUrl: fav("monday.com") },
  { toolkit: "clickup", name: "ClickUp", description: "All-in-one project management", logoUrl: fav("clickup.com") },
  { toolkit: "trello", name: "Trello", description: "Manage boards and cards", logoUrl: fav("trello.com") },
  { toolkit: "todoist", name: "Todoist", description: "Task lists and reminders", logoUrl: fav("todoist.com") },
  // Dev tools
  { toolkit: "github", name: "GitHub", description: "Manage repos and issues", logoUrl: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png" },
  { toolkit: "gitlab", name: "GitLab", description: "Repos, CI/CD, and issues", logoUrl: fav("gitlab.com") },
  { toolkit: "bitbucket", name: "Bitbucket", description: "Git repos and pipelines", logoUrl: fav("bitbucket.org") },
  { toolkit: "figma", name: "Figma", description: "Design and prototyping", logoUrl: fav("figma.com") },
  { toolkit: "vercel", name: "Vercel", description: "Deploy and host web apps", logoUrl: fav("vercel.com") },
  // Productivity
  { toolkit: "notion", name: "Notion", description: "Access pages and databases", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" },
  { toolkit: "airtable", name: "Airtable", description: "Access tables and records", logoUrl: fav("airtable.com") },
  { toolkit: "dropbox", name: "Dropbox", description: "Cloud file storage", logoUrl: fav("dropbox.com") },
  { toolkit: "evernote", name: "Evernote", description: "Notes and web clipping", logoUrl: fav("evernote.com") },
  // CRM & Sales
  { toolkit: "salesforce", name: "Salesforce", description: "CRM and sales management", logoUrl: fav("salesforce.com") },
  { toolkit: "hubspot", name: "HubSpot", description: "CRM, marketing, and sales", logoUrl: fav("hubspot.com") },
  // Support
  { toolkit: "zendesk", name: "Zendesk", description: "Customer support tickets", logoUrl: fav("zendesk.com") },
  { toolkit: "intercom", name: "Intercom", description: "Customer messaging platform", logoUrl: fav("intercom.com") },
  // Social
  { toolkit: "twitter", name: "X (Twitter)", description: "Post and read tweets", logoUrl: fav("x.com") },
  { toolkit: "reddit", name: "Reddit", description: "Browse and post to subreddits", logoUrl: fav("reddit.com") },
  { toolkit: "linkedin", name: "LinkedIn", description: "Professional networking", logoUrl: fav("linkedin.com") },
  // Media & Commerce
  { toolkit: "youtube", name: "YouTube", description: "Video management and analytics", logoUrl: fav("youtube.com") },
  { toolkit: "spotify", name: "Spotify", description: "Music and podcast data", logoUrl: fav("spotify.com") },
  { toolkit: "shopify", name: "Shopify", description: "E-commerce management", logoUrl: fav("shopify.com") },
  { toolkit: "stripe", name: "Stripe", description: "Payments and billing", logoUrl: fav("stripe.com") },
].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Slugs we probe on load to populate connection state across the app
 * (Integrations tab's Connected section, inline ComposioLinkCard in
 * chat, etc.). Shared so every surface reads from the same TanStack
 * Query cache — otherwise each consumer would trigger its own probe.
 *
 * Using the curated catalog (~45 popular apps) rather than the full
 * scraped list (~200) keeps the refresh under 5s and covers what most
 * users connect. Exotic connections made outside Houston won't show up
 * here — acceptable tradeoff until Composio ships a proper "list
 * consumer accounts" command.
 */
export const COMPOSIO_PROBE_SLUGS: string[] = COMPOSIO_CATALOG.map(
  (a) => a.toolkit,
);
