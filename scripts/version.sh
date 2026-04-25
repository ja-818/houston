#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:?Usage: ./scripts/version.sh <version>}"

echo "Bumping all packages to v$VERSION..."

# NPM packages
for pkg in core chat board layout workspace skills connections events routines review memory; do
  jq --arg v "$VERSION" '.version = $v' "ui/$pkg/package.json" > tmp.json && mv tmp.json "ui/$pkg/package.json"
done

# Root + app
for f in package.json app/package.json; do
  jq --arg v "$VERSION" '.version = $v' "$f" > tmp.json && mv tmp.json "$f"
done

# Rust crates — replace ONLY the first `^version = ...` line in each
# file. That's the `[package]` version. Without `1,` sed would also
# rewrite dependency `version = ...` lines declared in the `[dependencies.foo]`
# table form, bricking crates like:
#   [dependencies.thiserror]
#   version = "1"
# into the app version, causing cargo "failed to select version" errors.
for toml in engine/*/Cargo.toml app/houston-tauri/Cargo.toml app/src-tauri/Cargo.toml; do
  sed -i '' "1,/^version = \".*\"$/s//version = \"$VERSION\"/" "$toml"
done

# Root Cargo.toml workspace dependencies
sed -i '' "s/version = \"[0-9]*\.[0-9]*\.[0-9]*\"/version = \"$VERSION\"/g" Cargo.toml

echo "All packages bumped to v$VERSION"
