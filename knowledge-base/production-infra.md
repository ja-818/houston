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
- **Duration:** ~15-20 min (compile 2 arches + sign + notarize)
- **Draft = QA gate.** Users don't see until published on GitHub.

## macOS Universal (arm64 + Intel)

Houston ships ONE DMG that runs natively on Apple Silicon AND Intel. Same app, same download, same update channel.

### How it works
- `release.yml` builds `houston-engine` TWICE — once per real triple (`aarch64-apple-darwin`, `x86_64-apple-darwin`).
- `build.rs` stages both as per-triple sidecars: `src-tauri/binaries/houston-engine-aarch64-apple-darwin` + `-x86_64-apple-darwin`. Tauri universal build requires per-triple sidecars (NOT a pre-lipo'd fat binary).
- `tauri-action` invoked with `--target universal-apple-darwin`. It runs cargo twice, then `lipo`s the outputs into one fat `.app`. Bundle lands at `target/universal-apple-darwin/release/bundle/`.
- Verification step runs `lipo -info` on the embedded engine sidecar and fails the release if either slice is missing.
- `latest.json` ships FOUR platform keys (`darwin-aarch64`, `darwin-aarch64-app`, `darwin-x86_64`, `darwin-x86_64-app`) all pointing at the same tarball + signature. Intel users on older Houston installs check `darwin-x86_64` — if that key is absent they NEVER see the update prompt.
- `bundle.macOS.minimumSystemVersion = 10.15` in `tauri.conf.json` — required for Intel Macs old enough to matter.

### Engine-only release
`.github/workflows/engine-release.yml` (tag `engine-v*`) builds `houston-engine` standalone for Linux (arm64 + x86_64 musl) and macOS (arm64 + Intel). Four artifacts total.

### Local universal build
```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
cargo build --release --target aarch64-apple-darwin -p houston-engine-server
cargo build --release --target x86_64-apple-darwin -p houston-engine-server
cd app && pnpm tauri build --target universal-apple-darwin
```
Output: `target/universal-apple-darwin/release/bundle/{macos,dmg}/`.

### Dev is single-arch
`pnpm tauri dev` stays single-triple (whatever the host is). `build.rs` falls back to `target/release/` when a per-triple path is missing, so nothing breaks.

### Do NOT break Intel without warning
Removing an arch from `release.yml` (or dropping `darwin-x86_64*` keys from `latest.json`) strands every Intel user silently. Migrate with a deprecation release first.
