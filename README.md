<p align="center">
  <a href="https://gethouston.ai">
    <strong>Houston</strong>
  </a>
</p>

<p align="center">
  <strong>The open source platform for AI-native products.</strong><br>
  One desktop app. Pre-built AI agents that work from day one.<br>
  Real tools. 1000+ integrations. Free forever.
</p>

<p align="center">
  <a href="https://gethouston.ai">gethouston.ai</a> ·
  <a href="https://gethouston.ai/vision/">Vision</a> ·
  <a href="https://gethouston.ai/learn/">Learn</a> ·
  <a href="https://gethouston.ai/startups/">For Startups</a> ·
  <a href="https://forms.gle/ac24qrKSufYvfudt8">Join the waiting list</a>
</p>

<p align="center">
  <a href="https://github.com/ja-818/houston/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-0d0d0d" alt="MIT License"></a>
  <a href="https://github.com/ja-818/houston/stargazers"><img src="https://img.shields.io/github/stars/ja-818/houston?color=0d0d0d" alt="Stars"></a>
</p>

---

## What Houston is

**For everyone** — a free desktop app with AI agents that do real work. Bookkeeping, outreach, research, scheduling. Install agents from the store and start working. No terminal. No prompt engineering.

**For founders** — the platform where you build AI-native products for your customers. Define your agents, Houston handles the workspace, the chat, the board, the integrations. You bring the domain expertise. [Read more](https://gethouston.ai/startups/).

> **Read the vision:** [Ship the impossible](https://gethouston.ai/vision/)

---

## Quick start

### Run the Houston app

```bash
git clone https://github.com/ja-818/houston.git
cd houston
pnpm install
cd app && pnpm tauri dev
```

### Build your first agent

Create two files:

**houston.json**
```json
{
  "id": "bookkeeper",
  "name": "Bookkeeper",
  "description": "Categorize expenses and reconcile accounts.",
  "icon": "Calculator",
  "category": "business",
  "tabs": [
    { "id": "board", "label": "Tasks", "builtIn": "board", "badge": "activity" },
    { "id": "files", "label": "Files", "builtIn": "files" },
    { "id": "job-description", "label": "Instructions", "builtIn": "job-description" }
  ]
}
```

**CLAUDE.md**
```markdown
# Bookkeeper

You categorize transactions, reconcile accounts, and flag anomalies.
Ask which period the user wants before starting.
```

Push to GitHub. In Houston, click **New Agent > GitHub**, paste your repo URL. Done.

The [Learn guide](https://gethouston.ai/learn/) covers the full details in five short chapters.

### Share a workspace template

Bundle multiple agents into one repo:

```
my-workspace/
├── workspace.json
└── agents/
    ├── bookkeeper/
    │   ├── houston.json
    │   └── CLAUDE.md
    └── tax-reviewer/
        ├── houston.json
        └── CLAUDE.md
```

**workspace.json**
```json
{
  "name": "Tax Practice",
  "description": "A complete workspace for tax professionals.",
  "agents": ["bookkeeper", "tax-reviewer"]
}
```

In Houston, click **New Workspace > Import from GitHub**, paste the repo URL. Houston creates the workspace with all agents ready to use.

---

## How the app works

Houston organizes work into **Workspaces** and **Agents**:

- **Workspace** — a group of agents (like a team or project).
- **Agent** — an AI agent instance. Chat, kanban board, skills, files, integrations.
- **Agent Definition** — a `houston.json` that defines what an agent looks like and does.

```
Workspace ("Tax Practice")
  ├── Agent ("Bookkeeper")         ← board, files, instructions
  ├── Agent ("Document Reviewer")  ← board, files, integrations
  └── Agent ("Client Comms")       ← board, files, integrations
```

Each kanban card is a Claude conversation. Click a card to see the full chat. Connect Slack and the same conversation becomes a thread.

---

## Agent definitions

Three tiers:

| Tier | What you write | What you get |
|------|---------------|-------------|
| **JSON-only** | `houston.json` + `CLAUDE.md` | Tabs, prompt, icon. Uses built-in components. |
| **Custom React** | Add `bundle.js` | Custom React components as tabs. |
| **Workspace template** | `workspace.json` + agents folder | Multiple agents, one import. |

**Built-in tab types:** `board`, `files`, `job-description`, `integrations`, `routines`, `configure`, `events`

---

## Monorepo layout

```
houston/
├── app/                Houston app (Tauri 2)
│   ├── src/            React frontend
│   └── src-tauri/      Rust backend
├── ui/                 @houston-ai/* — 11 React packages
│   ├── core/           Design system, 38 components
│   ├── chat/           Chat panel, streaming, tool activity
│   ├── board/          Kanban board with animated cards
│   ├── layout/         Sidebar, tab bar, split view
│   ├── connections/    Channel and service connections
│   ├── events/         Event feed
│   ├── memory/         Memory browser
│   ├── routines/       Scheduled routines
│   ├── skills/         Skill management
│   ├── review/         Review queue
│   └── agent/          File browser
├── engine/             houston-* — Rust crates
│   ├── houston-terminal-manager/   Claude/Codex CLI process manager
│   ├── houston-db/         SQLite (chat feed + preferences)
│   ├── houston-tauri/      Tauri integration layer
│   ├── houston-channels/   Slack, Telegram adapters
│   ├── houston-events/     Event queue
│   ├── houston-scheduler/  Cron jobs
│   └── houston-memory/     Memory store
├── website/            gethouston.ai
└── create-app/         Scaffolding templates
```

---

## Resources

- **[gethouston.ai](https://gethouston.ai)** — landing page
- **[For Startups](https://gethouston.ai/startups/)** — build AI-native products on Houston
- **[Vision essay](https://gethouston.ai/vision/)** — Ship the impossible
- **[Learn guide](https://gethouston.ai/learn/)** — five chapters on building agents
- **[Join the waiting list](https://forms.gle/ac24qrKSufYvfudt8)** — get notified when the app ships

---

## Contributing

Houston is open source under MIT. Issues and PRs welcome.

---

## License

MIT
