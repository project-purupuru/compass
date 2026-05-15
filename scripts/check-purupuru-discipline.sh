#!/usr/bin/env bash
# Purupuru substrate discipline.
#
# Protects the cycle-1 runtime/content substrate without freezing the
# /battle-v2 visual layer. Components can iterate; contracts stay typed.

set -euo pipefail

PURUPURU_DIR="lib/purupuru"

if [ ! -d "$PURUPURU_DIR" ]; then
  echo "OK: $PURUPURU_DIR does not exist yet"
  exit 0
fi

fail=0

require_path() {
  local path="$1"
  if [ ! -e "$path" ]; then
    echo "FAIL: missing Purupuru substrate path: $path"
    fail=1
  fi
}

UI_IMPORTS=$(grep -RInE "from ['\"](react|next|motion|@/app|\\.\\./\\.\\./app)" "$PURUPURU_DIR" --include="*.ts" 2>/dev/null || true)
if [ -n "$UI_IMPORTS" ]; then
  echo "FAIL: lib/purupuru must not import UI/framework modules"
  echo "$UI_IMPORTS"
  fail=1
fi

RUNTIME_IMPORTS=$(grep -RInE "from ['\"]@/lib/runtime/" "$PURUPURU_DIR" --include="*.ts" 2>/dev/null || true)
if [ -n "$RUNTIME_IMPORTS" ]; then
  echo "FAIL: lib/purupuru must not import the app Effect runtime"
  echo "$RUNTIME_IMPORTS"
  fail=1
fi

CHAIN_IMPORTS=$(grep -RInE "from ['\"](@solana|@metaplex-foundation|@vercel/kv)" "$PURUPURU_DIR" --include="*.ts" 2>/dev/null || true)
if [ -n "$CHAIN_IMPORTS" ]; then
  echo "FAIL: lib/purupuru must stay chain/backend agnostic"
  echo "$CHAIN_IMPORTS"
  fail=1
fi

for required in \
  "$PURUPURU_DIR/contracts" \
  "$PURUPURU_DIR/schemas" \
  "$PURUPURU_DIR/content" \
  "$PURUPURU_DIR/runtime" \
  "$PURUPURU_DIR/presentation" \
  "$PURUPURU_DIR/__tests__" \
  "$PURUPURU_DIR/contracts/types.ts" \
  "$PURUPURU_DIR/contracts/validation_rules.md" \
  "$PURUPURU_DIR/runtime/command-queue.ts" \
  "$PURUPURU_DIR/runtime/resolver.ts" \
  "$PURUPURU_DIR/runtime/game-state.ts" \
  "$PURUPURU_DIR/runtime/event-bus.ts" \
  "$PURUPURU_DIR/runtime/ui-state-machine.ts" \
  "$PURUPURU_DIR/runtime/card-state-machine.ts" \
  "$PURUPURU_DIR/runtime/zone-state-machine.ts" \
  "$PURUPURU_DIR/presentation/sequencer.ts" \
  "$PURUPURU_DIR/content/loader.ts" \
  "$PURUPURU_DIR/schemas/PROVENANCE.md" \
  "$PURUPURU_DIR/index.ts"
do
  require_path "$required"
done

SCHEMA_COUNT=$(find "$PURUPURU_DIR/schemas" -maxdepth 1 -type f -name "*.schema.json" 2>/dev/null | wc -l | tr -d ' ')
if [ "${SCHEMA_COUNT:-0}" -lt "8" ]; then
  echo "FAIL: expected at least 8 Purupuru JSON schemas, found ${SCHEMA_COUNT:-0}"
  fail=1
fi

WOOD_YAML_COUNT=$(find "$PURUPURU_DIR/content/wood" -maxdepth 1 -type f -name "*.yaml" 2>/dev/null | wc -l | tr -d ' ')
if [ "${WOOD_YAML_COUNT:-0}" -lt "8" ]; then
  echo "FAIL: expected at least 8 wood content YAML examples, found ${WOOD_YAML_COUNT:-0}"
  fail=1
fi

TEST_COUNT=$(find "$PURUPURU_DIR/__tests__" -maxdepth 1 -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
if [ "${TEST_COUNT:-0}" -lt "8" ]; then
  echo "FAIL: expected broad Purupuru test coverage (>=8 test files), found ${TEST_COUNT:-0}"
  fail=1
fi

if ! grep -q "CardCommitted" "$PURUPURU_DIR/runtime/command-queue.ts"; then
  echo "FAIL: command-queue must own accepted PlayCard CardCommitted emission"
  fail=1
fi

if ! grep -q "NEVER touches DOM/audio/UI" "$PURUPURU_DIR/runtime/resolver.ts"; then
  echo "FAIL: resolver purity marker missing"
  fail=1
fi

if ! grep -q "mutatesGameState: false" "$PURUPURU_DIR/content/wood/sequence.wood_activation.yaml"; then
  echo "FAIL: wood presentation sequence must declare mutatesGameState: false"
  fail=1
fi

RUNTIME_SHAPE_LEAKS=$(grep -RInE "from ['\"]\\.\\./(presentation|content|schemas)/" "$PURUPURU_DIR/runtime" --include="*.ts" 2>/dev/null || true)
if [ -n "$RUNTIME_SHAPE_LEAKS" ]; then
  echo "FAIL: lib/purupuru/runtime must not import presentation/content/schemas"
  echo "$RUNTIME_SHAPE_LEAKS"
  fail=1
fi

CONTENT_SHAPE_LEAKS=$(grep -RInE "from ['\"]\\.\\./(runtime|presentation)/" "$PURUPURU_DIR/content" --include="*.ts" 2>/dev/null || true)
if [ -n "$CONTENT_SHAPE_LEAKS" ]; then
  echo "FAIL: lib/purupuru/content must not import runtime/presentation"
  echo "$CONTENT_SHAPE_LEAKS"
  fail=1
fi

PRESENTATION_RUNTIME_LEAKS=$(grep -RInE "from ['\"]\\.\\./runtime/(resolver|game-state|command-queue|card-state-machine|ui-state-machine|zone-state-machine|sky-eyes-motifs)" "$PURUPURU_DIR/presentation" --include="*.ts" 2>/dev/null || true)
if [ -n "$PRESENTATION_RUNTIME_LEAKS" ]; then
  echo "FAIL: lib/purupuru/presentation may read event-bus/input-lock types, but must not import runtime mutation/resolution modules"
  echo "$PRESENTATION_RUNTIME_LEAKS"
  fail=1
fi

PRESENTATION_MUTATION_LEAKS=$(grep -RInE "withZoneState|withActiveZone|withCardLocation|withResource|withFlag|withZoneEvent|createInitialState|resolverResolve" "$PURUPURU_DIR/presentation" --include="*.ts" 2>/dev/null || true)
if [ -n "$PRESENTATION_MUTATION_LEAKS" ]; then
  echo "FAIL: lib/purupuru/presentation must not mutate or resolve GameState"
  echo "$PRESENTATION_MUTATION_LEAKS"
  fail=1
fi

if [ "$fail" != "0" ]; then
  exit 1
fi

echo "OK: Purupuru substrate discipline honored"
