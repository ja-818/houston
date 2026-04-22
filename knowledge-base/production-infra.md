# Production Infrastructure

Four prod systems. All **dormant by default** — activate only when env vars set.

## Auto-updater (`tauri-plugin-updater`)

- **Config:** `tauri.conf.json` → `plugins.updater` (endpoint + pubkey)
- **Frontend:** `app/src/hooks/use-update-checker.ts` → checks on launch + every 30 min
- **UI:** `app/src/components/shell/update-checker.tsx` → banner w/ download/restart
- **How:** Checks `latest.json` on GitHub Releases. Newer version? Downloads `.app.tar.gz`, verifies Ed25519 sig, replaces binary, relaunches.
- **Critical:** Update signing (Ed25519 via `TAURI_SIGNING_PRIVATE_KEY`) is SEPARATE from Apple code signing. Both needed.
- **Critical:** Users who install version WITHOUT updater can never auto-update. Ship updater in EVERY release.

## Analytics (`@aptabase/web`)

- **Pure JS** — runs in webview, no Rust plugin. Avoids Tokio runtime conflicts. Works in future Capacitor mobile too.
- **Init:** `app/src/lib/analytics.ts` — reads `APTABASE_APP_KEY` via Vite `define` (baked at build time). Empty key → silent no-op.
- **Debug/Release:** `import.meta.env.DEV` sets `isDebug`. `pnpm tauri dev` events = "Debug" in dashboard. Release = "Release".
- **Tracked:** `app_launched`, `agent_created`, `chat_message_sent`

### Adding event
```typescript
import { analytics } from "@/lib/analytics";
analytics.track("event_name", { key: "value" });
```
Props must be `Record<string, string | number>` (no booleans). Fire-and-forget. Never throws/blocks. Not configured → silent no-op.

**Analytics in `app/` only** — never in `ui/`. Library boundary rule applies.

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
| `APTABASE_APP_KEY` | Analytics app key | aptabase.com dashboard |
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
