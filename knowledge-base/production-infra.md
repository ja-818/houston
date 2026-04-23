# Production Infrastructure

Four prod systems. All **dormant by default** — activate only when env vars set.

## Auto-updater (`tauri-plugin-updater`)

- **Config:** `tauri.conf.json` → `plugins.updater` (endpoint + pubkey)
- **Frontend:** `app/src/hooks/use-update-checker.ts` → checks on launch + every 30 min
- **UI:** `app/src/components/shell/update-checker.tsx` → banner w/ download/restart
- **How:** Checks `latest.json` on GitHub Releases. Newer version? Downloads `.app.tar.gz`, verifies Ed25519 sig, replaces binary, relaunches.
- **Critical:** Update signing (Ed25519 via `TAURI_SIGNING_PRIVATE_KEY`) is SEPARATE from Apple code signing. Both needed.
- **Critical:** Users who install version WITHOUT updater can never auto-update. Ship updater in EVERY release.

## Analytics (`posthog-js`)

- **Pure JS** — runs in webview, no Rust plugin. Avoids Tokio runtime conflicts. Works in future Capacitor mobile too.
- **Init:** `app/src/lib/analytics.ts` — reads `POSTHOG_KEY` + `POSTHOG_HOST` via Vite `define` (baked at build time). Empty key → silent no-op. PostHog `init()` runs at module load; `analytics.init()` is called from `App.tsx` to resolve the install_id and `identify()` the PostHog distinct_id before the first event.
- **Install identity:** `app/src/lib/install-id.ts` — mints a UUID on first launch, persists via `tauriPreferences` (`install_id` key). Used as the anonymous PostHog `distinct_id` until a user signs in (PR 2 — `analytics.alias/identify`). Gives per-user retention and activation funnels without requiring auth.
- **Debug/Release:** `import.meta.env.DEV` → `is_debug` super property. Filter it out in dashboards to exclude dev activity.
- **Super properties** (set on every event): `app_version`, `os`, `install_id`, `is_debug`.
- **Group analytics:** `analytics.group("workspace", workspaceId, { name, provider })` fires on `workspace_opened` — unlocks per-workspace retention in PostHog.

### Event surface
- **Lifecycle:** `app_launched`, `user_returned` (derived: `app_launched` + existing install_id), `session_started`, `session_ended`, `onboarding_completed`
- **Agent / workspace:** `agent_created`, `agent_selected`, `workspace_created`, `workspace_opened`, `workspace_imported`, `provider_configured`
- **Chat:** `chat_message_sent`, `chat_message_received` (activation event)
- **UX:** `tab_switched`, `mission_created`, `error_shown`
- **Updater:** `app_update_available`, `app_update_downloaded`

**Activation milestone:** `chat_message_received` — user sent a message and got a reply. Configure as the activation event in PostHog; all retention/funnel insights key off it.

### Adding event
```typescript
import { analytics } from "@/lib/analytics";
analytics.track("event_name", { key: "value", flag: true });
```
Props: `Record<string, string | number | boolean>`. Fire-and-forget. Never throws/blocks. Not configured → silent no-op.

**Analytics in `app/` only** — never in `ui/`. Library boundary rule applies.

### PostHog dashboards (configure in UI, not code)
1. **Overview**: DAU / WAU / MAU (filter out `is_debug = true`)
2. **Retention**: Weekly-cohort grid on `chat_message_received`
3. **Activation funnel**: `app_launched` → `agent_created` → `chat_message_sent` → `chat_message_received`
4. **Engagement depth**: events per user per day, sessions per user per week
5. **Feature adoption**: `mission_created`, `provider_configured`, `workspace_imported` breakdowns

### BigQuery export (optional)
PostHog → BigQuery plugin → target GCP project (burns credits). SQL-queryable event history forever, immune to PostHog retention limits. Useful for investor-update analytics.

## Crash reporting (`sentry` + `tauri-plugin-sentry`)

- **Backend:** Initialized in `lib.rs` BEFORE other plugins. Conditional on `option_env!("SENTRY_DSN")`.
- **Frontend:** Auto-injected by `tauri-plugin-sentry`. Catches JS errors + unhandled promise rejections. Zero frontend code.
- **Rust panics:** Captured via sentry panic handler.
- **Check:** User reports crash or weird behavior → Sentry dashboard BEFORE local logs.

## Required env vars

Shell (local builds) AND GitHub Secrets (CI):

| Var | Purpose | Source |
|-----|---------|--------|
| `APPLE_SIGNING_IDENTITY` | Developer ID | Apple Developer portal → Certificates |
| `APPLE_API_KEY` | App Store Connect key ID | ASC → Users → Keys |
| `APPLE_API_KEY_PATH` | Path to `.p8` key | Downloaded when creating key |
| `APPLE_API_ISSUER` | ASC issuer UUID | ASC → Users → Keys |
| `TAURI_SIGNING_PRIVATE_KEY` | Ed25519 key for update signing | `pnpm tauri signer generate` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for above | Set during gen |
| `POSTHOG_KEY` | PostHog project API key (client-side, public-safe) | PostHog → Project settings → Project API key |
| `POSTHOG_HOST` | PostHog ingest host | `https://us.i.posthog.com` (or EU equivalent) |
| `SENTRY_DSN` | Crash reporting DSN | sentry.io project settings |

CI also needs as Secrets:
- `APPLE_CERTIFICATE` — base64 `.p12`
- `APPLE_CERTIFICATE_PASSWORD` — password for `.p12`

**Never hardcode.** Read via `option_env!()` in Rust (compile-time). Pass as env vars in CI.

## CI/CD (GitHub Actions)

- **Workflow:** `.github/workflows/release.yml`
- **Trigger:** Push tag matching `v*`
- **Output:** Draft GitHub Release w/ signed+notarized DMG + `latest.json`
- **Duration:** ~10-15 min (compile + sign + notarize)
- **Draft = QA gate.** Users don't see until published on GitHub.
