#!/usr/bin/env bash
# sync-assets.sh — sync compass public/ from project-purupuru/purupuru-assets
#
# Reads pinned version from .assets-version, downloads the tagged tarball +
# sha256 manifest, verifies, backs up current state, atomically swaps in the
# new content. On any failure: rolls back to the backup snapshot.
#
# Authored: S0 T0.5 (test-tarball validation)
# Production use: S6 T6.3 (wired with real purupuru-assets release)
#
# Usage:
#   scripts/sync-assets.sh                              # use .assets-version pin
#   scripts/sync-assets.sh --version v1.0.0             # override version
#   scripts/sync-assets.sh --url file:///path/to.tar.gz # local tarball (S0 testing)
#   scripts/sync-assets.sh --dry-run                    # validate without applying
#
# Environment:
#   ASSETS_REPO   — defaults to project-purupuru/purupuru-assets
#   ASSETS_DIRS   — colon-separated list of public/ subdirs to sync.
#                   Defaults to: art:brand:fonts:data/materials

set -euo pipefail

ASSETS_REPO="${ASSETS_REPO:-project-purupuru/purupuru-assets}"
ASSETS_DIRS="${ASSETS_DIRS:-art:brand:fonts:data/materials}"
VERSION=""
URL_OVERRIDE=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version) VERSION="$2"; shift 2 ;;
    --url)     URL_OVERRIDE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$VERSION" ]] && [[ -z "$URL_OVERRIDE" ]]; then
  if [[ ! -f .assets-version ]]; then
    echo "ERROR: .assets-version pin file not found (and no --version / --url given)" >&2
    exit 1
  fi
  VERSION=$(head -1 .assets-version | tr -d '[:space:]')
fi

if [[ -n "$URL_OVERRIDE" ]]; then
  TARBALL_URL="$URL_OVERRIDE"
  SHA_URL="${URL_OVERRIDE}.sha256"
else
  TARBALL_URL="https://github.com/${ASSETS_REPO}/releases/download/${VERSION}/purupuru-assets-${VERSION}.tar.gz"
  SHA_URL="${TARBALL_URL}.sha256"
fi

echo "[sync-assets] repo:    ${ASSETS_REPO}"
echo "[sync-assets] version: ${VERSION:-<from URL>}"
echo "[sync-assets] tarball: ${TARBALL_URL}"
echo "[sync-assets] dirs:    ${ASSETS_DIRS//:/ · }"

WORKDIR=$(mktemp -d)
BACKUP_DIR=".assets-backup-$(date -u +%s)"

cleanup() {
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

fetch() {
  local url="$1" dest="$2"
  if [[ "$url" == file://* ]]; then
    local local_path="${url#file://}"
    cp "$local_path" "$dest"
  else
    curl -sfL -o "$dest" "$url" || {
      echo "ERROR: failed to fetch $url" >&2
      return 1
    }
  fi
}

TARBALL="$WORKDIR/assets.tar.gz"
SHA_FILE="$WORKDIR/assets.tar.gz.sha256"

echo "[sync-assets] step 1: downloading…"
fetch "$TARBALL_URL" "$TARBALL"
fetch "$SHA_URL" "$SHA_FILE"

echo "[sync-assets] step 2: verifying sha256…"
EXPECTED=$(awk '{print $1}' "$SHA_FILE")
ACTUAL=$(sha256sum "$TARBALL" | awk '{print $1}')
if [[ "$EXPECTED" != "$ACTUAL" ]]; then
  echo "ERROR: sha256 mismatch" >&2
  echo "  expected: $EXPECTED" >&2
  echo "  actual:   $ACTUAL" >&2
  echo "[sync-assets] aborted; public/ untouched" >&2
  exit 1
fi
echo "[sync-assets] sha256 OK ($EXPECTED)"

if $DRY_RUN; then
  echo "[sync-assets] --dry-run · skipping backup + extraction"
  exit 0
fi

echo "[sync-assets] step 3: backing up current state to ${BACKUP_DIR}/…"
mkdir -p "$BACKUP_DIR"
IFS=':' read -r -a DIRS_ARRAY <<< "$ASSETS_DIRS"
for dir in "${DIRS_ARRAY[@]}"; do
  if [[ -d "public/$dir" ]]; then
    mkdir -p "$BACKUP_DIR/public/$(dirname "$dir")"
    cp -R "public/$dir" "$BACKUP_DIR/public/$dir"
  fi
done

echo "[sync-assets] step 4: extracting…"
STAGE="$WORKDIR/stage"
mkdir -p "$STAGE"
tar -xzf "$TARBALL" -C "$STAGE" || {
  echo "ERROR: tar extraction failed" >&2
  echo "[sync-assets] rolling back (no swap performed yet)" >&2
  rm -rf "$BACKUP_DIR"
  exit 1
}

echo "[sync-assets] step 5: atomic swap…"
ROLLBACK_NEEDED=false
for dir in "${DIRS_ARRAY[@]}"; do
  if [[ -d "$STAGE/public/$dir" ]]; then
    rm -rf "public/$dir"
    mkdir -p "$(dirname "public/$dir")"
    mv "$STAGE/public/$dir" "public/$dir" || {
      ROLLBACK_NEEDED=true
      break
    }
  fi
done

if $ROLLBACK_NEEDED; then
  echo "ERROR: mv failed mid-swap; restoring from backup" >&2
  for dir in "${DIRS_ARRAY[@]}"; do
    if [[ -d "$BACKUP_DIR/public/$dir" ]]; then
      rm -rf "public/$dir"
      mkdir -p "$(dirname "public/$dir")"
      cp -R "$BACKUP_DIR/public/$dir" "public/$dir"
    fi
  done
  echo "[sync-assets] rolled back · public/ matches pre-sync state" >&2
  exit 1
fi

echo "[sync-assets] step 6: cleanup backup (sync succeeded)…"
rm -rf "$BACKUP_DIR"

echo "[sync-assets] OK · synced public/ from ${ASSETS_REPO}@${VERSION:-<custom>}"
