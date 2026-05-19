---
runbook: regression-hook-rollback
date: 2026-05-19
cycle: lab-evolution-2026-05-18
sprint: S1a
adr: ADR-11 (rollback runbook + bypass)
purpose: How to disable the regression substrate gate when false-positives appear
---

# Regression Hook Rollback Runbook

> The S1a regression substrate fuse is the pre-commit hook at `.husky/pre-commit`. This runbook covers safe disablement when the gate misfires.

## The hook architecture

| Component | Path | Role |
|---|---|---|
| Authoritative gate | `.husky/pre-commit` | Pre-commit fires for ALL agents |
| Bypass env var | `LOA_REGRESSION_HOOK_BYPASS=1` | Skip gate this commit (audited) |
| Advisory hook | `.claude/hooks/post-tool-use/lab-render-regression.sh` | WARN-only in Claude Code |
| Hook registration | `.claude/hooks/settings.hooks.json` | Maps PostToolUse → script |
| Audit trail | `.run/audit.jsonl` | Every block/bypass/warn |
| Baseline approve | `pnpm regression:approve --primitive X --reason "..."` | Update baselines (Docker per ADR-8) |

## When to use this runbook

- Pre-commit hook BLOCKS a legitimate commit (suspected false-positive)
- Hook is stuck in a self-locking loop (settings.hooks.json edits blocked)
- CI-only environment can't run Playwright
- Operator needs emergency override

## Procedure 1 · Bypass a single commit (preferred)

```bash
LOA_REGRESSION_HOOK_BYPASS=1 git commit -m "your message"
```

- The bypass is **audited** to `.run/audit.jsonl` with timestamp + actor
- One-shot — does not persist
- Use this when you're CERTAIN the gate is wrong (e.g., known font-substitution diff on platform-different machine)

## Procedure 2 · Disable the hook entirely (operator-direct shell, outside Claude Code)

```bash
# Remove husky pre-commit invocation
chmod -x .husky/pre-commit

# Verify hook is inactive
git commit --allow-empty -m "test: confirm hook bypass" --dry-run
```

To re-enable:
```bash
chmod +x .husky/pre-commit
```

## Procedure 3 · Skip Husky entirely (nuclear option)

```bash
# Disable husky for the session
HUSKY=0 git commit -m "..."
```

Or set `HUSKY=0` in your shell to persist for the terminal session.

## Procedure 4 · Recover from a self-locking loop

If the hook blocks edits to `settings.hooks.json` itself:

1. **Settings file is NOT in protected-path set** by design (per ADR-11) — this should not happen
2. If it does, use bypass: `LOA_REGRESSION_HOOK_BYPASS=1 git commit ...`
3. Verify the protected-path regex in `.husky/pre-commit` and `.claude/hooks/post-tool-use/lab-render-regression.sh` does NOT include `.claude/hooks/`

## Procedure 5 · Approve a legitimate baseline change

When the hook correctly detects geometry drift caused by intentional change:

```bash
# Capture + approve the new baseline (inside Docker per ADR-8)
docker run --rm -e LAB_BASELINE_DOCKER=1 -v "$(pwd):/work" -w /work lab-snapshot-baseline \
  pnpm regression:approve --primitive <name> --scale 1 --theme dark \
  --reason "intentional: <one-line rationale>"

# Stage + commit the baseline update
git add tests/snapshots/lab/
git commit -m "approve: <primitive> baseline (<reason>)"
```

CI advisory warns if >3 baselines or >50% updated in one PR (per IMP-010 governance).

## Procedure 6 · CI environment without Playwright

If CI can't install Playwright (rare):

```bash
# Set LOA_REGRESSION=0 in CI env to bypass the live substrate
# RegressionCheckNoopLive will be wired (per ADR-9)
```

## Audit your bypass usage

Review who bypassed and why:

```bash
jq 'select(.kind == "regression.bypass")' .run/audit.jsonl | tail -10
```

Frequent bypass = signal that the gate's tolerance needs tuning.

## Composition with other gates

- The Loa **Stop hook** (`.claude/hooks/safety/run-mode-stop-guard.sh`) is INDEPENDENT — does not interact with this gate
- The **block-destructive-bash hook** (`.claude/hooks/safety/block-destructive-bash.sh`) is INDEPENDENT
- CI gates (GitHub Actions) inherit `LOA_REGRESSION_HOOK_BYPASS` only when explicitly forwarded

## References

- **ADR-10** · Hook posture (pre-commit authoritative · PostToolUse advisory)
- **ADR-11** · This runbook
- **IMP-010** · Approval governance (Flatline PRD finding)
- **SDD §4** · Hook integration spec
- **Sprint plan S1a.T20** · Runbook deliverable

---

*Authored 2026-05-19 during S1a implementation. Operator pair-point on first hook misfire welcomed.*
