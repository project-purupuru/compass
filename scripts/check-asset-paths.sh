#!/usr/bin/env bash
# check-asset-paths.sh — assert all `public/{art,brand,fonts,data/materials}/`
# references resolve to a path that exists OR is documented in the asset
# manifest schema. Per SDD §6.7 + sprint plan T1b.6.
#
# Failure modes:
#   - Source references a path under public/art/ that doesn't exist
#   - public/<asset-dir>/ files referenced via string literals (not <Image>) are checked
#
# Run: bash scripts/check-asset-paths.sh
# CI: registered in .github/workflows/lint.yml as `check-asset-paths` step

set -euo pipefail

# Asset directory roots
ASSET_DIRS=(
  "public/art"
  "public/brand"
  "public/fonts"
  "public/data/materials"
)

# Source roots to grep
SOURCE_ROOTS=(
  "app"
  "lib"
  "packages"
)

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$ROOT"

errors=0

# Find all string literals matching /public/...|/art/...|/brand/...|/fonts/... in source.
# Then check each one against actual filesystem.
matches=$(
  grep -rEho '"/(art|brand|fonts|data/materials)/[a-zA-Z0-9_/.\-]+"' "${SOURCE_ROOTS[@]}" 2>/dev/null \
    | sort -u \
    | tr -d '"' || true
)

if [[ -z "$matches" ]]; then
  echo "[check-asset-paths] no asset path references found in source · OK"
  exit 0
fi

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  fullpath="public${path}"
  if [[ ! -e "$fullpath" ]]; then
    echo "  MISSING: $fullpath (referenced in source)" >&2
    errors=$((errors + 1))
  fi
done <<< "$matches"

if [[ $errors -gt 0 ]]; then
  echo "" >&2
  echo "[check-asset-paths] FAIL · $errors missing asset reference(s)" >&2
  echo "Run 'pnpm sync-assets' OR commit the missing file(s) under public/" >&2
  exit 1
fi

echo "[check-asset-paths] all asset references resolve · OK"
