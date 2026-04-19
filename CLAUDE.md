<!--
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
STOP - FOLLOW THIS PROTOCOL FOR EVERY INTERACTION
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-->

# Claude Session Protocol — Houston

### MANDATORY DEBUGGING RULE — USE THE LOG FILES
When a bug occurs and the fix isn't immediately obvious: **NEVER guess.** Always:
1. **Read the log files first** — they contain all backend and frontend errors:
   - **Backend:** `~/.houston/logs/backend.log` (Rust tracing output — sessions, agent store, channels, watcher, etc.)
   - **Frontend:** `~/.houston/logs/frontend.log` (JS console.error/warn, React crashes, Tauri command failures)
2. Diagnose from the ACTUAL error in the logs, not assumptions
3. If the logs don't have enough info, add targeted `tracing::debug!()` (Rust) or `logger.debug()` (TS from `lib/logger.ts`) to narrow it down
4. **Never ask the user to copy-paste terminal output** — read the log files directly

### Logging System Reference
- **Rust:** All logging uses `tracing` macros (`tracing::info!`, `tracing::error!`, etc.) — output goes to `backend.log` via `tracing-subscriber` with daily rolling file appender
- **Frontend:** `logger` from `app/src/lib/logger.ts` — `logger.error()`, `logger.warn()`, `logger.info()`, `logger.debug()`. Also, `console.error` and `console.warn` are patched to auto-write to `frontend.log`
- **Bug reports:** "Report bug" button on error toasts automatically attaches the last 50 lines from both log files
- **Log levels (Rust):** Configurable via `RUST_LOG` env var. Default: `info` globally, `debug` for `houston_sessions` and `houston_tauri`

Guessing wastes time. Reading the logs is always faster.

### MANDATORY STOPPING RULES
Whenever this protocol tells you to "wait for approval", "wait for user feedback", or "ask the user", you MUST IMMEDIATELY STOP GENERATING YOUR RESPONSE.
- End your text output right there.
- Do NOT output the next phase.
- Do NOT anticipate the user's answer.
- You must physically stop your turn and return control to the user.

Follow these phases IN ORDER for every interaction. Do not skip phases.

**IMPORTANT: Always print the phase name exactly (e.g., "PHASE 1: Load Context") so the user knows we're following the protocol.**

---

## What This Repo Is

Houston is an open source **platform** for AI-native products. Not a framework, not a library, not an SDK. A platform — like Shopify is a platform for e-commerce.

**Three audiences:**
1. **Individual users** — download the free desktop app, use pre-built AI agents for real work
2. **Founders** — build AI-native products on Houston for their customers (define agents with JSON + prompts, Houston handles workspace/chat/board/integrations)
3. **Houston Cloud** (coming) — deploy founder products to enterprise customers with custom branding, managed hosting, client management

| Directory | What |
|-----------|------|
| `packages/` | React UI packages (`@houston-ai/*`) — internal components powering the platform |
| `crates/` | Rust crates (`houston-*`) — session management, database, agent persistence, Tauri integration |
| `app/` | The Houston app — the platform's desktop client (Tauri 2) |
| `website/` | gethouston.ai — landing, startups page, vision essay, learn guide |
| `create-app/` | Scaffolding templates for custom agent React bundles |

**Key distinction:** `packages/` and `crates/` are internal infrastructure, not the developer-facing product. External developers build agents by writing `houston.json` + `CLAUDE.md`, not by importing React components. The components exist to power the platform.

---

## PHASE 1: Load Context (Session Start Only)

**On the FIRST message of a new session:**

1. Print "PHASE 1: Load Context"
2. Infer which parts of the repo are involved from the request (or ask)
3. **Always read these two** (they're the foundation for everything):
   - `knowledge-base/design.md` — design system
   - `knowledge-base/houston.md` — library architecture, packages, crates, patterns
4. Briefly acknowledge what you loaded and which areas are in scope
5. Then proceed to Phase 2

---

## PHASE 2: Understand the Request

1. Print "PHASE 2: Understand the Request"
2. Read any files the user references
3. Identify the **direction of work**:
   - **Library-first:** New capability in packages/ or crates/, then consumed by app/
   - **App-first:** Feature needed in app/ that should be extracted to the library
   - **Single-layer:** Work only touches one area (just packages/, just crates/, just app/)
4. Ask clarifying questions if ANYTHING is unclear
5. **STOP AND WAIT:** If you asked clarifying questions, end your turn immediately. Do NOT proceed to Phase 3 until the user answers.

---

## PHASE 3: Challenge

1. Print "PHASE 3: Challenge"
2. Before planning any implementation, critically evaluate the request:
   - **Does this belong in the library or the app?** Only reusable, generic components go in packages/crates. App-specific logic stays in app/. If unsure, start in the app — extract to the library when reuse is needed.
   - **Which package?** core, chat, board, layout, connections, events, memory, routines, skills, review — or a new package?
   - **Is there an existing @houston-ai component?** Search before building. Check the showcase.
   - **Is the API generic enough?** Components must be props-driven, no store dependencies, no app-specific types.
   - **Is the direction right?** Sometimes what looks like a library change is really an app-level wrapper, or vice versa.
   - Does this match the chat-first planning/delegation paradigm?
3. If you see a better approach: **Say so clearly.** Do not sugarcoat it.
4. If the approach is sound: Say "Approach looks sound".
5. **STOP AND WAIT:** Do NOT proceed until the user agrees.

---

## PHASE 4: Plan

1. Print "PHASE 4: Plan"
2. Use the knowledge base context loaded in Phase 1
3. Create a numbered plan with specific steps
4. **Clearly mark which area each step targets** — e.g., "[packages/board] Add BoardItem.priority field" or "[app] Wire priority to KanbanCard"
5. Group steps into "testable chunks" — steps that can be tested together
6. Order chunks so library changes come first, then app
7. If it's a small/simple change, mention: "This is small enough to do all at once"
8. Present the plan to the user
9. **STOP AND WAIT:** Wait for approval.

---

## PHASE 5: Execute (By Testable Chunk)

1. Print "PHASE 5: Execute — [chunk description] — [area]"
2. Do ALL steps in the current testable chunk
3. Report what you did (brief summary)
4. Proceed directly to Phase 6

---

## PHASE 6: Test

1. Print "PHASE 6: Test"
2. Run the appropriate checks for what you touched (see Test Commands below)
3. For Rust changes: ensure `cargo test` passes, not just `cargo check`
4. Fix any failures before proceeding
5. Proceed to Phase 7

---

## PHASE 7: Verify

1. Print "PHASE 7: Verify"
2. Run full verification (same commands as Phase 6, ensure nothing is broken)
3. For UI changes: verify visual fidelity — the app must look identical to before unless the design intentionally changed. Run `/polish` for a final alignment, spacing, and consistency pass if applicable.
4. Say "Ready for testing — please verify and let me know the results"
5. **STOP AND WAIT:** Do NOT continue until the user confirms.
6. If issue: Do NOT fix blindly. Add logging first, ask user to run again, then fix with knowledge.
7. If works: Proceed to next chunk (back to Phase 5) or Phase 8 if all chunks done.

---

## PHASE 8: Refactor

1. Print "PHASE 8: Refactor"
2. Reflect on the implementation:
   - **Library boundary:** Did any app-specific logic leak into packages/crates? Did any generic logic stay in app/?
   - **API cleanliness:** Are component props generic? No store imports, no app types?
   - **Right place:** Is the code in the right file/module, not just the convenient place?
   - **File sizes:** Does any file exceed 200 lines? (CSS: 500 lines.) Extract if so.
   - **Duplication:** Did we duplicate something between app/ and packages/ that should live in one place?
3. If refactor needed: Propose specific improvements and do them after user approval
4. If not: Say "No refactor needed"

---

## PHASE 9: Cleanup

1. Print "PHASE 9: Cleanup"
2. Check for:
   - Unused imports, dead code, debug artifacts
   - **packages/:** No `@/` path aliases, no Zustand imports, no Tauri imports, no app-specific types
   - **app/:** No duplicated logic that should be in the library
3. Clean up or say "No cleanup needed"

---

## PHASE 10: Document

1. Print "PHASE 10: Document"
2. **MANDATORY** — Check and update ALL documentation that references what you changed:
   - **`knowledge-base/*.md`** — Does the component/package section reflect new props, files, types, behavior?
   - **`skills/`** — Does the houston-ai skill (or any other skill) cover new/changed components?
   - **Showcase** — Is the demo up to date with new features and props?
3. For each doc that needs updating: **update it now**, don't just propose changes.
4. If nothing needs updating: Say "No doc updates needed — [brief reason]"

---

## PHASE 11: Complete

1. Print "PHASE 11: Complete"
2. Summarize what was accomplished
3. Evaluate if any knowledge base needs a NEW entry (not just updates — those were done in Phase 10):
   - **New pattern established** — e.g., a new way to consume a @houston-ai component
   - **Architecture decision** — e.g., where a feature boundary was drawn
   - **Framework gotcha** — something that broke and we learned why
   - **Design decision** — visual/UX choice that sets a precedent
4. If YES: Propose specific changes to `knowledge-base/*.md`
5. If NO: Say "No new knowledge base entry needed — [brief reason]"

---

## PHASE 12: Commit

1. Print "PHASE 12: Commit"
2. Ask user: "Ready to commit? (yes/no/skip)"
3. **STOP AND WAIT.**
4. If yes: Stage changes, commit with conventional commit message, push to `claude/wip`
5. If skip: Done

---

# Test Commands

| Area | TypeScript | Rust | Full Build |
|------|-----------|------|------------|
| packages/ | `pnpm typecheck` | — | — |
| crates/ | — | `cargo test --workspace` | `cargo build --workspace` |
| app/ | `cd app && pnpm tsc --noEmit` | `cd app/src-tauri && cargo check` | `cd app && pnpm tauri build` |
| showcase/ | `cd showcase && pnpm tsc --noEmit` | — | `cd showcase && pnpm build` |

---

# Code Quality Rules (Always Apply)

## Library vs App Rules

### Library boundary matters
- Generic, reusable components go in packages/crates. App-specific wiring stays in app/.
- If you're not sure, it probably belongs in the app first. Extract to the library when reuse is needed.

### Props over stores — ALWAYS (in packages/)
Components in packages/ must NEVER import from Zustand, Redux, or any state management library. All data comes via props. All actions are callbacks. The app is responsible for connecting stores to component props.

### No app-specific imports (in packages/)
Never import app/ types into packages/. Use generic types (BoardItem, FeedItem, ChatMessage). The app maps its domain types to library types.

### No `@/` path aliases (in packages/)
Use relative imports within a package. Use package imports (`@houston-ai/core`) between packages. Path aliases break in published libraries.

## AI-Native Reactivity (MANDATORY)

Houston builds **AI-native workspaces**. Users and LLMs are equal participants — both can read and write all workspace data, and **all changes from either must be immediately visible to both.**

### Rules:
- **Every data surface must react to file changes**, regardless of who made them (user via UI, agent via file write, external edit)
- **All `.houston/` data fetching uses TanStack Query** with query invalidation via Tauri events + file watcher. Never use manual load-on-mount-only patterns.
- **Never build a feature where "the agent can do X but the UI won't show it until refresh"** — this violates the core paradigm
- **Agent store writes (Rust) must emit events** so the frontend can invalidate queries
- **The `.houston/` file watcher is architecturally required**, not optional — it catches agent writes that bypass Tauri commands

## General Rules

### Think Like a Code Reviewer
Before ANY edit, ask: "Would this pass code review?"
- **NEVER** justify with "it was the fastest way"
- Put code in the RIGHT place, not the convenient place

### Be Critical, Not Agreeable
- **NEVER** say "You're absolutely right!" if there's a better approach
- Tell the user when something is wrong

### No Backward Compatibility (for internal code)
- Internal code (types, APIs, Rust modules, TS functions): if you need to change it, change it. Don't keep old behavior "just in case."
- **User data is different.** Files under `~/Documents/Houston/**` and `~/.houston/**` already exist on users' machines. If you change the shape, layout, or location of persisted files, ship an **idempotent migration** that runs on upgrade (see `houston-agent-files::migrate_agent_data`). Never leave existing users with broken data.

### Testing Is Mandatory
- Every feature gets tests. No exceptions.
- Tests do NOT count toward the 200-line file size limit.

### Type Safety Over Strings
- Domain concepts (status, classification) MUST be enums
- TypeScript: discriminated unions. Rust: enums with Display/FromStr.

### No Silent Failures
- Errors surface to the user. No swallowed errors.
- `let _ = something.await` is banned for operations that could meaningfully fail
- No `unwrap()` in production Rust code

### No Hover-Only Affordances
- All interactive elements must be visible without hovering
- Hover can enhance (background highlight) but must not be the only way to discover an action

### Search Before Building
- Check shadcn/ui registry, @houston-ai showcase, existing components, npm — before building from scratch

### File Size Limits
- **200 lines max** per file (excluding tests). CSS: 500 lines.
- **NEVER compress code to meet the limit.** Extract into separate modules instead.

---

# Git Workflow

## Branching Model
- **`main`** — Always releasable. Protected. Only PRs, never direct pushes.
- **`claude/wip`** — The working branch. All Claude Code sessions commit here. Multiple sessions can work in parallel on different files.
- **`feature/*`** — Optional, for big isolated features that need their own branch.

## Daily Development Flow
1. Work on `claude/wip` branch
2. Multiple agents commit independently (they touch different files)
3. Before committing, agents MUST get user approval (Phase 12)
4. When ready to merge: PR `claude/wip` -> `main`, squash merge for clean history
5. After merge, reset `claude/wip` from `main`: `git checkout claude/wip && git reset --hard main`

## Commit Messages
Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `chore:` — Maintenance, dependencies, config
- `refactor:` — Code restructuring (no behavior change)
- `style:` — Formatting, CSS (no logic change)
- `test:` — Adding or fixing tests

## Before Every Commit
1. Ensure you're on `claude/wip`: `git branch --show-current`
2. If on `main`, switch: `git checkout claude/wip` (create if needed: `git checkout -b claude/wip`)
3. Stage specific files (not `git add -A`)
4. Commit with conventional message
5. Push: `git push origin claude/wip`

---

# Release Protocol

All packages share ONE version number. Every release bumps ALL packages together.

## Versioning
- All packages follow semver: `0.x.y`
- **Default: bump PATCH only** (`0.3.0` → `0.3.1` → `0.3.2`). Do this for every release unless told otherwise.
- **Minor bumps (`0.3.x` → `0.4.0`) require explicit user permission.** Never bump minor on your own. Instead, if you think it's time (big feature landed, significant milestone, breaking change), **suggest it**: "This might warrant a 0.4.0 — want to bump minor?" Then wait for approval.
- We're in no rush to reach 1.0. FastAPI has been 0.x for years while powering serious production systems. Same energy here.

## How to Release (CI/CD — the standard way)

**This is the normal release flow. Use this unless CI is broken.**

```bash
./scripts/version.sh 0.3.0   # Bump version in all package.json + Cargo.toml
git add -A && git commit -m "release: v0.3.0"
git tag v0.3.0
git push origin main --tags
```

GitHub Actions (`.github/workflows/release.yml`) takes over:
1. Builds the Tauri app on macOS
2. Signs with Apple Developer ID (`$APPLE_SIGNING_IDENTITY`)
3. Notarizes the `.app` with Apple
4. Creates a signed `.dmg`
5. Generates `latest.json` for the auto-updater
6. Creates a **draft** GitHub Release with all artifacts

**After CI finishes:** Go to GitHub Releases, review the draft, and click "Publish." Users running Houston will see "Update available" and can update in-app.

## How to Release (Manual — fallback)

If CI is broken or you need a quick local build, use the `/build-houston` skill. It handles: clean stale artifacts → `pnpm tauri build` → notarize the DMG (Tauri skips this) → staple → verify → copy to `~/Desktop/Houston-{version}.dmg`.

## Version Bump Only (no publish)
```bash
./scripts/version.sh 0.2.0
```

## Required Environment Variables for Releases

These must be set in the shell (for local builds) AND in GitHub Secrets (for CI):

| Variable | Purpose | Where to get it |
|----------|---------|-----------------|
| `APPLE_SIGNING_IDENTITY` | Developer ID string | Apple Developer portal → Certificates |
| `APPLE_API_KEY` | App Store Connect key ID | App Store Connect → Users → Keys |
| `APPLE_API_KEY_PATH` | Path to `.p8` key file | Downloaded when creating the key |
| `APPLE_API_ISSUER` | App Store Connect issuer UUID | App Store Connect → Users → Keys |
| `TAURI_SIGNING_PRIVATE_KEY` | Ed25519 key for update signing | `pnpm tauri signer generate` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for the above key | Set during key generation |
| `APTABASE_APP_KEY` | Analytics app key | aptabase.com dashboard |
| `SENTRY_DSN` | Crash reporting DSN | sentry.io project settings |

For CI, also needed as GitHub Secrets:
- `APPLE_CERTIFICATE` — base64-encoded `.p12` certificate
- `APPLE_CERTIFICATE_PASSWORD` — password for the `.p12`

**Never hardcode these values in code or config files.** They are read via `option_env!()` in Rust (compile-time) and passed as env vars in CI.

---

# Production Infrastructure

Houston has four production systems. All are **dormant by default** — they activate only when their env vars are set.

## Auto-Updater (`tauri-plugin-updater`)

- **Config:** `tauri.conf.json` → `plugins.updater` (endpoint + pubkey)
- **Frontend:** `app/src/hooks/use-update-checker.ts` → checks on launch + every 30 min
- **UI:** `app/src/components/shell/update-checker.tsx` → banner with download/restart buttons
- **How it works:** Checks `latest.json` on GitHub Releases. If a newer version exists, downloads `.app.tar.gz`, verifies Ed25519 signature, replaces binary, relaunches.
- **Important:** Update signing (Ed25519 via `TAURI_SIGNING_PRIVATE_KEY`) is SEPARATE from Apple code signing. Both are needed.
- **Important:** Users who install a version WITHOUT the updater can never auto-update. The updater must ship in every release.

## Analytics (`@aptabase/web`)

- **Implementation:** Pure JavaScript — runs in the webview, no Rust plugin. This avoids Tokio runtime conflicts and works in future Capacitor mobile builds too.
- **Init:** `app/src/lib/analytics.ts` — reads `APTABASE_APP_KEY` env var via Vite `define` (baked at build time). If empty, all tracking silently no-ops.
- **Debug/Release:** `import.meta.env.DEV` sets `isDebug` — events from `pnpm tauri dev` show as "Debug" in the Aptabase dashboard, release builds show as "Release".
- **Currently tracked events:** `app_launched`, `agent_created`, `chat_message_sent`

### Adding new analytics events
When building a new feature, add tracking with one line:
```typescript
import { analytics } from "@/lib/analytics";
analytics.track("event_name", { key: "value" });
```
Props must be `Record<string, string | number>` (no booleans). Tracking is fire-and-forget — it never throws or blocks. If Aptabase isn't configured, calls silently no-op.

**Analytics tracking goes in `app/` only** — never in `packages/`. The library boundary rule applies: packages are generic, analytics is app-specific.

## Crash Reporting (`sentry` + `tauri-plugin-sentry`)

- **Backend:** Initialized in `lib.rs` BEFORE other plugins, conditional on `option_env!("SENTRY_DSN")`
- **Frontend:** Auto-injected by `tauri-plugin-sentry` — catches JS errors + unhandled promise rejections with zero frontend code
- **Rust panics:** Captured automatically via sentry's panic handler
- **When to check:** If a user reports a crash or the app behaves unexpectedly, check the Sentry dashboard before reading local logs

## Auto-Update UI

- **Hook:** `app/src/hooks/use-update-checker.ts` — checks on launch + every 30 min
- **Component:** `app/src/components/shell/update-checker.tsx` — compact notification in sidebar footer
- **States:** idle (hidden) → available (shows version + update button) → downloading (progress) → ready (restart button)
- **Where it renders:** `AppSidebar` footer prop in `app/src/components/shell/sidebar.tsx`

## CI/CD (GitHub Actions)

- **Workflow:** `.github/workflows/release.yml`
- **Trigger:** Push a tag matching `v*`
- **Output:** Draft GitHub Release with signed + notarized DMG + updater artifacts (`latest.json`)
- **Duration:** ~10-15 minutes (compile + sign + notarize)
- **Draft releases:** CI creates DRAFTS — users don't see them until you publish on GitHub. Use this as a QA gate.
- **Secrets:** All configured in GitHub repo Settings → Secrets → Actions

## Release Checklist (step by step)

Every time you ship a release, follow this exact sequence:

1. **Verify code:** `cargo check --workspace && cd app && pnpm tsc --noEmit`
2. **Commit:** Stage and commit all changes to `main`
3. **Bump version:** `./scripts/version.sh 0.3.X` (patch by default — see Versioning rules above)
4. **Commit version bump:** `git add -A && git commit -m "release: v0.3.X"`
5. **Tag and push:** `git tag v0.3.X && git push origin main --tags`
6. **Wait for CI:** ~10-15 min. Check github.com/ja-818/houston/actions
7. **If CI fails:** Read logs with `gh run view <id> --log-failed`, fix, commit, re-tag (delete old tag first: `git tag -d v0.3.X && git push origin :refs/tags/v0.3.X`, then re-tag + push)
8. **Publish:** Go to GitHub Releases → click the draft → "Publish release"
9. **Verify:** Installed apps should show "Update available" in the sidebar within 30 min (or on next launch)

### Common CI failures and fixes
- **`bundle_dmg.sh` failed:** Flaky on CI runners. Just rerun: `gh run rerun <id>`
- **Missing env var at compile time:** A new `env!()` was added — must add the secret to GitHub AND the workflow YAML
- **Notarization failed:** Apple's servers are slow. Rerun usually fixes it.
- **TypeScript errors:** Run `pnpm tsc --noEmit` locally BEFORE tagging

---

# Agent Definition System

Houston hosts multiple "agent definitions" — configurable AI agent manifests.

## Three Tiers
1. **JSON-only:** `manifest.json` defines tabs, prompt, colors, icon. Uses built-in @houston-ai components.
2. **Custom React:** `manifest.json` + `bundle.js` with custom components. Components import @houston-ai as peer deps.
3. **Custom Rust:** PR a new crate to this repo. Agent definition declares `features: ["capability"]` in manifest.

## Manifest Location
- Built-in agents: `app/src/agents/builtin/`
- Installed agent definitions: `~/.houston/agents/{id}/manifest.json`

## Agent Location
- All workspaces: `~/Documents/Houston/{workspace-name}/`
- Agent directories: `~/Documents/Houston/{workspace-name}/{agent-name}/`
- Agent metadata: `.houston/agent.json`
- Agent data: `.houston/activity.json`, `.agents/skills/<name>/SKILL.md` (skill.sh / Claude Code convention, mirrored to `.claude/skills/<name>` via symlink), etc.
