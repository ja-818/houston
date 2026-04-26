#!/usr/bin/env bash
# ============================================================================
# Fetch CLI dependencies pinned in `cli-deps.json` and stage them under
# `app/src-tauri/resources/bin/` so Tauri's `bundle.resources` glob picks
# them up at .app build time.
#
# Output layout (production, universal .app):
#
#   app/src-tauri/resources/bin/
#     codex                          # universal Mach-O (arm64 + x86_64)
#     composio-aarch64/              # Apple Silicon Bun bundle
#       composio
#       services/
#       *.mjs
#     composio-x86_64/               # Intel Bun bundle
#       composio
#       services/
#       *.mjs
#     cli-deps.json                  # pinned URLs + checksums for runtime
#                                    # downloads (claude-code) — read by the
#                                    # houston-claude-installer crate.
#
# Why this layout:
#   - codex is a Rust binary — `lipo` produces one fat universal binary so we
#     ship a single file regardless of host arch.
#   - composio is a Bun-bundled JavaScript runtime — CANNOT be lipo'd; the
#     binary contains an arch-specific Bun runtime + sibling .mjs/services
#     files. Both arches must be shipped side-by-side under a per-arch dir.
#   - cli-deps.json travels with the app so the runtime claude-code
#     installer can read pinned URL+SHA256 without needing network access
#     to a separate manifest endpoint.
#
# Modes:
#   ./scripts/fetch-cli-deps.sh                # both arches (production)
#   ./scripts/fetch-cli-deps.sh arm64          # arm64 only (dev convenience)
#   ./scripts/fetch-cli-deps.sh x64            # x64 only
#   ./scripts/fetch-cli-deps.sh host           # auto-detect host arch
#
# CI ALWAYS uses no-arg form (both arches). Local dev can use `host` to
# skip downloading the cross-arch slice they don't need.
#
# Strict mode: any download or checksum failure is fatal (set -euo pipefail).
# Partial bundles are unacceptable — we'd ship a broken .app to half the
# user base.
# ============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPS_FILE="$REPO_ROOT/cli-deps.json"
OUT_DIR="$REPO_ROOT/app/src-tauri/resources/bin"

if [ ! -f "$DEPS_FILE" ]; then
  echo "ERROR: cli-deps.json not found at $DEPS_FILE" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required but not installed (brew install jq)" >&2
  exit 1
fi

detect_host_arch() {
  case "$(uname -m)" in
    arm64|aarch64) echo "arm64" ;;
    x86_64|amd64)  echo "x64" ;;
    *) echo "ERROR: unsupported host arch $(uname -m)" >&2; exit 1 ;;
  esac
}

MODE="${1:-both}"
case "$MODE" in
  both)            ARCHES=("arm64" "x64") ;;
  arm64)           ARCHES=("arm64") ;;
  x64)             ARCHES=("x64") ;;
  host)            ARCHES=("$(detect_host_arch)") ;;
  *) echo "ERROR: unknown mode '$MODE' (expected: both|arm64|x64|host)" >&2; exit 1 ;;
esac

mkdir -p "$OUT_DIR"

# --- Helpers ----------------------------------------------------------------

# Download with fail-fast + retry. Avoids a half-written file leaking past a
# transient network error (curl with --output writes incrementally).
download() {
  local url="$1" dest="$2"
  local attempts=3 i=1
  while [ "$i" -le "$attempts" ]; do
    if curl -fsSL --retry 3 --retry-delay 2 -o "$dest" "$url"; then
      return 0
    fi
    echo "  download attempt $i/$attempts failed; retrying…" >&2
    i=$((i + 1))
  done
  return 1
}

# Verify SHA-256 checksum. Empty `expected` prints the actual so the user
# can pin it (used when bumping a CLI version with `bump-cli.sh`).
verify_or_print_checksum() {
  local file="$1" expected="$2" label="$3"
  local actual
  actual=$(shasum -a 256 "$file" | cut -d' ' -f1)
  if [ -n "$expected" ]; then
    if [ "$actual" != "$expected" ]; then
      echo "ERROR: checksum mismatch for $label" >&2
      echo "  expected: $expected" >&2
      echo "  actual:   $actual" >&2
      return 1
    fi
    echo "  $label checksum: OK"
  else
    echo "  $label checksum (pin this in cli-deps.json): $actual"
  fi
  return 0
}

# Find the main binary inside an extracted archive. Some archives put the
# binary at the root, others under a versioned subdirectory.
find_binary() {
  local extract_dir="$1" binary_name="$2"
  find "$extract_dir" -type f \( -name "$binary_name" -o -name "$binary_name-*" \) \
    | head -1
}

# Stage a fetched single binary (codex) into a per-arch staging slot.
# We don't write directly to the final path — codex needs to wait for
# both arches before lipo'ing.
stage_codex_arch() {
  local arch="$1"
  local platform="darwin-$arch"
  local version url_template expected url tmp extract_dir bin_path
  version=$(jq -r '.codex.version' "$DEPS_FILE")
  url_template=$(jq -r ".codex.urls[\"$platform\"] // empty" "$DEPS_FILE")
  expected=$(jq -r ".codex.checksums[\"$platform\"] // empty" "$DEPS_FILE")

  if [ -z "$url_template" ]; then
    echo "ERROR: cli-deps.json missing codex URL for $platform" >&2
    exit 1
  fi

  url="${url_template//\{version\}/$version}"
  echo "FETCH codex v$version ($platform)"
  echo "  URL: $url"

  tmp=$(mktemp)
  download "$url" "$tmp" || { echo "ERROR: codex download failed for $platform" >&2; rm -f "$tmp"; exit 1; }
  verify_or_print_checksum "$tmp" "$expected" "codex/$platform" || { rm -f "$tmp"; exit 1; }

  extract_dir=$(mktemp -d)
  case "$url" in
    *.tar.gz|*.tgz) tar xzf "$tmp" -C "$extract_dir" ;;
    *.zip)          unzip -q "$tmp" -d "$extract_dir" ;;
    *)              cp "$tmp" "$extract_dir/codex" ;;
  esac
  rm -f "$tmp"

  bin_path=$(find_binary "$extract_dir" "codex")
  if [ -z "$bin_path" ]; then
    echo "ERROR: codex binary not found in archive for $platform" >&2
    find "$extract_dir" -type f | head -20 >&2
    rm -rf "$extract_dir"
    exit 1
  fi

  local stage_dir="$OUT_DIR/.staging/codex"
  mkdir -p "$stage_dir"
  cp "$bin_path" "$stage_dir/codex-$arch"
  chmod +x "$stage_dir/codex-$arch"
  rm -rf "$extract_dir"

  # Verify the binary has the expected slice — protects against a
  # mislabelled URL (Apple silicon binary served from x64 URL, etc.).
  local lipo_info
  lipo_info=$(lipo -info "$stage_dir/codex-$arch" 2>&1 || echo "")
  case "$arch" in
    arm64)
      echo "$lipo_info" | grep -q 'arm64' \
        || { echo "ERROR: codex-$arch is not an arm64 binary: $lipo_info" >&2; exit 1; } ;;
    x64)
      echo "$lipo_info" | grep -q 'x86_64' \
        || { echo "ERROR: codex-$arch is not an x86_64 binary: $lipo_info" >&2; exit 1; } ;;
  esac

  echo "  Staged: $stage_dir/codex-$arch"
}

# Lipo staged per-arch codex slices into one universal binary. Only run
# after BOTH arches are staged (i.e. when MODE=both).
lipo_codex_universal() {
  local stage_dir="$OUT_DIR/.staging/codex"
  if [ ! -f "$stage_dir/codex-arm64" ] || [ ! -f "$stage_dir/codex-x64" ]; then
    echo "ERROR: cannot lipo codex — both arches not staged" >&2
    ls -la "$stage_dir" >&2 || true
    exit 1
  fi
  echo "LIPO codex universal (arm64 + x86_64)"
  lipo -create \
    "$stage_dir/codex-arm64" \
    "$stage_dir/codex-x64" \
    -output "$OUT_DIR/codex"
  chmod +x "$OUT_DIR/codex"
  rm -rf "$stage_dir"
  local lipo_info
  lipo_info=$(lipo -info "$OUT_DIR/codex" 2>&1)
  echo "  $lipo_info"
  echo "  Installed: $OUT_DIR/codex ($(du -sh "$OUT_DIR/codex" | cut -f1))"
}

# Stage codex single-arch (arm64-only or x64-only dev build) — copies the
# slice directly to the final location instead of lipo'ing. Useful for
# `pnpm tauri dev` where the developer only needs their host arch.
finalize_codex_single_arch() {
  local arch="$1"
  local stage_dir="$OUT_DIR/.staging/codex"
  if [ ! -f "$stage_dir/codex-$arch" ]; then
    echo "ERROR: codex-$arch not staged" >&2
    exit 1
  fi
  echo "FINALIZE codex (single arch: $arch — dev build, NOT shippable)"
  cp "$stage_dir/codex-$arch" "$OUT_DIR/codex"
  chmod +x "$OUT_DIR/codex"
  rm -rf "$stage_dir"
  echo "  Installed: $OUT_DIR/codex (single $arch)"
}

# Fetch + stage composio for one arch. Composio is a multi-file Bun bundle
# (binary + services/ + *.mjs) — we ship the whole directory per arch.
fetch_composio_arch() {
  local arch="$1"
  local platform="darwin-$arch"
  local version url_template expected url tmp extract_dir bin_path bin_dir dest_dir
  version=$(jq -r '.composio.version' "$DEPS_FILE")
  url_template=$(jq -r ".composio.urls[\"$platform\"] // empty" "$DEPS_FILE")
  expected=$(jq -r ".composio.checksums[\"$platform\"] // empty" "$DEPS_FILE")

  if [ -z "$url_template" ]; then
    echo "ERROR: cli-deps.json missing composio URL for $platform" >&2
    exit 1
  fi

  url="${url_template//\{version\}/$version}"
  echo "FETCH composio v$version ($platform)"
  echo "  URL: $url"

  tmp=$(mktemp)
  download "$url" "$tmp" || { echo "ERROR: composio download failed for $platform" >&2; rm -f "$tmp"; exit 1; }
  verify_or_print_checksum "$tmp" "$expected" "composio/$platform" || { rm -f "$tmp"; exit 1; }

  extract_dir=$(mktemp -d)
  case "$url" in
    *.tar.gz|*.tgz) tar xzf "$tmp" -C "$extract_dir" ;;
    *.zip)          unzip -q "$tmp" -d "$extract_dir" ;;
    *)              echo "ERROR: composio archive type unknown for $url" >&2; rm -f "$tmp"; rm -rf "$extract_dir"; exit 1 ;;
  esac
  rm -f "$tmp"

  bin_path=$(find_binary "$extract_dir" "composio")
  if [ -z "$bin_path" ]; then
    echo "ERROR: composio binary not found in archive for $platform" >&2
    find "$extract_dir" -type f | head -20 >&2
    rm -rf "$extract_dir"
    exit 1
  fi
  bin_dir=$(dirname "$bin_path")

  # Per-arch destination. Use Rust target-arch naming to match
  # `std::env::consts::ARCH` ("aarch64" / "x86_64") so the runtime resolver
  # in the engine doesn't need an arch-name translation table.
  local rust_arch
  case "$arch" in
    arm64) rust_arch="aarch64" ;;
    x64)   rust_arch="x86_64" ;;
  esac
  dest_dir="$OUT_DIR/composio-$rust_arch"
  rm -rf "$dest_dir"
  cp -R "$bin_dir" "$dest_dir"

  # Normalize binary name in case the archive had a versioned name
  # (e.g. composio-darwin-aarch64) that doesn't match what we spawn.
  local actual_name
  actual_name=$(basename "$bin_path")
  if [ "$actual_name" != "composio" ]; then
    mv "$dest_dir/$actual_name" "$dest_dir/composio"
  fi
  chmod +x "$dest_dir/composio"

  rm -rf "$extract_dir"

  # Prune cross-platform acp-adapter binaries that this per-arch composio
  # bundle can never execute. Composio's upstream zip ships every platform
  # — darwin-arm64, darwin-x64, linux-arm64, linux-x64 — under
  # `acp-adapters/codex/<platform>/codex-acp` (~90 MB each). cli.js
  # constructs the per-process path dynamically as `${platform}-${arch}`
  # (verified empirically), so a darwin-arm64 process only ever opens
  # `darwin-arm64/codex-acp` and the other 3 directories are 270 MB of
  # pure dead weight. We prune them here so the .app stays at honest
  # production size.
  #
  # We also prune linux altogether because Houston does not ship for
  # Linux. If/when a linux build target is added, `release.yml` will
  # call `fetch-cli-deps.sh` from a Linux runner separately and that
  # bundle will be staged into a `composio-<linux-arch>/` dir with the
  # linux acp-adapter retained.
  local keep_platform="darwin-$arch"
  local acp_codex_dir="$dest_dir/acp-adapters/codex"
  if [ -d "$acp_codex_dir" ]; then
    local before_size
    before_size=$(du -sh "$dest_dir" | cut -f1)
    for plat_dir in "$acp_codex_dir"/*; do
      [ -d "$plat_dir" ] || continue
      local plat_name
      plat_name=$(basename "$plat_dir")
      if [ "$plat_name" != "$keep_platform" ]; then
        rm -rf "$plat_dir"
      fi
    done
    local after_size
    after_size=$(du -sh "$dest_dir" | cut -f1)
    echo "  Pruned acp-adapters to $keep_platform only ($before_size -> $after_size)"
  fi

  echo "  Installed: $dest_dir/ ($(du -sh "$dest_dir" | cut -f1))"
}

# Stage cli-deps.json itself so the runtime claude-code installer can read
# pinned URLs + checksums at install time without a separate fetch.
stage_manifest() {
  cp "$DEPS_FILE" "$OUT_DIR/cli-deps.json"
  echo "  Staged: $OUT_DIR/cli-deps.json"
}

# --- Pre-flight: clean any stale artifacts so a re-run produces a known
#     layout. Removing the full bin dir is safe — every artifact in there
#     is reproducible from cli-deps.json. ---------------------------------
rm -rf "$OUT_DIR/.staging" "$OUT_DIR/codex" "$OUT_DIR/composio-"* "$OUT_DIR/cli-deps.json"

# --- Fetch each arch ------------------------------------------------------
for arch in "${ARCHES[@]}"; do
  stage_codex_arch "$arch"
  fetch_composio_arch "$arch"
done

# --- Combine codex slices (or finalize single-arch dev build) -----------
if [ "${#ARCHES[@]}" -eq 2 ]; then
  lipo_codex_universal
else
  finalize_codex_single_arch "${ARCHES[0]}"
fi

# --- Manifest -------------------------------------------------------------
echo "STAGE cli-deps.json (runtime claude-code install manifest)"
stage_manifest

# --- Summary --------------------------------------------------------------
echo ""
echo "Done. Bundled CLIs:"
du -sh "$OUT_DIR"/* 2>/dev/null | sort -k2 || echo "  (none)"

# Final sanity: every shippable artifact must exist.
missing=()
[ -x "$OUT_DIR/codex" ] || missing+=("codex")
if [ "${#ARCHES[@]}" -eq 2 ]; then
  [ -x "$OUT_DIR/composio-aarch64/composio" ] || missing+=("composio-aarch64/composio")
  [ -x "$OUT_DIR/composio-x86_64/composio" ]  || missing+=("composio-x86_64/composio")
fi
[ -f "$OUT_DIR/cli-deps.json" ] || missing+=("cli-deps.json")

if [ "${#missing[@]}" -gt 0 ]; then
  echo "ERROR: missing artifacts after fetch: ${missing[*]}" >&2
  exit 1
fi
