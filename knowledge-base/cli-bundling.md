# Bundled CLIs — codex, composio, claude-code

Houston ships two upstream CLIs inside the signed/notarized desktop
`.app` and runtime-downloads a third. The goal is zero terminal exposure
for non-technical users — they install Houston, click in, and the chat
agent works without ever opening a shell.

## What ships where

| CLI         | License       | Distribution      | Where it lives                                                        |
|-------------|---------------|-------------------|------------------------------------------------------------------------|
| codex       | Apache-2.0    | Bundled (universal) | `Houston.app/Contents/Resources/bin/codex` — single Mach-O fat binary |
| composio    | MIT           | Bundled (per-arch)  | `Resources/bin/composio-aarch64/`, `Resources/bin/composio-x86_64/`   |
| claude-code | PROPRIETARY   | Runtime download    | `~/.local/bin/claude` (`%LOCALAPPDATA%\Programs\claude\claude.exe`)   |

claude-code is licensed in a way that doesn't permit redistribution, so
we can't bundle it. Instead the engine downloads + sha256-verifies on
first launch using a manifest pinned in `cli-deps.json`.

codex is a Rust binary so we `lipo -create` the two arch tarballs into
one universal binary. composio is a Bun-bundled JS app whose runtime is
arch-specific — `lipo` can't combine them, so we ship both and the
engine resolves the right directory at runtime via `std::env::consts::ARCH`.

## Pinned manifest — `cli-deps.json`

`cli-deps.json` at the repo root is the single source of truth for
versions, URLs, and SHA-256 checksums. CI fetches based on it. The
runtime claude-code installer reads it from the bundle. Bumping a
version:

```bash
./scripts/bump-cli.sh codex 0.122.0
./scripts/fetch-cli-deps.sh both    # downloads + prints new checksums
# paste the printed checksums into cli-deps.json
./scripts/fetch-cli-deps.sh both    # re-run, this time verifies
```

The manifest is staged into the .app at
`Resources/bin/cli-deps.json` so the runtime claude-code installer can
read pinned URLs + checksums without a separate network round-trip.

## Build pipeline

`scripts/fetch-cli-deps.sh both`:
1. Downloads each bundled CLI for both arches using URLs from the manifest.
2. Verifies sha256 against pinned checksums (mismatch is fatal).
3. `lipo -create`s the two codex slices into a single universal Mach-O.
4. Stages each composio arch under `composio-aarch64/` / `composio-x86_64/`.
5. Prunes cross-platform `acp-adapters/codex/<plat>/` directories that the
   resolved arch can never execute (~580 MB savings).
6. Stages `cli-deps.json` itself for the runtime installer.

`tauri.conf.json#bundle.resources` then maps the staging dir verbatim
into the `.app`:

```jsonc
"resources": { "resources/bin": "bin" }
```

CI: `.github/workflows/release.yml` calls `fetch-cli-deps.sh both` before
the tauri build, then verifies layout + signing invariants for every
Mach-O inside `Resources/bin/` (Developer ID, hardened runtime, both
arch slices).

### Pre-signing bundled binaries (required)

`tauri-action`'s `codesign --force --deep` signs the .app's main binary,
frameworks, helpers, and Mach-Os at the **top level** of `Resources/`,
but it does **not** recurse into nested directories under `Resources/`.

Concretely: `Resources/bin/codex` (top level) gets signed by tauri's
deep codesign; `Resources/bin/composio-aarch64/composio` (one level
deeper) does **not**, and Apple notary then rejects the bundle with:

- "The signature of the binary is invalid"
- "The signature does not include a secure timestamp"
- "The executable does not have the hardened runtime enabled"

Fix: pre-sign every bundled Mach-O in `app/src-tauri/resources/bin/`
**before** tauri-action runs. The release workflow imports a temporary
keychain with the Developer ID cert and runs:

```bash
codesign --force --options runtime --timestamp \
  --sign "$APPLE_SIGNING_IDENTITY" "$f"
```

on `codex`, `composio-aarch64/composio`, `composio-x86_64/composio`.
Tauri's later deep sign leaves these alone (it doesn't visit nested
Resources subdirs), so the pre-applied signature carries through to
notarization.

Any new bundled binary added to `Resources/bin/` must be added to the
"Pre-sign bundled CLI binaries" step in `release.yml`. The post-build
"Verify bundled CLI invariants" step will fail the release if a
Mach-O ends up unsigned, ad-hoc-signed, or missing hardened runtime.

## Runtime resolution

`engine/houston-cli-bundle/` is the resolver crate. Public functions:

- `bundled_bin_dir() -> Option<PathBuf>` — top of the bundle dir, or
  `None` outside a recognizable .app/MSI layout.
- `bundled_codex_path()` — universal codex binary if bundled.
- `bundled_composio_binary()` — composio binary for the host arch.
- `bundled_path_entries()` — dirs to prepend to PATH so subprocesses
  resolve the bundled copies.
- `load_bundled_manifest()` → `CliDepsManifest` with typed `CliEntry`
  accessors.

Detection is structural — we walk parent dirs of `current_exe()`
checking for `Houston.app/Contents/MacOS/<exe>` (macOS) or a sibling
`resources/bin/` (Windows). No env vars; works even when launched from
Spotlight, Dock, or Finder.

`engine/houston-terminal-manager/src/claude_path.rs` prepends the
bundled paths to the resolved login-shell PATH so subprocess
spawns of `claude`/`codex`/`composio` find the bundled copies before
anything on the user's PATH.

Runtime-installed Claude has one extra trap: `claude_path::init()`
caches PATH at engine boot, but the first-launch installer may create
`~/.local/bin` after that cache is built. Provider auth/login must use
the absolute path returned by `provider::resolve_claude()` for managed
Claude installs. Do not gate login on a bare `claude` PATH lookup, or
the UI can report "installed" while login says "not installed".

## Lifecycle — auto-install + auto-upgrade

`engine/houston-engine-server/src/main.rs` spawns two background tasks at
boot:

1. `houston_composio::lifecycle::ensure_and_upgrade` — emits
   `ComposioCliReady` immediately when bundled is present (production).
   For dev / unbundled builds, runs the upstream `curl | bash` installer
   into `~/.composio` and runs `composio upgrade` on Houston version
   bumps.

2. `houston_claude_installer::ensure_and_upgrade` — reads
   `cli-deps.json` for the pinned `claude-code` version and:
   - If installed at the pinned version → emit `ClaudeCliReady`.
   - Else → stream-download with sha256 verification, atomic rename
     into `~/.local/bin/claude`, persist version marker, emit
     `ClaudeCliInstalling { progress_pct }` then `ClaudeCliReady`.
   - On failure → `ClaudeCliFailed { message }`.

Both run on independent tasks so a slow claude download never blocks
composio readiness.

## API surface — `/v1/claude/*`

Mirrors `/v1/composio/*`:

- `GET /v1/claude/cli-installed` → `{ installed: bool }`.
- `GET /v1/claude/status` → `{ installed, installPath, pinnedVersion, installedVersion }`.
- `POST /v1/claude/install` → kicks off a fresh install in the
  background. Progress + completion stream over the WS firehose as
  `ClaudeCliInstalling` / `ClaudeCliReady` / `ClaudeCliFailed` events.

`ProviderStatus` (returned by `GET /v1/providers/<name>/status`) gains
two new fields:

- `installSource: "bundled" | "managed" | "path" | "missing"` —
  Houston's view of where the binary came from. Renders as a chip in
  the provider settings UI.
- `cliPath: string | null` — absolute path Houston will spawn.
  Surfaces in diagnostics.

## DMG size

Bundled CLIs add ~700 MB to `Resources/`:

- codex universal: 340 MB
- composio-aarch64: ~180 MB
- composio-x86_64:  ~190 MB

DMG compression brings the user-facing download to ~350-450 MB. This is
a deliberate trade — the target user is non-technical and would not
successfully run a separate installer for each provider CLI.

## Adding a new bundled CLI

1. Add an entry to `cli-deps.json` with `bundled: true`, the upstream
   URLs per platform, and (initially) empty checksums.
2. Update `scripts/fetch-cli-deps.sh` if the archive layout differs from
   the existing patterns (single binary vs. multi-file Bun-style bundle).
3. Run `./scripts/fetch-cli-deps.sh both` and pin the printed checksums.
4. Add a resolver in `houston-cli-bundle::lib.rs`
   (`bundled_<name>_path()`).
5. If the CLI needs to be on PATH for agents to invoke it, add the
   directory to `bundled_path_entries()`.
6. Update the CI bundle-invariant check in `release.yml`.

## Adding a new runtime-downloaded CLI

1. Add an entry to `cli-deps.json` with `bundled: false`,
   `install_target` (file path), per-platform URLs, and pinned
   sha256 checksums.
2. Mirror the `houston-claude-installer` crate structure (or extend it
   if the auth + version-marker pattern is identical).
3. Wire into `main.rs::spawn_cli_lifecycles`.
4. Add `<Name>CliInstalling/Ready/Failed` events to `HoustonEvent` and
   route them in `engine_protocol::event_topic`.
5. Add `/v1/<name>/*` REST routes mirroring `routes/claude.rs`.

## Files involved

- `cli-deps.json` — pinned versions, URLs, checksums.
- `scripts/fetch-cli-deps.sh` — fetch + lipo + prune + stage.
- `scripts/bump-cli.sh` — version bumper (clears stale checksums).
- `scripts/install-claude-code.sh` — legacy bash installer; kept for
  manual recovery / debugging. The Rust runtime installer is the
  blessed path.
- `app/src-tauri/tauri.conf.json#bundle.resources` — Tauri-side wiring.
- `app/src-tauri/build.rs` — ensures the staging dir exists for `pnpm tauri dev`.
- `engine/houston-cli-bundle/` — resolver crate.
- `engine/houston-claude-installer/` — runtime download crate.
- `engine/houston-composio/src/install.rs` — bundle-aware composio resolver.
- `engine/houston-engine-core/src/provider.rs` — `InstallSource` enum + status.
- `engine/houston-terminal-manager/src/claude_path.rs` — PATH augmentation.
- `engine/houston-engine-server/src/routes/claude.rs` — `/v1/claude/*`.
- `.github/workflows/release.yml` — fetch + verify steps.
