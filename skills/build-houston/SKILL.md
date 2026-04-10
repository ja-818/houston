---
name: build-houston
description: "Build a fully signed + notarized Houston macOS DMG that a recipient can double-click with zero Gatekeeper warnings and zero terminal commands. Handles the complete release pipeline: clean stale artifacts, run `pnpm tauri build`, notarize the DMG wrapper (Tauri only notarizes the app inside), staple, verify with spctl, and drop a ready-to-share file at ~/Desktop/Houston-0.2.0.dmg. Use when the user says /build-houston or asks to 'build Houston', 'build the Mac app to send', 'make a dmg', 'ship to cofounder', or similar."
---

# /build-houston — Ship Houston to macOS

Produces a fully signed + notarized + stapled `Houston-0.2.0.dmg` on the user's Desktop, ready to drag into Slack. Recipient double-clicks the dmg, drags Houston.app to Applications, launches — **zero warnings, zero commands**.

## The Core Problem This Skill Solves

Tauri's `pnpm tauri build` signs + notarizes the **`.app`** but does **not** notarize the **`.dmg` wrapper**. If you send a Tauri-produced dmg as-is, macOS Gatekeeper rejects it on the recipient's machine with *"Apple cannot check it for malicious software."* This skill closes that gap by notarizing + stapling the dmg manually after Tauri finishes.

It also handles two recurring build failures you'll otherwise burn time on:

1. **`hdiutil: convert failed - File exists`** — `bundle_dmg.sh` does not delete `Houston_*.dmg` or `rw.*.dmg` leftovers before compressing. Stale artifacts from a prior build break the next one.
2. **zsh `no matches found` on empty globs** — if cleanup runs with nothing to delete, zsh's `nomatch` option errors. Use glob-safe cleanup.

## Required Environment Variables

This skill reads signing + notarization credentials from the shell environment. **Never hardcode them into the skill or commit them.** The following must be set (typically in `~/.zshrc` or `~/.zprofile`):

| Variable | Purpose |
|---|---|
| `APPLE_SIGNING_IDENTITY` | The full Developer ID string, e.g. `Developer ID Application: Your Name (TEAMID)`. Tauri reads this automatically during `pnpm tauri build`. |
| `APPLE_API_KEY` | App Store Connect API key ID (10-char alphanumeric). |
| `APPLE_API_KEY_PATH` | Absolute path to the `AuthKey_<id>.p8` file. This is the secret — never share or commit it. |
| `APPLE_API_ISSUER` | App Store Connect issuer UUID. |

Tauri uses these during `pnpm tauri build` to sign + notarize the `.app`. This skill reuses the same env vars in Step 5 to notarize the `.dmg` wrapper that Tauri skips.

## Procedure

Follow in order. Do not skip steps.

### Step 1 — Preflight: check env vars and processes

Verify the required env vars are set. Abort with a clear error if any are missing — do NOT prompt for values or hardcode fallbacks.

```bash
for v in APPLE_SIGNING_IDENTITY APPLE_API_KEY APPLE_API_KEY_PATH APPLE_API_ISSUER; do
  if [ -z "${(P)v}" ]; then echo "MISSING: $v"; fi
done
[ -f "$APPLE_API_KEY_PATH" ] || echo "MISSING FILE: $APPLE_API_KEY_PATH"
```

If anything prints `MISSING`, stop and tell the user which var/file is missing and where they should set it.

Then check for stuck processes:

```bash
ps aux | grep -iE "tauri build|notarytool|cargo" | grep -v grep
```

- If there's an old `tauri build` from hours ago, it's probably stuck inside `notarytool submit --wait` waiting on Apple. It does NOT block a new build's compile/sign/staple — only a concurrent `notarytool submit` with the same API key would conflict. Ask the user before killing anything long-running.
- If `tauri dev` is running, that's fine — separate `target/debug` dir.

### Step 2 — Clean stale dmg artifacts (glob-safe)

```bash
find /Users/ja/dev/houston/target/release/bundle/macos -maxdepth 1 \
  \( -name "Houston_*.dmg" -o -name "rw.*.dmg" \) -delete 2>/dev/null || true
```

Do NOT use `rm target/release/bundle/macos/Houston_*.dmg` — zsh's `nomatch` will error when the glob is empty and abort the whole chain.

### Step 3 — Run `pnpm tauri build` (background)

```bash
cd /Users/ja/dev/houston/app && pnpm tauri build
```

Run **in the background** via `run_in_background: true` and wait for the task notification. Do NOT poll or sleep. The build does:

1. Compile Rust (release profile) + frontend (vite)
2. Bundle `Houston.app`
3. Sign with `$APPLE_SIGNING_IDENTITY`
4. Notarize the **app** via `$APPLE_API_KEY` / `$APPLE_API_KEY_PATH` / `$APPLE_API_ISSUER` (takes 30s–several minutes depending on Apple's queue)
5. Staple the app
6. Bundle + sign the dmg

**Expected result on success:** exit 0, both bundles present:
- `/Users/ja/dev/houston/target/release/bundle/macos/Houston.app`
- `/Users/ja/dev/houston/target/release/bundle/dmg/Houston_0.2.0_aarch64.dmg`

If the build fails at the dmg step with `hdiutil: convert failed - File exists`, you skipped Step 2. Clean up and retry.

### Step 4 — Confirm the dmg is NOT yet notarized

```bash
spctl -a -t open --context context:primary-signature -vv \
  /Users/ja/dev/houston/target/release/bundle/dmg/Houston_0.2.0_aarch64.dmg
```

Expected: `rejected / source=Unnotarized Developer ID`. If it's already `accepted / source=Notarized Developer ID`, Tauri has been upgraded — skip to Step 7.

### Step 5 — Notarize the dmg (background)

Use the same App Store Connect API key Tauri uses — pulled from env vars verified in Step 1:

```bash
xcrun notarytool submit \
  /Users/ja/dev/houston/target/release/bundle/dmg/Houston_0.2.0_aarch64.dmg \
  --key-id "$APPLE_API_KEY" \
  --key "$APPLE_API_KEY_PATH" \
  --issuer "$APPLE_API_ISSUER" \
  --wait
```

Run **in the background**. Wait for the task notification. Expected final line: `status: Accepted`.

If `status: Invalid`, fetch the log with `xcrun notarytool log <submission-id> ...` and surface it to the user.

### Step 6 — Staple

```bash
xcrun stapler staple \
  /Users/ja/dev/houston/target/release/bundle/dmg/Houston_0.2.0_aarch64.dmg
```

Expected: `The staple and validate action worked!`

### Step 7 — Final verification

```bash
spctl -a -t open --context context:primary-signature -vv \
  /Users/ja/dev/houston/target/release/bundle/dmg/Houston_0.2.0_aarch64.dmg
```

Must output:
```
accepted
source=Notarized Developer ID
origin=<should match $APPLE_SIGNING_IDENTITY>
```

If it does not, STOP and report to the user — do not copy a broken dmg to Desktop.

### Step 8 — Copy to Desktop with a clean name

```bash
rm -f ~/Desktop/Houston-0.2.0.dmg ~/Desktop/Houston-0.2.0.zip ~/Desktop/Houston-0.2.0-dev.zip
cp /Users/ja/dev/houston/target/release/bundle/dmg/Houston_0.2.0_aarch64.dmg \
  ~/Desktop/Houston-0.2.0.dmg
```

Also remove any older `Houston-*.zip` on Desktop so the user cannot accidentally share stale builds.

### Step 9 — Report

Tell the user exactly this shape:

> **`~/Desktop/Houston-0.2.0.dmg` is ready. ~12 MB, fully signed + notarized + stapled. Drag it into Slack — your recipient double-clicks, drags Houston.app to Applications, launches. Zero warnings, zero commands.**

## Gotchas & Knowledge

### `.VolumeIcon.icns` showing as a visible file
If the user sees `.VolumeIcon.icns` inside the mounted dmg, this is almost always a **local Finder setting** (`Cmd+Shift+.` toggles hidden files). It is NOT a packaging bug — the file is a dotfile and hidden by default for everyone else. Verify by mounting and `ls -la /Volumes/Houston/` — you'll see it prefixed with `.`.

### `tauri.conf.json` warning about `com.houston.app`
Tauri warns the bundle identifier `com.houston.app` ends with `.app`, conflicting with the app bundle extension. This is a non-fatal warning — ignore it for builds, but flag for a future cleanup (rename to `com.houston.desktop` or similar).

### DMG is tiny (6 MB or similar)
If `Houston_0.2.0_aarch64.dmg` is suspiciously small (Houston.app alone is ~29 MB), it is a stale / broken artifact from a much older run. Delete it in Step 2 and rebuild.

### Interrupted builds leave `rw.*.dmg` temp files
If the user Ctrl-C's or the DMG step is killed, `rw.<pid>.Houston_*.dmg` files get orphaned in `target/release/bundle/macos/`. Always run Step 2 before the build regardless.

### Where the signing credentials come from
All credentials live in environment variables (see **Required Environment Variables** at the top of this skill). They are typically exported in `~/.zshrc` or `~/.zprofile`. The `.p8` file referenced by `$APPLE_API_KEY_PATH` is the only true secret — never commit, share, or paste it. The key-id and issuer are identifiers that pair with the `.p8`; without the file they cannot be used. If any env var is missing when you run this skill, Step 1 will abort with a clear message telling the user which one to set.

## Why No `tauri.conf.json` Dmg-Notarization Flag?

As of this Tauri version, the bundler's macOS flow notarizes + staples the `.app` but not the dmg wrapper. There is no `bundle.macOS.dmg.notarize = true` config flag. When Tauri upstream adds one, delete Steps 4–6 from this skill and let `pnpm tauri build` do the whole thing. Until then, the manual post-step is required.
