# Files-First (`.houston/`)

Houston uses files, not DB, for agent-visible data. SQLite only for chat replay + app prefs.

## Rule
If @houston-ai component renders it → `.houston/` folder.
If app-specific → `.houston/`.

## Layout

```
~/.houston/workspaces/{Workspace}/{Agent}/
  .houston/
    agent.json                  AgentMeta (id, manifest_id, created_at, last_opened_at)
    activity/
      activity.json             Activity[]
      activity.schema.json      JSON Schema
    routines/
      routines.json + .schema.json
    routine_runs/
      routine_runs.json + .schema.json
    config/
      config.json + .schema.json
    learnings/
      learnings.json + .schema.json   ({id, text, created_at})
      # Legacy `.houston/memory/learnings.md` auto-migrated on startup
      # (bullet list → JSON). See `houston_agent_files::migrate_agent_data`.
    prompts/
      modes/<mode>.md           editable per-mode prompt overlay (user-owned)
    sessions/
      {session_key}.sid         one file per conversation, holds Claude session id for --resume
  .agents/
    skills/<name>/SKILL.md      skill.sh / Claude Code convention
  .claude/
    skills/<name>               symlink → ../../.agents/skills/<name>
  CLAUDE.md                     agent instructions
  AGENTS.md                     symlink → CLAUDE.md (for Codex)
```

## File I/O path
Frontend never touches the filesystem directly. All `.houston/` reads
and writes flow through `@houston-ai/engine-client` → `houston-engine`
REST routes (`/v1/agents/:path/files/:kind`, etc.), which call into
`houston-agent-files`. Writes are atomic (temp + rename) and emit a
matching `HoustonEvent` over the WS. No typed CRUD — per-type folder +
schema + a generic read/write pair covers everything.

## Schemas
Authoritative. Live in `ui/agent-schemas/src/*.schema.json`. Embedded in Rust via `include_str!` in `houston-agent-files::schemas`. Seeded into each agent's `.houston/<type>/<type>.schema.json` on first launch. Prompts instruct model to read schema before writing data file.

## Migration
`houston_agent_files::migrate_agent_data()` runs on every `seed_agent()`. Idempotent. Leaves legacy flat-layout data files in place as rollback. Legacy product-prompt seeds (`.houston/prompts/system.md`, `.houston/prompts/self-improvement.md`) are deleted — the Houston product prompt now lives in the app binary (`app/src-tauri/src/houston_prompt.rs`), not on disk.

## Atomic writes
All writes: temp file + rename. Path-traversal safe via `houston-agent-files::safe_relative`.

## Activity statuses
`queue` · `running` · `needs_you` · `done` · `cancelled`

## Skills discovery
Skills live at `.agents/skills/<name>/SKILL.md`. Houston mirrors to `.claude/skills/<name>` via symlink (Claude Code reads). Flat `.md` under `.agents/skills/` auto-migrated to `<name>/SKILL.md` on next `list_skills`.

Same files surface in the UI as **"Actions"** (per-user vocabulary). Frontmatter drives card image, category tabs, featured-state showcase, integration logos, and an inline form (with input fields + a `prompt_template`). Full schema + render pipeline → [`actions.md`](actions.md).

## SQLite (minimal)
Only two tables:
- `chat_feed` — keyed by `claude_session_id`. UI conversation replay on restart.
- `preferences` — app-level (last_workspace_id etc). Not scoped.

Everything else lives in files.

## AI-native reactivity (MANDATORY)

Users + LLMs equal participants. Both read/write all workspace data. All changes visible to both immediately.

### Two writers
1. **Frontend via the engine** — user clicks "Create Activity" → React hook → `engine-client` → `houston-engine` REST route → `houston-agent-files` writes the file.
2. **CLI agent direct writes** — the claude/codex subprocess writes `.agents/skills/<name>/SKILL.md` or updates `.houston/<type>/<type>.json` directly without talking to the engine.

### Three-layer reactivity stack
1. **TanStack Query (frontend)** — all `.houston/` fetches via `useQuery`. Query keys: `["activity", agentPath]` etc. Dedup, background refresh, stale-while-revalidate.
2. **Event emission on engine writes** — the engine's write helpers emit `HoustonEvent` variants (`SkillsChanged`, `ActivityChanged`, `LearningsChanged`, …) onto its broadcast bus. The desktop WS client (`ui/engine-client`) fans them out; global listeners in `app/src/hooks/use-agent-invalidation.ts` invalidate the matching query key.
3. **File watcher on `.houston/` (Rust `notify`, `houston-file-watcher`)** — catches direct agent writes that bypass the engine's write path. Emits the same events onto the same bus. Debounced.

### The rule
Never build feature where agent changes data but UI won't reflect until refresh. If in `.houston/`, must be reactive.

## User data = upgrade-safe
Files under `~/.houston/**` (including legacy `~/Documents/Houston/**` from earlier versions) exist on user machines. Changing shape/layout requires **idempotent migration** on upgrade. See `houston_agent_files::migrate_agent_data`. Never leave existing users broken.
