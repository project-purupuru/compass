#!/usr/bin/env bash
# S4-T9 / D4 in-memory enforcement · NO solana imports + NO KV writes in lib/world/
#
# Historical note: this script used to enforce "no card/battle/deck files
# anywhere in lib/". Honeycomb is now an accepted local substrate under
# lib/honeycomb/, so this gate is scoped to lib/world/ only.

set -uo pipefail

WORLD_DIR="lib/world"

if [ ! -d "$WORLD_DIR" ]; then
  echo "OK: $WORLD_DIR doesn't exist yet (S4 not started)"
  exit 0
fi

# D4 · NO solana imports
SOLANA=$(grep -rl -E "from ['\"]@solana" "$WORLD_DIR" 2>/dev/null | wc -l | tr -d ' ')
if [ "${SOLANA:-0}" != "0" ]; then
  echo "FAIL: $SOLANA files with solana imports in $WORLD_DIR (D4 forbids · use lib/live/solana.live.ts)"
  grep -rln -E "from ['\"]@solana" "$WORLD_DIR" 2>/dev/null
  exit 1
fi

# D4 · NO KV writes
KV=$(grep -rl -E "kvSet|kv\.put" "$WORLD_DIR" 2>/dev/null | wc -l | tr -d ' ')
if [ "${KV:-0}" != "0" ]; then
  echo "FAIL: $KV files with KV writes in $WORLD_DIR (D4 in-memory only this cycle)"
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
