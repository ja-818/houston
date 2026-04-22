---
name: build-app-local
description: Build Houston App locally (macOS). Clean stale artifacts, pnpm tauri build, notarize DMG manually (Tauri skips), staple, verify, copy to ~/Desktop/Houston-{version}.dmg. Fallback when CI broken.
---

# /build-app-local

Manual macOS build. CI broken? Use this. Normal path = `/release`.

## Pre-reqs

Env vars set in shell:
- `APPLE_SIGNING_IDENTITY` — Developer ID string
- `APPLE_API_KEY` — App Store Connect key ID
- `APPLE_API_KEY_PATH` — path to `.p8`
- `APPLE_API_ISSUER` — issuer UUID
- `TAURI_SIGNING_PRIVATE_KEY` + `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- `APTABASE_APP_KEY` · `SENTRY_DSN`

## Flow

```bash
# 1. Clean stale
cd app
rm -rf src-tauri/target/release/bundle
rm -rf dist

# 2. Build + auto-sign
pnpm tauri build
```

Tauri signs `.app`. Does NOT notarize DMG. Must do manually:

```bash
# 3. Submit DMG to Apple for notarization
DMG="src-tauri/target/release/bundle/dmg/Houston_${VERSION}_aarch64.dmg"
xcrun notarytool submit "$DMG" \
  --key "$APPLE_API_KEY_PATH" \
  --key-id "$APPLE_API_KEY" \
  --issuer "$APPLE_API_ISSUER" \
  --wait

# 4. Staple ticket to DMG
xcrun stapler staple "$DMG"

# 5. Verify
xcrun stapler validate "$DMG"
spctl -a -vvv -t install "$DMG"
```

## Output

```bash
cp "$DMG" ~/Desktop/Houston-${VERSION}.dmg
```

## Verify install

1. Open DMG on clean Mac
2. Drag to Applications
3. Launch — no Gatekeeper warning
4. Check "About Houston" version matches

## Common issues

- **"App is damaged"** — stapling failed. Re-staple.
- **Notarization rejected** — `xcrun notarytool log <submission-id> --key ...` to see reason.
- **Code sign identity not found** — check `security find-identity -v -p codesigning`. Must match `$APPLE_SIGNING_IDENTITY` exactly.
- **Slow notarization** — Apple servers variable. 2-15 min typical.

## When to use vs /release

| Situation | Skill |
|-----------|-------|
| Normal release | `/release` |
| CI broken, need ship now | `/build-app-local` |
| Testing build locally, not releasing | `/build-app-local`, skip step 6 |
| Auto-updater broken, users stuck on old version | `/build-app-local` + manual distribution |
