# /gpt-review — alias for FAGAN (codex CLI · subscription auth)

> [!NOTE]
> **This file overrides the deprecated framework `/gpt-review`.** It re-points the
> familiar handle at the `construct-fagan` pack (FAGAN persona · single codex CLI
> pass · structured JSON findings · convergence loop). Operator-paired alias
> preserves muscle memory while gaining first-class Loa support and routing
> through the ChatGPT subscription rather than `OPENAI_API_KEY`.
>
> Original framework version: deprecated 2026-04-15, scheduled retirement no
> earlier than 2026-07-15. Compass mirrors the bonfire alias pattern established
> 2026-05-04 (see `~/.claude/projects/-Users-zksoju-bonfire/memory/project_codex_review_alias_2026_05_04.md`).

## What it is

Adversarial code review of a unified diff (or specific files), single pass via
`codex exec` subprocess. Returns structured JSON with line-anchored fixes
(`current_code` + `fixed_code` + `explanation`). Convergence loop with 3-iteration cap.

**Persona:** FAGAN — after Michael Fagan, who invented formal code inspection at
IBM in 1976. Line-anchored. Evidence-based. Provides actual code fixes, not
descriptions.

**Sits below Flatline Protocol in the review stack:**

- `/flatline-review` — multi-model adversarial on PRD/SDD/Sprint planning artifacts
- `/gpt-review` (this) — single-model adversarial on **code diffs** (post-implement quality gate)
- `/run-bridge` — kaironic Bridgebuilder iterative fix loop on PRs

## Invocation

The override delegates to the FAGAN pack's user-invocable skills:

| Surface | Use case | Backend |
|---------|----------|---------|
| `/reviewing-diffs` | Review a unified diff (PR review · post-impl gate) | `.claude/constructs/packs/fagan/skills/reviewing-diffs/SKILL.md` |
| `/reviewing-files` | Audit specific files (no diff context · pre-merge audit) | `.claude/constructs/packs/fagan/skills/reviewing-files/SKILL.md` |

Or via the script directly:

```bash
# Diff review
git diff main..HEAD > /tmp/changes.diff
bash .claude/constructs/packs/fagan/scripts/codex-review-api.sh review-diff /tmp/changes.diff
# stdout: structured JSON · exit 0 = APPROVED, 1 = CHANGES_REQUIRED

# File audit
bash .claude/constructs/packs/fagan/scripts/codex-review-api.sh review-files lib/foo.ts app/bar.tsx

# Iteration 2+ (re-review with previous findings)
bash .claude/constructs/packs/fagan/scripts/codex-review-api.sh review-diff /tmp/changes.diff \
  --iteration 2 \
  --previous .run/codex-review/iter-1.json
```

## Requirements

| | |
|---|---|
| `codex` CLI | Installed (verify: `codex --version`) and signed in via ChatGPT subscription (`codex login` — populates `~/.codex/auth.json`) |
| Auth | EITHER subscription auth at `~/.codex/auth.json` OR `OPENAI_API_KEY` env var. Local patch to `scripts/lib/lib-security.sh::ensure_codex_auth` accepts both paths — see [[feedback_fagan-subscription-auth-fix]]. Compass operator runs subscription-only per [[subscription-cli-always]]; no env var needed. Upstream issue tracking the patch: see provenance. |
| `CODEX_REVIEW_MODEL` | Optional · defaults to `gpt-5.5` per `scripts/codex-review-api.sh:45` |

## Output schema

JSON conforming to `.claude/constructs/packs/fagan/schemas/codex-review-finding.schema.json`:

```json
{
  "verdict": "APPROVED" | "CHANGES_REQUIRED",
  "summary": "one-sentence assessment",
  "findings": [
    {
      "severity": "critical" | "major",
      "file": "...",
      "line": 42,
      "description": "...",
      "current_code": "...",
      "fixed_code": "...",
      "explanation": "..."
    }
  ],
  "fabrication_check": { "passed": true, "concerns": [] },
  "previous_issues_status": [],
  "iteration": 1,
  "auto_approved": false
}
```

Exit codes: `0=APPROVED`, `1=CHANGES_REQUIRED`, `2=input_err`, `3=api_failure`, `4=auth`, `5=format_err`.

## Composition

`construct-fagan` composes with:

- **codex-rescue** (`@openai-codex` plugin) — implementer pairs with reviewer for an implement→review loop (`loa-compositions/compositions/delivery/code-implement-and-review.yaml`)
- **artisan** — code-quality lens for non-correctness craft concerns
- **flatline** — Flatline Protocol stays above for planning artifacts; FAGAN handles code

## When to use

- ✅ Post-implement code review on a PR diff
- ✅ Pre-merge audit of changed files
- ✅ Inside `/run-bridge` iterations as the converging review pass
- ❌ NOT for PRD/SDD/Sprint review — that's `/flatline-review`
- ❌ NOT for UI feel / animation curves — that's `artisan`

## Provenance

- Pack: [construct-fagan](https://github.com/0xHoneyJar/construct-fagan) · v0.2.0 · MIT
- Local clone: `/Users/zksoju/Documents/GitHub/construct-fagan`
- Symlinked into compass: `.claude/constructs/packs/fagan` → local clone
- Override created: 2026-05-19 (compass mirror of bonfire's 2026-05-04 setup)
