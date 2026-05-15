#!/usr/bin/env bash
# S4-T9 / D4 in-memory enforcement · NO solana imports + NO KV writes in lib/world/
#
# Historical note: this script used to enforce "no card/battle/deck files
# anywhere in lib/". Honeycomb is now an accepted local substrate under
# lib/honeycomb/, so this gate is scoped to lib/world/ only.

set -euo pipefail

ROOT="${WORLD_DISCIPLINE_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null)}" || {
  echo "FAIL: scripts/check-world-discipline.sh must run inside a git repository"
  exit 2
}
cd "$ROOT"

WORLD_DIR="${WORLD_DISCIPLINE_WORLD_DIR:-lib/world}"

if [ ! -d "$WORLD_DIR" ]; then
  echo "OK: $WORLD_DIR doesn't exist yet (S4 not started)"
  exit 0
fi

# D4 · NO solana imports
SOLANA_FILES=$(grep -rl -E "from ['\"]@solana" "$WORLD_DIR" 2>/dev/null || true)
if [ -n "$SOLANA_FILES" ]; then
  SOLANA=$(printf '%s\n' "$SOLANA_FILES" | wc -l | tr -d ' ')
  echo "FAIL: $SOLANA files with solana imports in $WORLD_DIR (D4 forbids · use lib/live/solana.live.ts)"
  printf '%s\n' "$SOLANA_FILES"
  exit 1
fi

# D4 · NO KV writes
KV_FILES=$(grep -rl -E "kvSet|kv\.put" "$WORLD_DIR" 2>/dev/null || true)
if [ -n "$KV_FILES" ]; then
  KV=$(printf '%s\n' "$KV_FILES" | wc -l | tr -d ' ')
  echo "FAIL: $KV files with KV writes in $WORLD_DIR (D4 in-memory only this cycle)"
  printf '%s\n' "$KV_FILES"
  exit 1
fi

# Card-game-stays-out gate for the world substrate.
CARD_FILES=$(find "$WORLD_DIR" -type f \( -name '*card*' -o -name '*battle*' -o -name '*deck*' \) 2>/dev/null | wc -l | tr -d ' ')
if [ "${CARD_FILES:-0}" != "0" ]; then
  echo "FAIL: $CARD_FILES card/battle/deck files in $WORLD_DIR (world substrate must not absorb Honeycomb)"
  find "$WORLD_DIR" -type f \( -name '*card*' -o -name '*battle*' -o -name '*deck*' \)
  exit 1
fi

# D5 · NO new lib/adapters/ folder
if [ -d "lib/adapters" ]; then
  echo "FAIL: lib/adapters/ exists (D5 forbids · chain bindings live in lib/live/)"
  exit 1
fi

echo "OK: $WORLD_DIR honors D3 + D4 + D5 disciplines"
