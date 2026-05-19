#!/usr/bin/env bash
# fagan-sweep.sh — batch-review architectural files touched in current session
#
# Reads .run/fagan-checkpoint/session.jsonl (accumulated by
# fagan-checkpoint.sh's PostToolUse hook), dedupes touched paths, runs
# FAGAN over a synthesized diff (or files if no git index match), writes
# verdict to .run/fagan-checkpoint/last-verdict.json.
#
# Usage:
#   .claude/hooks/fagan-sweep.sh           — review unstaged + staged arch changes
#   .claude/hooks/fagan-sweep.sh --staged  — review only staged changes
#   .claude/hooks/fagan-sweep.sh --clear   — wipe session log (start fresh)
#
# Auth: subscription only (~/.codex/auth.json). NEVER OPENAI_API_KEY.

set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && cd .. && pwd)"
STATE_DIR="$REPO_ROOT/.run/fagan-checkpoint"
SESSION_LOG="$STATE_DIR/session.jsonl"
VERDICT_OUT="$STATE_DIR/last-verdict.json"
FAGAN_API="$REPO_ROOT/.claude/constructs/packs/fagan/scripts/codex-review-api.sh"

case "${1:-}" in
  --clear)
    rm -f "$SESSION_LOG" "$STATE_DIR/last-fire.epoch" "$VERDICT_OUT"
    echo "fagan-sweep: cleared session log"
    exit 0
    ;;
  --staged) MODE="staged" ;;
  *) MODE="all" ;;
esac

if [[ ! -f "$FAGAN_API" ]]; then
  echo "fagan-sweep: FAGAN pack not installed at $FAGAN_API" >&2
  exit 4
fi

if [[ ! -f "$SESSION_LOG" ]] || [[ ! -s "$SESSION_LOG" ]]; then
  echo "fagan-sweep: no architectural files logged this session"
  exit 0
fi

# Dedup the touched arch paths.
TOUCHED=$(jq -r '.file' "$SESSION_LOG" 2>/dev/null | sort -u)
if [[ -z "$TOUCHED" ]]; then
  echo "fagan-sweep: session log empty after dedup"
  exit 0
fi

COUNT=$(echo "$TOUCHED" | wc -l | tr -d ' ')
echo "fagan-sweep: $COUNT architectural file(s) in session"
echo "$TOUCHED" | sed 's/^/  /'

# Build a diff of those paths. Canonicalize REPO_ROOT + each file via
# realpath so a symlinked working dir (e.g. ~/bonfire/compass →
# ~/Documents/GitHub/compass) doesn't break the prefix-strip.
mkdir -p "$STATE_DIR"
DIFF_PATH="$STATE_DIR/sweep-$(date +%s).diff"
REPO_REAL=$(cd "$REPO_ROOT" && pwd -P)
PATHSPEC=()
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ ! -e "$f" ]] && continue
  real=$(cd "$(dirname "$f")" 2>/dev/null && pwd -P)/$(basename "$f")
  rel="${real#$REPO_REAL/}"
  # Skip if file is outside the repo after canonicalization.
  [[ "$rel" == "$real" ]] && continue
  PATHSPEC+=("$rel")
done <<< "$TOUCHED"

if [[ ${#PATHSPEC[@]} -eq 0 ]]; then
  echo "fagan-sweep: no in-repo files to diff"
  exit 0
fi

cd "$REPO_ROOT"
if [[ "$MODE" == "staged" ]]; then
  git diff --staged -- "${PATHSPEC[@]}" > "$DIFF_PATH"
else
  git diff HEAD -- "${PATHSPEC[@]}" > "$DIFF_PATH"
fi

if [[ ! -s "$DIFF_PATH" ]]; then
  echo "fagan-sweep: no diff content (files match HEAD) — reviewing files directly"
  bash "$FAGAN_API" review-files --output "$VERDICT_OUT" "${PATHSPEC[@]}" || true
else
  echo "fagan-sweep: reviewing $DIFF_PATH"
  bash "$FAGAN_API" review-diff "$DIFF_PATH" --output "$VERDICT_OUT" || true
fi

echo "---"
echo "verdict written to: $VERDICT_OUT"
if [[ -f "$VERDICT_OUT" ]]; then
  jq '{verdict, summary, findings_count: (.findings | length)}' "$VERDICT_OUT" 2>/dev/null
  # If APPROVED, clear the session log so the pre-commit gate sees a clean
  # slate. CHANGES_REQUIRED keeps the log so the operator must address +
  # re-sweep before the gate stops blocking.
  verdict_str=$(jq -r '.verdict // empty' "$VERDICT_OUT" 2>/dev/null)
  if [[ "$verdict_str" == "APPROVED" ]]; then
    : > "$SESSION_LOG"
    echo "✓ session log cleared (APPROVED verdict supersedes prior arch touches)"
  fi
fi
