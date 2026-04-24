# Claude Session Protocol — Houston

Caveman style. Progressive discovery. Load on demand.

---

## PHASE 0 — Load /caveman (EVERY SESSION, FIRST)

Before any action: invoke `/caveman` skill. Stay terse. Drop articles, filler, pleasantries. Technical substance stays. Code blocks unchanged.

Default level: `full`. Switch via `/caveman lite|full|ultra`.

Off only if user says "stop caveman" or "normal mode".

---

## System at a glance (read once at session start)

Houston = desktop app + standalone engine + open library of agents.

- **`app/`** — Tauri 2 desktop. React frontend, small Rust binary that spawns the engine as a sidecar subprocess and talks to it over HTTP/WS. OS-native glue only (file pickers, reveal-in-finder, logs). No domain logic.
- **`engine/`** — Rust crates. `houston-engine-core` = runtime/domain. `houston-engine-protocol` = wire types. `houston-engine-server` = axum HTTP+WS binary (`houston-engine`). `houston-agent-files`, `houston-skills`, `houston-sessions`, `houston-file-watcher`, etc. are leaf crates. Frontend-agnostic: no Tauri, no React.
- **`ui/`** — `@houston-ai/*` React packages (chat, board, layout, engine-client, …). Props-only, no store imports. `@houston-ai/engine-client` is the TS front door to the engine.
- **User data** — `~/.houston/`: DB, logs, `engine.json`, and `workspaces/<Workspace>/<Agent>/`. Each agent has `.houston/` data files + `CLAUDE.md` + `.agents/skills/`.
- **Wire contract** — every domain call is a `fetch` or WS frame in `@houston-ai/engine-client`. There are NO `invoke("list_workspaces", …)` style Tauri commands for domain; those were all deleted.
- **Reactivity** — engine emits `HoustonEvent`s; desktop subscribes to the WS `*` firehose; TanStack Query invalidation in `app/src/hooks/use-agent-invalidation.ts` maps events → query keys. File watcher catches direct agent writes.
- **Voice** — agents' target user is NON-technical. The product system prompt forbids mentioning files/JSON/configs/CLIs when talking to the user. Lives in `app/src-tauri/src/houston_prompt.rs` (Houston app), NOT in the engine. Engine is prompt-agnostic; app hands it over at spawn via `HOUSTON_APP_SYSTEM_PROMPT`.

Before touching anything: run PHASE 1 (load `knowledge-base/architecture.md` + any KBs relevant to scope).

## Dispatch table (progressive discovery)

Deploying / shipping a release? → `/release`
Manual macOS build, notarize, staple? → `/build-app-local`
Bug? Don't guess → `/debug`

Need specific knowledge? Load on demand:
- Repo shape, products, engine story → `knowledge-base/architecture.md`
- Colors, typography, components, animation → `knowledge-base/design-system.md`
- `.houston/` layout, schemas, reactivity → `knowledge-base/files-first.md`
- Agent manifest, tiers, sidebar, workspaces → `knowledge-base/agent-manifest.md`
- Engine wire protocol (REST + WS) → `knowledge-base/engine-protocol.md`
- `houston-engine` binary ops → `knowledge-base/engine-server.md`
- Custom frontend on `houston-engine` (integration reference) → `examples/smartbooks/README.md`
- Mobile PWA (tunnel, pairing, reactivity) → `docs/mobile-architecture.md` + `docs/relay-operations.md`
- Updater, analytics, Sentry, env vars, CI → `knowledge-base/production-infra.md`

Design work? Skills: `/critique` before, `/polish` after. Else `/clarify` (copy), `/distill` (overloaded screen), `/animate` (micro-interactions), `/audit` (a11y).

---

## Phases (follow IN ORDER)

Print phase name so user knows protocol active.

**STOP-AND-WAIT rule:** When told "wait for approval" / "ask user" — end turn NOW. No anticipating. No next phase.

### PHASE 1 — Load Context (session start only)
Read `knowledge-base/architecture.md` + any KBs relevant to scope. Name what you loaded.

### PHASE 2 — Understand
Read files user references. Identify direction: library-first / app-first / single-layer. Ask clarifying Qs if anything unclear. **STOP if asked.**

### PHASE 3 — Challenge
Push back on request if better approach exists. Check:
- Library or app? Generic → ui/engine. App-specific → app/.
- Which package? Exists already?
- Props generic? No store imports? No app-specific types?
- Does this fit chat-first planning/delegation?

Approach sound → say so. Better path exists → say it clearly, no sugarcoat. **STOP until user agrees.**

### PHASE 4 — Plan
Numbered steps. Mark area per step: `[ui/board]`, `[engine]`, `[app]`. Group into testable chunks. Library before app. **STOP for approval.**

### PHASE 5 — Execute chunk
Print chunk + area. Do all steps. Brief summary. Continue.

### PHASE 6 — Test
Run checks for what touched. Rust → `cargo test`, not just check. Fix failures.

### PHASE 7 — Verify
Full verification. UI touched? Visual fidelity check. Say "Ready for testing — verify + report." **STOP.** Issue? Add logging first (see `/debug`), never blind fix.

### PHASE 8 — Refactor
Library boundary leak? API clean? File > 200 lines (CSS > 500)? Duplication across ui/ + app/? Propose + do after approval.

### PHASE 9 — Cleanup
Unused imports, dead code, debug artifacts. ui/ → no `@/`, no Zustand, no Tauri. app/ → no duplicated logic.

### PHASE 10 — Document
Check + update all affected docs: `knowledge-base/*.md`, skills, showcase. Update now, not propose.

### PHASE 11 — Complete
Summarize. Needs NEW KB entry? New pattern / architecture decision / gotcha / design precedent. Propose if yes.

### PHASE 12 — Commit
Ask: "Ready to commit? (yes/no/skip)" **STOP.** Yes → stage specific files, conventional commit, push `claude/wip`. Never `git add -A`.

---

## Test commands

| Area | TS | Rust | Full build |
|------|----|------|------------|
| ui/ | `pnpm typecheck` | — | — |
| engine/ | — | `cargo test --workspace` | `cargo build --workspace` |
| app/ | `cd app && pnpm tsc --noEmit` | `cd app/src-tauri && cargo check` | `cd app && pnpm tauri build` |

---

## Hard rules (ALWAYS)

### Debugging
**Never guess.** Read logs first. See `/debug`.

### Library boundary (ui/)
- Generic reusable → ui/. App-specific → app/. Unsure → start in app/, extract later.
- **Props over stores, always.** No Zustand/Redux/etc imports in ui/.
- No app/ types in ui/. Use generic types (`BoardItem`, `FeedItem`, `ChatMessage`).
- No `@/` path aliases in ui/. Relative imports within package. Package imports between.

### Engine boundary
- `engine/` = frontend-agnostic. No Tauri. No React. No webview assumption.
- Tauri-specific code → `app/houston-tauri/` (the adapter).

### AI-native reactivity
- Every `.houston/` data surface must react to file changes regardless of who wrote (user via UI, agent via file write, external edit).
- All `.houston/` fetching → TanStack Query + event invalidation. No load-on-mount-only.
- Agent writes emit events. File watcher catches bypass writes. Both architecturally required.
- Never build "agent can do X but UI won't show until refresh."

### Internal code = no backwards compat
- Types, APIs, Rust modules, TS fns: change = change. No "just in case" keeps.
- **User data = different.** Canonical location is `~/.houston/**` (workspaces live at `~/.houston/workspaces/`). Shape/layout changes inside `~/.houston/<agent>/.houston/**` need an **idempotent migration** in `houston_agent_files::migrate_agent_data`. Never break existing users.
- **Legacy `~/Documents/Houston/**`** — earlier versions used this path. We do NOT auto-migrate from there; if a user upgrades they may need to copy their workspaces manually. When introducing further root moves, propose a migration story before executing.

### Tests mandatory
Every feature gets tests. No exceptions. Tests don't count toward 200-line limit.

### Type safety over strings
Domain concepts (status, classification) MUST be enums. TS → discriminated unions. Rust → enums w/ Display/FromStr.

### No silent failures
Errors surface. No swallowed errors. `let _ = x.await` banned for ops that can fail. No `unwrap()` in production Rust.

### No hover-only affordances
Interactive elements visible without hovering. Hover may enhance, never gate.

### File size limits
200 lines/file (excluding tests). CSS 500. **NEVER compress to fit.** Extract modules.

### Search before building
shadcn/ui registry, @houston-ai showcase, existing components, npm — before writing from scratch.

### Be critical, not agreeable
Never "You're absolutely right!" if better approach exists. Say it.

---

## Git — Worktree workflow (ALWAYS)

User ALWAYS runs Claude in a per-task worktree. Each task = isolated branch in `.claude/worktrees/<name>/`. Main stays clean.

Branch model:
- `main` — releasable, protected, PRs only
- `claude/<worktree-name>` — the worktree's own branch (auto-created on worktree spawn); commits go here

End-to-end flow (run without asking, unless a step is destructive and not pre-authorized):
1. `git branch --show-current` → confirm it's the worktree branch (e.g. `claude/crazy-pare-b3d43d`). Never switch to `claude/wip` or `main`.
2. Stage specific files. Never `git add -A`.
3. Conventional commit (`feat:` `fix:` `docs:` `chore:` `refactor:` `style:` `test:`).
4. `git push -u origin <worktree-branch>`.
5. `gh pr create --base main --title "…" --body "…"` — summarise changes, list affected files.
6. Merge the PR yourself: `gh pr merge --squash --delete-branch`. User does NOT review — they rely on the phase protocol + tests + typecheck to catch issues before commit.
7. Cleanup (from the main repo checkout, not the worktree): `git worktree remove <path>` is handled by the harness on exit; just ensure the remote branch is deleted by `--delete-branch`.

Never `git reset --hard` on `main`, never force-push to `main`, never merge without the PR step (even for trivial changes — PR is the audit trail).

---

## Secrets
Signing identities, team IDs, API keys, issuer UUIDs: env vars only. Never literals in committed files. Read via `option_env!()` (Rust compile-time) or env vars (CI).

---

## Permission scope
User approved once ≠ approved in all contexts. Unless durable instructions authorize, confirm first for:
- Destructive ops (delete files/branches, drop tables, rm -rf)
- Hard-to-reverse (force-push, git reset --hard, amend published, remove deps)
- Shared-state (push, PR create/comment, Slack/email send)
- Third-party uploads (diagram renderers, pastebins — could be indexed)

Match action scope to what was actually requested.
