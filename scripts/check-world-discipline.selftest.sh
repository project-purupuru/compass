#!/usr/bin/env bash
# Fixture smoke tests for the world substrate discipline guard.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "FAIL: scripts/check-world-discipline.selftest.sh must run inside a git repository"
  exit 2
}

tmp="$(mktemp -d "${TMPDIR:-/tmp}/world-discipline.XXXXXX")"
out="$(mktemp "${TMPDIR:-/tmp}/world-discipline.out.XXXXXX")"
cleanup() {
  rm -rf "$tmp" "$out"
}
trap cleanup EXIT

guard="$ROOT/scripts/check-world-discipline.sh"
fixture="$tmp/repo"

reset_fixture() {
  rm -rf "$fixture"
  mkdir -p "$fixture/lib/world" "$fixture/lib/honeycomb"
  cat > "$fixture/lib/world/awareness.live.ts" <<'EOF'
export const AwarenessLive = {};
EOF
}

run_guard() {
  WORLD_DISCIPLINE_ROOT="$fixture" bash "$guard"
}

expect_failure() {
  local label="$1"
  local expected="$2"
  if run_guard >"$out" 2>&1; then
    echo "FAIL: guard accepted $label"
    exit 1
  fi
  if ! grep -q "$expected" "$out"; then
    echo "FAIL: guard rejected $label without expected message: $expected"
    cat "$out"
    exit 1
  fi
}

reset_fixture
cat > "$fixture/lib/honeycomb/cards.ts" <<'EOF'
export const cards = [];
EOF
run_guard >/dev/null

reset_fixture
cat > "$fixture/lib/world/world-card.ts" <<'EOF'
export const leakedCard = {};
EOF
expect_failure "card file inside lib/world" "world substrate must not absorb Honeycomb"

reset_fixture
cat > "$fixture/lib/world/awareness.live.ts" <<'EOF'
import { PublicKey } from '@solana/web3.js';
export const AwarenessLive = PublicKey;
EOF
expect_failure "solana import inside lib/world" "D4 forbids"

reset_fixture
cat > "$fixture/lib/world/awareness.live.ts" <<'EOF'
export const save = () => kv.put('x', 'y');
EOF
expect_failure "KV write inside lib/world" "D4 in-memory only"

reset_fixture
mkdir -p "$fixture/lib/adapters"
expect_failure "lib/adapters folder" "D5 forbids"

echo "OK: world substrate discipline selftest passed"
