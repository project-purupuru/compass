#!/usr/bin/env bash
# Prebuild policy wrapper for the Honeycomb substrate guard.

set -euo pipefail

if [ "${SKIP_HONEYCOMB_GUARD:-0}" = "1" ]; then
  echo "  Honeycomb substrate guard skipped by SKIP_HONEYCOMB_GUARD=1"
  exit 0
fi

if [ "${HONEYCOMB_GUARD_MODE:-block}" = "warn" ]; then
  if ! pnpm check:honeycomb; then
    echo "WARNING: Honeycomb substrate guard failed with HONEYCOMB_GUARD_MODE=warn"
    echo "WARNING: build continues; restore blocking guard behavior in the follow-up PR"
  fi
  exit 0
fi

pnpm check:honeycomb
