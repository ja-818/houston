---
name: release
description: Ship new Houston version. Bump semver across all packages, tag, push, let CI build + sign + notarize, publish draft. Defaults patch bump. Minor needs explicit user permission.
---

# /release

Version. Bump. Tag. Push. Done.

## Versioning

All packages share ONE version. Every release bumps ALL.

- Semver `0.x.y`
- **Default: patch bump** (`0.3.0` → `0.3.1`). Do this always unless told otherwise.
- **Minor bump (`0.3.x` → `0.4.0`) needs explicit user permission.** Never bump minor on own. Suggest: "This might warrant 0.4.0 — want minor?" Wait for approval.
- No rush to 1.0. FastAPI was 0.x for years in prod. Same energy.

## Standard flow (CI/CD)

```bash
./scripts/version.sh 0.3.X          # bump all package.json + Cargo.toml

# REQUIRED for any user-visible release: write the notes file BEFORE
# tagging. CI reads `.github/release-notes/<version>.md` verbatim and
# uses it as the GitHub release body. Skip only for trivial hotfixes
# (CI then auto-generates from conventional-commit subjects, which is
# weak signal for end users). See `.github/release-notes/README.md`
# for what good notes look like + an example at `.../0.4.0.md`.
$EDITOR .github/release-notes/0.3.X.md

git add -A && git commit -m "release: v0.3.X"
git tag v0.3.X
git push origin main --tags
```

GH Actions (`.github/workflows/release.yml`) takes over:
1. Builds Tauri app on macOS
2. Signs w/ Apple Developer ID (`$APPLE_SIGNING_IDENTITY`)
3. Notarizes `.app` w/ Apple
4. Creates signed `.dmg`
5. Generates `latest.json` for auto-updater
6. Creates **draft** GH Release w/ all artifacts

Duration: ~10-15 min.

**After CI:** GH Releases → review draft → "Publish". Users see "Update available" in-app.

## Full checklist

1. **Verify:** `cargo check --workspace && cd app && pnpm tsc --noEmit`
2. **Commit all changes** to `main`
3. **Bump:** `./scripts/version.sh 0.3.X` (patch default)
4. **Write notes:** `.github/release-notes/0.3.X.md` — narrative, not a commit dump. Cover: what changed for the user, before-you-upgrade caveats (always include the macOS drag-install reminder), known limitations. Pattern from `.github/release-notes/0.4.0.md`. Skip only for trivial hotfixes.
5. **Commit bump + notes:** `git add -A && git commit -m "release: v0.3.X"`
6. **Tag + push:** `git tag v0.3.X && git push origin main --tags`
7. **Wait CI:** ~10-15 min. Check `github.com/ja-818/houston/actions`
8. **If CI fails:** `gh run view <id> --log-failed`, fix, commit. Re-tag = `git tag -d v0.3.X && git push origin :refs/tags/v0.3.X`, then re-tag + push.
9. **Publish:** GH Releases → draft → "Publish". (Notes already populated from step 4.)
10. **Verify rollout:** Installed apps show "Update available" w/in 30 min or next launch.

## Version bump only (no publish)
```bash
./scripts/version.sh 0.2.0
```

## Common CI failures

- **`bundle_dmg.sh` failed** — flaky CI runner. `gh run rerun <id>`.
- **Missing env var at compile time** — new `env!()` added. Add secret to GitHub AND workflow YAML.
- **Notarization failed** — Apple servers slow. Rerun fixes.
- **TS errors** — run `pnpm tsc --noEmit` locally BEFORE tagging.

## Env vars required

See `knowledge-base/production-infra.md` for full table. Short version: `APPLE_SIGNING_IDENTITY`, `APPLE_API_KEY`, `APPLE_API_KEY_PATH`, `APPLE_API_ISSUER`, `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, `POSTHOG_KEY`, `POSTHOG_HOST`, `SENTRY_DSN`. CI also `APPLE_CERTIFICATE` + `APPLE_CERTIFICATE_PASSWORD`.

Never hardcode. `option_env!()` in Rust, env vars in CI.

## CI broken?
Fallback to manual build → `/build-app-local`.
