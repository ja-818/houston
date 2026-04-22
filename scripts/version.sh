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

# Rust crates
for toml in engine/*/Cargo.toml app/houston-tauri/Cargo.toml app/src-tauri/Cargo.toml; do
  sed -i '' "s/^version = \".*\"/version = \"$VERSION\"/" "$toml"
done

# Root Cargo.toml workspace dependencies
sed -i '' "s/version = \"[0-9]*\.[0-9]*\.[0-9]*\"/version = \"$VERSION\"/g" Cargo.toml

echo "All packages bumped to v$VERSION"
