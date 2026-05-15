#!/usr/bin/env bash
# Fixture smoke tests for the Honeycomb substrate guard.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "FAIL: scripts/check-honeycomb-discipline.selftest.sh must run inside a git repository"
  exit 2
}

tmp="$(mktemp -d "${TMPDIR:-/tmp}/honeycomb-selftest.XXXXXX")"
out="$(mktemp "${TMPDIR:-/tmp}/honeycomb-selftest.out.XXXXXX")"
cleanup() {
  rm -rf "$tmp" "$out"
}
trap cleanup EXIT

guard="$ROOT/scripts/check-honeycomb-discipline.sh"
honeycomb="$tmp/lib/honeycomb"
runtime="$tmp/lib/runtime/runtime.ts"

# Exercise the real default paths before using env-var fixture overrides.
bash "$guard" >/dev/null

reset_fixture() {
  rm -rf "$tmp/lib"
  mkdir -p "$honeycomb" "$(dirname "$runtime")"
  cat > "$honeycomb/foo.port.ts" <<'EOF'
export interface FooPort {}
EOF
  cat > "$honeycomb/foo.live.ts" <<'EOF'
export const FooLive = {};
EOF
  cat > "$honeycomb/foo.mock.ts" <<'EOF'
export const FooMock = {};
EOF
  cat > "$runtime" <<'EOF'
import { FooLive } from './foo.live';
export const RuntimeLive = FooLive;
EOF
}

run_guard() {
  HONEYCOMB_DIR="$honeycomb" HONEYCOMB_RUNTIME="$runtime" bash "$guard"
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
run_guard >/dev/null

reset_fixture
touch "$honeycomb/bad.tsx"
expect_failure "TSX in lib/honeycomb" "must not contain TSX"

reset_fixture
cat > "$honeycomb/foo.port.ts" <<'EOF'
import React from 'react';
export interface FooPort {}
EOF
expect_failure "UI import in lib/honeycomb" "must not import UI/framework"

reset_fixture
rm "$honeycomb/foo.live.ts"
expect_failure "missing live adapter" "missing live adapter"

reset_fixture
rm "$honeycomb/foo.mock.ts"
expect_failure "missing mock adapter" "missing mock adapter"

reset_fixture
cat > "$honeycomb/bar.live.ts" <<'EOF'
export const BarLive = {};
EOF
expect_failure "orphan live adapter" "missing port for adapter"

reset_fixture
cat > "$honeycomb/foo--bar.port.ts" <<'EOF'
export interface FooBarPort {}
EOF
expect_failure "non-kebab service filename" "service filename must be kebab-case"

reset_fixture
cat > "$honeycomb/foo.port.ts" <<'EOF'
import { PublicKey } from '@solana/web3.js';
export interface FooPort {
  key: PublicKey;
}
EOF
expect_failure "chain SDK import" "must stay chain/backend agnostic"

reset_fixture
cat > "$honeycomb/foo.port.ts" <<'EOF'
import { RuntimeLive } from '@/lib/runtime/runtime';
export interface FooPort {
  runtime: typeof RuntimeLive;
}
EOF
expect_failure "runtime import outside collection.seed.ts" "runtime imports are only allowed"

reset_fixture
cat > "$honeycomb/foo.port.ts" <<'EOF'
const moduleName = 'react';
export const loadUi = () => import(`${moduleName}`);
export interface FooPort {}
EOF
expect_failure "template-literal dynamic import" "non-static import or require calls"

reset_fixture
cat > "$honeycomb/foo.port.ts" <<'EOF'
const moduleName = 'react';
export const loadUi = () => require(moduleName);
export interface FooPort {}
EOF
expect_failure "dynamic require" "non-static import or require calls"

reset_fixture
cat > "$runtime" <<'EOF'
export const RuntimeLive = {};
EOF
expect_failure "missing runtime live reference" "FooLive is not referenced"

reset_fixture
rm "$runtime"
expect_failure "missing runtime file" "runtime file not found"

echo "OK: Honeycomb substrate discipline selftest passed"
