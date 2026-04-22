# Agent Manifest

Agent definitions = what AI agent looks like. Which tabs. What prompt. What files seeded. Primary dev surface of platform.

## Three tiers

1. **JSON-only** — `houston.json` + `CLAUDE.md`. Defines tabs, prompt, colors, icon. Uses built-in tab components.
2. **Custom React** — `houston.json` + `bundle.js`. Custom components. Import `@houston-ai/*` as peer deps.
3. **Workspace template** — `workspace.json` + `agents/` folder. Bundles multiple agents from one GitHub repo.

## Manifest shape
```ts
interface AgentManifest {
  id: string;
  name: string;
  description: string;
  version?: string;
  icon?: string;           // Lucide icon name
  color?: string;          // brand override
  category?: AgentCategory;
  author?: string;
  tags?: string[];
  tabs: AgentTab[];
  defaultTab?: string;
  claudeMd?: string;       // CLAUDE.md template content
  systemPrompt?: string;
  agentSeeds?: Record<string, string>;
  features?: string[];     // Rust feature flags needed
}

interface AgentTab {
  id: string;
  label: string;
  builtIn?: "chat" | "board" | "skills" | "files" | "connections" | "context" | "routines" | "channels" | "events" | "learnings";
  customComponent?: string;
  badge?: "activity" | "none";
}
```

## Locations
- **Built-in:** `app/src/agents/builtin/` — currently one `blankAgent` (start-from-scratch). The richer catalog lives in Houston Store.
- **Installed:** `~/.houston/agents/{id}/houston.json` — downloaded from GitHub.
- **Override rule:** installed definition with same id as builtin → overrides builtin (dedup in `app/src/stores/agent-configs.ts`).

## Import flow
"New Agent > GitHub" dialog. User pastes `owner/repo`. Houston downloads `houston.json`, `CLAUDE.md`, `icon.png`, `bundle.js` → `~/.houston/agents/{id}/`.

## Agent creation
Seeds agent CLAUDE.md from manifest `claudeMd` field or manifest's `CLAUDE.md` file. Fallback: generic template.

## Workspace templates

Bundle multiple agents in one GitHub repo. Import → create workspace w/ all agents ready.

```
my-workspace/
  workspace.json
  agents/
    agent-one/
      houston.json
      CLAUDE.md
    agent-two/
      houston.json
      CLAUDE.md
```

**workspace.json:**
```json
{
  "name": "Workspace Name",
  "description": "Optional.",
  "agents": ["agent-one", "agent-two"]
}
```

**Import:** "New Workspace > Import from GitHub". Paste `owner/repo`. Houston downloads workspace.json, installs all agent defs, creates workspace, creates agent instances w/ CLAUDE.md + seed files. All agents chat-ready immediately.

Engine route: `POST /v1/store/workspaces/install-from-github`. Rust impl: `houston_engine_core::store::install_workspace_from_github`. Server wiring: `engine/houston-engine-server/src/routes/store.rs`.

## Sidebar structure

```
+-----------------------------+
| [WorkspaceSwitcher] [Settings] |
|-----------------------------|
| > Dashboard                 |  all agents overview
| > Connections               |  workspace-wide integrations
|-----------------------------|
| Your AI Agents              |
|   > Research Agent          |  sorted by lastOpenedAt
|   > Project Manager         |
|   + New Agent               |  pick agent definition
+-----------------------------+
```

## Workspace
- Storage: `~/.houston/workspaces/workspaces.json` (index) + one dir per workspace `~/.houston/workspaces/{Name}/`. `HOUSTON_DOCS` env var overrides the root.
- First launch: welcome screen, create first workspace
- Engine routes: `GET /v1/workspaces`, `POST /v1/workspaces`, `POST /v1/workspaces/:id/rename`, `DELETE /v1/workspaces/:id`, `PATCH /v1/workspaces/:id/provider` (`engine/houston-engine-server/src/routes/workspaces.rs`). Frontend reaches them via `@houston-ai/engine-client` — no Tauri commands in the path.
- Store: `useWorkspaceStore` — `loadWorkspaces()`, `setCurrent()`, `create()`, `rename()`, `delete()`

## Prompt assembly
Order (in `engine/houston-engine-core/src/agents/prompt.rs::build_houston_system_prompt`):
1. **Working directory block** — hard rules scoping file I/O to `<agent-root>`.
2. `.houston/prompts/system.md` — base prompt (falls back to `DEFAULT_SYSTEM_PROMPT`, which includes the non-technical-user voice rules).
3. Mode file `.houston/prompts/modes/<mode>.md` (optional).
4. `SELF_IMPROVEMENT_GUIDANCE` const (`engine/houston-engine-core/src/agents/self_improvement.rs`) — skills/learnings/CLAUDE.md directives. Source of truth; the per-agent seed file is reference-only.
5. Skills index — `.agents/skills/` via `houston_skills::build_skills_index`.
6. Integrations block — based on `.houston/integrations.json` if present.

`CLAUDE.md` is read by the CLI (claude/codex) itself at startup, not injected by the engine.

Prompt files are seeded on agent creation via `seed_file()` (write-once, never overwrite). Runtime behavior uses the engine constants — editing the seed files affects only what the UI displays, not what the agent actually runs.

## Board / Activity tab
`@houston-ai/board::AIBoard` = `KanbanBoard` + `KanbanDetailPanel` + `ChatPanel`. Each card = activity from `.houston/activity/activity.json`. Click → opens chat w/ conversation history. App `board-tab.tsx` ~140 lines, thin store wrapper.

`AIBoard` props: `items, feedItems (keyed by sessionKey), isLoading, onCreateConversation, onSendMessage, onLoadHistory, onDelete, onApprove, onSelect, selectedId`.

Status transitions: session completes → `useSessionEvents` (listens to the WS `*` firehose) → activity status flipped to `needs_you` via the engine update route. The emitted `ActivityChanged` event auto-invalidates TanStack Query → board refreshes.

Columns can have `onAdd` callback → renders "+" button for creating activities from board.
