#!/usr/bin/env bash
# Honeycomb substrate discipline.
#
# Keeps lib/honeycomb agent-readable without freezing creative work in
# app/battle. The route may iterate freely; the substrate keeps typed seams.

set -euo pipefail

HONEYCOMB_DIR="lib/honeycomb"
RUNTIME="lib/runtime/runtime.ts"

if [ ! -d "$HONEYCOMB_DIR" ]; then
  echo "OK: $HONEYCOMB_DIR does not exist yet"
  exit 0
fi

fail=0

UI_IMPORTS=$(grep -RInE "from ['\"](react|next|motion|@/app|\\.\\./\\.\\./app)" "$HONEYCOMB_DIR" --include="*.ts" 2>/dev/null || true)
if [ -n "$UI_IMPORTS" ]; then
  echo "FAIL: lib/honeycomb must not import UI/framework modules"
  echo "$UI_IMPORTS"
  fail=1
fi

RUNTIME_IMPORTS=$(grep -RInE "from ['\"]@/lib/runtime/" "$HONEYCOMB_DIR" --include="*.ts" 2>/dev/null | grep -v "lib/honeycomb/collection.seed.ts" || true)
if [ -n "$RUNTIME_IMPORTS" ]; then
  echo "FAIL: lib/honeycomb runtime imports are only allowed in collection.seed.ts"
  echo "$RUNTIME_IMPORTS"
  fail=1
fi

CHAIN_IMPORTS=$(grep -RInE "from ['\"](@solana|@metaplex-foundation|@vercel/kv)" "$HONEYCOMB_DIR" --include="*.ts" 2>/dev/null || true)
if [ -n "$CHAIN_IMPORTS" ]; then
  echo "FAIL: lib/honeycomb must stay chain/backend agnostic"
  echo "$CHAIN_IMPORTS"
  fail=1
fi

for port in "$HONEYCOMB_DIR"/*.port.ts; do
  [ -f "$port" ] || continue
  base=$(basename "$port" .port.ts)
  if [ ! -f "$HONEYCOMB_DIR/$base.live.ts" ]; then
    echo "FAIL: missing live adapter for $port"
    fail=1
  fi
  if [ ! -f "$HONEYCOMB_DIR/$base.mock.ts" ]; then
    echo "FAIL: missing mock adapter for $port"
    fail=1
  fi
done

if [ -f "$RUNTIME" ]; then
  for live in "$HONEYCOMB_DIR"/*.live.ts; do
    [ -f "$live" ] || continue
    base=$(basename "$live" .live.ts)
    pascal=$(echo "$base" | awk -F- '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2);}1' OFS='')
    layer="${pascal}Live"
    if ! grep -qE "\\b${layer}\\b" "$RUNTIME"; then
      echo "FAIL: $layer is not referenced from $RUNTIME"
      fail=1
    fi
  done
fi

if [ "$fail" != "0" ]; then
  exit 1
fi

echo "OK: Honeycomb substrate discipline honored"
