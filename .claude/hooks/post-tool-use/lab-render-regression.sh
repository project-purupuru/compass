#!/usr/bin/env bash
# Lab evolution cycle · S1a regression substrate · PostToolUse:WARN hook
#
# Per ADR-10: this is NON-BLOCKING (WARN-only). The authoritative gate is the
# pre-commit hook at .husky/pre-commit. This hook gives fast feedback to
# Claude Code sessions when a Write/Edit/Bash mutation on a protected path
# might trigger a regression.
#
# stdin JSON (Claude Code PostToolUse): { tool, file_path?, command?, ... }
#
# Behavior:
#   - Resolve target paths from tool input
#   - If any match protected paths, run regression:check on canary
#   - On non-Match, emit stderr WARN + audit entry
#   - ALWAYS exit 0 (never block)
set -e

INPUT=$(cat)
TOOL=$(echo "$INPUT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('tool_name', ''))" 2>/dev/null || echo "")
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys, json; d=json.load(sys.stdin); print((d.get('tool_input') or {}).get('file_path', ''))" 2>/dev/null || echo "")

# Skip if not a path-touching tool
if [ -z "$FILE_PATH" ] && [ "$TOOL" != "Bash" ]; then
  exit 0
fi

PROTECTED_REGEX='^(app/battle-v2/_components/cards/|app/battle-v2/_components/vfx/effects/|app/battle-v2/_components/CardFace\.tsx|lib/cards/codex/)'

# Determine if anything touched a protected path
TOUCHED=""
if [ -n "$FILE_PATH" ]; then
  if echo "$FILE_PATH" | grep -qE "$PROTECTED_REGEX"; then
    TOUCHED="$FILE_PATH"
  fi
elif [ "$TOOL" = "Bash" ]; then
  TOUCHED=$(git diff --name-only 2>/dev/null | grep -E "$PROTECTED_REGEX" | head -3 || true)
fi

if [ -z "$TOUCHED" ]; then
  exit 0
fi

# Non-blocking signal — best-effort fast feedback
mkdir -p .run
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "[regression-substrate-warn] protected path touched: $TOUCHED" >&2
echo "  Tool: $TOOL · authoritative gate fires at git commit (.husky/pre-commit)" >&2

# Audit entry
echo "{\"ts\":\"$TS\",\"kind\":\"regression.warn\",\"tool\":\"$TOOL\",\"path\":\"$TOUCHED\"}" >> .run/audit.jsonl

exit 0
