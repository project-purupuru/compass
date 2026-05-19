#!/usr/bin/env bash
# fagan-precommit-gate.sh — PreToolUse:Bash hook · blocks `git commit` when
# unreviewed architectural files exceed FAGAN_PRECOMMIT_THRESHOLD.
#
# Belt-and-suspenders complement to fagan-checkpoint.sh:
#   - checkpoint = soft, debounced, mid-session reminder
#   - precommit-gate = hard, only at commit seam, only when N+ arch files
#     are unreviewed
#
# An arch file is "unreviewed" if it appears in .run/fagan-checkpoint/
# session.jsonl AND there is no APPROVED verdict in last-verdict.json
# newer than the file's most recent entry.
#
# When the gate fires (blocks), it returns a structured reason — the agent
# can then either:
#   1. Run `bash .claude/hooks/fagan-sweep.sh --staged` (or unstaged) to
#      get a verdict
#   2. Override by setting FAGAN_PRECOMMIT_SKIP=1 for one-off mechanical
#      commits (e.g. version bumps, doc-only)
#
# Doctrine: grimoires/loa/doctrine/architectural-vs-creative-split.md

set -u

INPUT=$(cat)
command -v jq &>/dev/null || exit 0
echo "$INPUT" | jq empty 2>/dev/null || exit 0

# Only act on `git commit` invocations. Match the full command string so
# we don't fire on `git status` or other git operations.
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
[[ -z "$COMMAND" ]] && exit 0

# Match commit attempts. Be permissive about wrapping (heredoc-bodied
# messages, env-prefixed commands, etc.) — anything containing "git commit"
# triggers the check.
if ! echo "$COMMAND" | grep -qE '(^|[^A-Za-z_])git[[:space:]]+commit\b'; then
  exit 0
fi

# Explicit operator/agent escape hatch for one-off mechanical commits.
if [[ "${FAGAN_PRECOMMIT_SKIP:-0}" == "1" ]]; then
  exit 0
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FAGAN_PACK="$REPO_ROOT/.claude/constructs/packs/fagan"

# If FAGAN isn't installed, can't enforce. Exit silent.
[[ -d "$FAGAN_PACK" ]] || exit 0

STATE_DIR="$REPO_ROOT/.run/fagan-checkpoint"
SESSION_LOG="$STATE_DIR/session.jsonl"
VERDICT="$STATE_DIR/last-verdict.json"

# No session log = nothing to check.
[[ -f "$SESSION_LOG" ]] && [[ -s "$SESSION_LOG" ]] || exit 0

# Count unique unreviewed arch files. "Unreviewed" = file appears in
# session log AND (no verdict file OR verdict is older than file entry
# OR verdict is not APPROVED).
TOUCHED_UNIQUE=$(jq -r '.file' "$SESSION_LOG" 2>/dev/null | sort -u)
[[ -z "$TOUCHED_UNIQUE" ]] && exit 0
TOUCHED_COUNT=$(echo "$TOUCHED_UNIQUE" | wc -l | tr -d ' ')

# Threshold (configurable per env or .loa.config.yaml).
THRESHOLD=${FAGAN_PRECOMMIT_THRESHOLD:-3}
if command -v yq &>/dev/null && [[ -f "$REPO_ROOT/.loa.config.yaml" ]]; then
  cfg_threshold=$(yq eval '.fagan_review.precommit_threshold // ""' "$REPO_ROOT/.loa.config.yaml" 2>/dev/null)
  [[ -n "$cfg_threshold" && "$cfg_threshold" != "null" ]] && THRESHOLD="$cfg_threshold"
fi

# Below threshold — let it pass silently.
(( TOUCHED_COUNT <= THRESHOLD )) && exit 0

# Check if the existing verdict supersedes the session log.
VERDICT_OK="false"
if [[ -f "$VERDICT" ]]; then
  verdict_str=$(jq -r '.verdict // empty' "$VERDICT" 2>/dev/null)
  if [[ "$verdict_str" == "APPROVED" ]]; then
    # Verdict newer than newest session entry → cleared.
    verdict_mtime=$(stat -f %m "$VERDICT" 2>/dev/null || stat -c %Y "$VERDICT" 2>/dev/null || echo 0)
    log_mtime=$(stat -f %m "$SESSION_LOG" 2>/dev/null || stat -c %Y "$SESSION_LOG" 2>/dev/null || echo 0)
    if (( verdict_mtime >= log_mtime )); then
      VERDICT_OK="true"
    fi
  fi
fi

[[ "$VERDICT_OK" == "true" ]] && exit 0

# Block the commit with a structured reason. PreToolUse: exit 2 + stderr
# is the documented way to signal "block this tool invocation with a
# message the agent reads".
cat >&2 <<EOF
FAGAN ARCH GATE · ${TOUCHED_COUNT} architectural file(s) unreviewed since last sweep (threshold: ${THRESHOLD}).

Touched:
$(echo "$TOUCHED_UNIQUE" | sed 's/^/  · /')

Required before commit:
  bash .claude/hooks/fagan-sweep.sh           # review unstaged + staged
  bash .claude/hooks/fagan-sweep.sh --staged  # review only staged

After APPROVED verdict, retry the commit. To bypass for a one-off
mechanical commit (version bump, doc-only): FAGAN_PRECOMMIT_SKIP=1 git commit ...

Doctrine: grimoires/loa/doctrine/architectural-vs-creative-split.md
EOF
exit 2
