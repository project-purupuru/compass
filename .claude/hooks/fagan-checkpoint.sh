#!/usr/bin/env bash
# fagan-checkpoint.sh — PostToolUse domain-aware FAGAN review prompter
#
# Soft-fires after Edit/Write/MultiEdit on ARCHITECTURAL files. Does NOT
# fire on creative/FEEL surfaces — Opus drives those, FAGAN watches the
# substrate. Injects a checkpoint reminder into the agent context; the
# agent decides whether to actually invoke /reviewing-files.
#
# Domain split (operator-stated 2026-05-19):
#   - Architectural: Effect substrate, schemas, ports, state machines,
#     contracts, lib/state, scripts/ (excluding spikes), .claude/ authoring
#   - Creative (FEEL): CSS, motion, animation curves, copy, pure UI .tsx
#
# Doctrine: grimoires/loa/doctrine/architectural-vs-creative-split.md
#
# Debounce: only re-fires the reminder if > FAGAN_DEBOUNCE_SECONDS have
# passed since the last architectural edit in this session. Inside the
# debounce window, the file is APPENDED to the session log (batch review
# surface) but no new reminder is injected.
#
# Auth: routes via construct-fagan codex CLI (subscription auth at
# ~/.codex/auth.json). NEVER uses OPENAI_API_KEY. If FAGAN pack not
# installed at .claude/constructs/packs/fagan/, exits silently — feature
# gracefully degrades.
#
# Toggle: .loa.config.yaml::fagan_review.enabled (default true if pack
# installed). Set false to silence entirely.

set -u

# -----------------------------------------------------------------------------
# Inputs
# -----------------------------------------------------------------------------

INPUT=$(cat)

# Silent exit if jq missing or input unparseable.
command -v jq &>/dev/null || exit 0
echo "$INPUT" | jq empty 2>/dev/null || exit 0

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)

# Conservative: empty file_path → can't classify → skip.
[[ -z "$FILE_PATH" ]] && exit 0

# -----------------------------------------------------------------------------
# Pack-presence gate
# -----------------------------------------------------------------------------

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FAGAN_PACK="$REPO_ROOT/.claude/constructs/packs/fagan"

# If FAGAN isn't installed, this hook can't do anything useful. Exit
# silently rather than nag.
[[ -d "$FAGAN_PACK" ]] || exit 0

# -----------------------------------------------------------------------------
# Master toggle
# -----------------------------------------------------------------------------

CONFIG_FILE="$REPO_ROOT/.loa.config.yaml"

if command -v yq &>/dev/null && [[ -f "$CONFIG_FILE" ]]; then
  enabled=$(yq eval '.fagan_review.enabled // true' "$CONFIG_FILE" 2>/dev/null || echo "true")
  [[ "$enabled" == "true" ]] || exit 0
fi

# -----------------------------------------------------------------------------
# Domain classification
# -----------------------------------------------------------------------------
#
# Returns 0 (architectural) or 1 (creative/skip).
#
# Architectural signals (any single match qualifies):
#   - Effect substrate naming: *.schema.{ts,tsx}, *.port.ts, *.live.ts
#   - lib/**/state/**
#   - lib/cards/codex/**  (canonical pantry primitives)
#   - lib/lab/adapter-registry/**
#   - lib/lab/pointer-chain/**
#   - app/**/state/**
#   - **/__tests__/**.test.ts  (test code = substrate verification)
#   - scripts/**  (except scripts/spikes/** which is exploration)
#   - .claude/hooks/**, .claude/scripts/**  (when authoring hooks/scripts)
#   - .claude/constructs/packs/**/scripts/**, **/schemas/**
#   - *.config.ts (vfx-config, schema configs)
#
# Creative signals (always skip):
#   - *.css, globals.css, tailwind.config.*
#   - components/**/*.tsx  (UI components — Opus territory)
#   - app/**/*.tsx if no architectural marker — likely page assembly
#   - app/**/_components/vfx/effects/**.tsx  (visual effect implementations)
#
# Ambiguous: fall back to architectural (better to over-prompt the
# operator than under-prompt — they can dismiss the reminder).

classify_path() {
  local p="$1"

  # SKIP — exploration / spikes
  [[ "$p" == */spikes/* ]] && return 1

  # SKIP — pure visual surfaces
  case "$p" in
    *.css|*globals.css|*tailwind.config*) return 1 ;;
    *components/AnimatedFavicon.tsx) return 1 ;;
    *components/theme/*) return 1 ;;
    */effects/CardComposition.tsx|*/effects/TreeFall.tsx|*/effects/WaterSplash.tsx) return 1 ;;
    *_components/vfx/effects/*.tsx) return 1 ;;
  esac

  # ARCH — Effect substrate naming convention
  case "$p" in
    *.schema.ts|*.schema.tsx) return 0 ;;
    *.port.ts|*.live.ts) return 0 ;;
    *.config.ts) return 0 ;;
  esac

  # ARCH — substrate paths
  case "$p" in
    *lib/*/state/*) return 0 ;;
    *lib/cards/codex/*) return 0 ;;
    *lib/lab/adapter-registry/*) return 0 ;;
    *lib/lab/pointer-chain/*) return 0 ;;
    *lib/lab/state/*) return 0 ;;
    *app/*/state/*) return 0 ;;
    */__tests__/*.test.ts) return 0 ;;
    *scripts/*) return 0 ;;
    *.claude/hooks/*|*.claude/scripts/*) return 0 ;;
    *.claude/constructs/packs/*/scripts/*) return 0 ;;
    *.claude/constructs/packs/*/schemas/*) return 0 ;;
  esac

  # Default: SKIP. Operator's framing: creative on top, arch underneath.
  # When in doubt, treat as FEEL territory and let Opus run.
  return 1
}

if ! classify_path "$FILE_PATH"; then
  exit 0
fi

# -----------------------------------------------------------------------------
# Session log + debounce
# -----------------------------------------------------------------------------

STATE_DIR="$REPO_ROOT/.run/fagan-checkpoint"
mkdir -p "$STATE_DIR"
SESSION_LOG="$STATE_DIR/session.jsonl"
LAST_FIRE="$STATE_DIR/last-fire.epoch"

NOW=$(date +%s)
DEBOUNCE_SECS=${FAGAN_DEBOUNCE_SECONDS:-300}  # 5min default

# Append touched arch file to session log.
printf '{"ts":"%s","tool":"%s","file":"%s"}\n' \
  "$(date -u +%FT%TZ)" "$TOOL_NAME" "$FILE_PATH" >> "$SESSION_LOG" 2>/dev/null || true

# Debounce check — was the reminder fired recently?
if [[ -f "$LAST_FIRE" ]]; then
  LAST=$(cat "$LAST_FIRE" 2>/dev/null || echo 0)
  ELAPSED=$((NOW - LAST))
  if (( ELAPSED < DEBOUNCE_SECS )); then
    # Inside debounce window — silent append, no reminder.
    exit 0
  fi
fi

# Record this fire and emit the reminder.
echo "$NOW" > "$LAST_FIRE"

# Count files touched in current session window for the prompt.
TOUCHED=$(wc -l < "$SESSION_LOG" 2>/dev/null | tr -d ' ')
TOUCHED=${TOUCHED:-1}

# -----------------------------------------------------------------------------
# Emit checkpoint reminder
# -----------------------------------------------------------------------------

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "FAGAN ARCH CHECKPOINT · ${TOUCHED} architectural file(s) touched recently (last: ${FILE_PATH}). When you reach a natural seam (before a commit, before declaring done), consider running /reviewing-diffs against the staged diff or /reviewing-files on the touched paths. Subscription auth (~/.codex/auth.json) — no API key. Debounced 5min; one reminder per cluster. Session log: .run/fagan-checkpoint/session.jsonl. Skip if change was a tiny mechanical fix."
  }
}
EOF
