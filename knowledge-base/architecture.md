# Architecture

Houston = open platform. Organized as **6 products + 3 code libraries**.

## The 6 products (end-user)

| Product | Dir | What |
|---------|-----|------|
| Houston App | `app/` | Desktop app (Tauri 2). Non-technical users create agents, run parallel terminal sessions. |
| Houston Mobile | `mobile/` | Mobile companion. Mirrors desktop. |
| Houston Store | `store/` | Registry of pre-built agents. One-click install. |
| Houston Website | `website/` | gethouston.ai landing. |
| Houston Always On | `always-on/` | One-click deploy Engine to VPS/microVM. Agents 24/7. **TBD.** |
| Houston Teams | `teams/` | Hosted multi-tenant agent pool w/ perms. **TBD.** |

## The 3 code libraries

| Library | Dir | What | Consumers |
|---------|-----|------|-----------|
| Houston UI | `ui/` | `@houston-ai/*` React components | App, Mobile, future hosted products' frontends |
| Houston Engine | `engine/` | Rust crates. **Frontend-agnostic backend.** Open source. Anyone self-hosts or uses as desktop-app backend. | App (via `app/houston-tauri` adapter), Always On, Teams, Cloud customers |
| Houston Cloud | `cloud/` | Managed Engine deployments. **TBD.** | Third-party devs building on Engine |

## Key distinction: Engine is standalone

**Houston Engine is the reusable backend.** Devs run it themselves (open source) or rent it via Cloud. Devs put ANY frontend on top — Houston App is just ONE consumer.

- Engine stays pure Rust, no Tauri, no React, no webview assumption
- `app/houston-tauri/` is the **adapter** that applies Engine to the Tauri desktop frontend. Lives under `app/`, not `engine/`.
- Future Always On + Teams consume Engine over network (HTTP/WS — **not yet built**)

## Infra dirs (not products)

| Dir | What |
|-----|------|
| `desktop-mobile-bridge/` | Cloudflare Worker + Durable Object. Rendezvous server for Desktop↔Mobile (NAT traversal). Deploys separately. Only App-family infra. |
| `knowledge-base/` | These caveman docs. Loaded on demand. |
| `scripts/` | Version bump, release, CLI binary fetch. |

## Engine crates (`engine/`)

All pure libraries. No frontend assumptions.

- `houston-db` — libSQL. Only `chat_feed` + `preferences` tables.
- `houston-terminal-manager` — Claude/Codex subprocess manager, parser, streaming
- `houston-events` — hook/webhook/lifecycle queue
- `houston-channels` — Telegram/Slack adapters
- `houston-scheduler` — cron + heartbeat
- `houston-agent-files` — `.houston/` file I/O, schemas, migration
- `houston-agents-conversations` — chat feed persistence
- `houston-ui-events` — typed event bus + `EventSink` trait (Tauri/broadcast impls, frontend-neutral)
- `houston-file-watcher` — `notify` on `.houston/`, emits events
- `houston-composio` — Composio MCP server lifecycle
- `houston-sync` — WebSocket sync envelope (desktop↔mobile pairing; engine WS lives in `houston-engine-server`)
- `houston-skills` — skill discovery + management
- `houston-engine-core` — runtime container (`EngineState`, paths, `workspaces::*`, `agents::{activity,routines,routine_runs,config,conversations,files,prompt,self_improvement}`). Domain logic relocated from the Tauri adapter.
- `houston-engine-protocol` — wire types (REST DTOs, WS envelope, error codes). Matches `ui/engine-client/src/types.ts`.
- `houston-engine-server` — axum HTTP+WS binary `houston-engine`. The process every client talks to. Current REST surface: `/v1/{health,version,ws,workspaces,agents/activities,agents/routines,agents/routine-runs,agents/config,agents/conversations,agents/files}`.

**Standalone engine, shipping now:** Phase 0-3 of the engine rollout is merged (trait-based decoupling, HTTP+WS binary, TS client scaffold). Phase 2 feature migration is in flight — workspaces + agents typed CRUD + agent files are now engine-owned with Tauri commands acting as thin proxies. Phases 4-5 complete the desktop subprocess flip and public deploy story — see `engine-server.md`.

## App-side Rust (`app/`)

- `app/houston-tauri/` — Tauri adapter. Binds engine crates to Tauri state/events/commands. **Not part of Engine.**
- `app/src-tauri/` — Tauri binary. Depends on `houston-tauri` + engine crates.

## UI packages (`ui/`)

`@houston-ai/` + `core, chat, board, layout, connections, events, memory, routines, skills, review, agent, agent-schemas, sync-protocol, engine-client`

Mostly internal. `@houston-ai/engine-client` is the one package we expect
third-party devs to install — it's the TypeScript front door to the engine
HTTP+WS protocol.

## Current gap to vision

| Goal | Status |
|------|--------|
| Clear product dirs | ✅ done |
| App ↔ Engine clear boundary | ✅ `app/houston-tauri` split |
| UI standalone | ✅ |
| Engine reusable by non-Tauri frontends | 🟡 binary ships, protocol drafted, command migration in progress |
| Always On | 🟡 Dockerfile + compose + systemd unit shipped; needs docs polish |
| Teams / Cloud | ❌ TBD placeholders |
| Store populated | ❌ placeholder |

## Direction of work
- **library-first** — new reusable capability → ui/ or engine/, then consumed by app/
- **app-first** — feature needed in app/, extract to library when reuse appears
- **single-layer** — only one area touched

Not sure? Start in app/. Extract later.
