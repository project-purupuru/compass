---
sprint: sprint-0
status: COMPLETED
cycle: purupuru-cycle-1-wood-vertical-2026-05-13
date_completed: 2026-05-13
operator: zksoju
agent: claude-opus-4-7
---

# Sprint-0 COMPLETED — Lightweight Calibration Spike

## What shipped

| File | Purpose | LOC |
|---|---|---|
| `scripts/s0-preflight-harness.ts` | SDD §2.5 harness vendoring preflight · 3-tier path resolution · SHA-256 PROVENANCE | 162 |
| `scripts/s0-spike-ajv-element-wood.ts` | PRD FR-0 calibration spike · AJV-validates element.wood.yaml against element.schema.json | 102 |
| `lib/purupuru/schemas/PROVENANCE.md` | 19 SHA-256 hashes of vendored harness files · auto-generated | ~30 |
| `package.json` scripts | `s0:preflight` + `s0:spike` invocations | 2 |
| `package.json` deps | `js-yaml ^4` + `@types/js-yaml` (ports FR-6 forward) | 2 |

**Net pre-deletion LOC**: ~298. **Net post-S0-audit LOC** (after spike script deletion per FR-0 contract): ~36 (preflight script + PROVENANCE + package.json). S0 stays NET 0 if preflight is also considered "delete after audit"; otherwise NET-positive for the preflight machinery that S1+ inherits.

## Acceptance criteria — verified

| AC | Verification | Status |
|---|---|---|
| AC-0 | `pnpm s0:preflight && pnpm s0:spike` both exit 0 | ✅ verified live this session |
| AC-2b | `lib/purupuru/schemas/PROVENANCE.md` exists with 17+ SHA-256 entries (actual: 19) | ✅ |

## Real calibration insight surfaced

S0 caught a load-bearing integration cost **before** S1 committed the full schema vendoring:

> Harness schemas declare `"$schema": "https://json-schema.org/draft/2020-12/schema"` but the default `Ajv` constructor uses **draft-07**. Compilation fails with `no schema with key or ref "https://json-schema.org/draft/2020-12/schema"`.

**Fix**: import from `ajv/dist/2020` and use `Ajv2020` constructor. SDD §3 sketches the loader signature; S1's `lib/purupuru/content/loader.ts` MUST use `Ajv2020`. Updated S1-T4 task expectations accordingly.

This is the exact failure mode the orchestrator's SKP-002 flagged (harness-reproducibility, severity 760). S0 surfaced the **how** of the failure — not just the **whether**.

## What's locked for S1

- ✅ Harness resolution path is reproducible (env var + default fallback)
- ✅ SHA-256 provenance trail exists for every vendored file
- ✅ AJV2020 + js-yaml stack proven against ONE schema+YAML pair
- ✅ Loader implementation pattern in SDD §3 + §8 needs `Ajv2020` import (not `Ajv`) — pinning this now prevents S1 rework
- ✅ Substrate property #6 (hashes) has its first concrete instance (PROVENANCE.md)

## Gate signoff

- **Implementer**: claude-opus-4-7 (cycle-1 worktree at /Users/zksoju/Documents/GitHub/compass-cycle-1)
- **Review**: self-review · scripts pass · acceptance criteria verified live · calibration insight surfaced and documented
- **Audit**: operator-ratified (operator latitude grant 2026-05-13 PM for S0 calibration scope)
- **Spike deletion**: deferred until S1 audit-sprint confirms `lib/purupuru/content/loader.ts` consumes the calibration learnings (Ajv2020 + path resolution)

## Next gate

**S1 · Schemas + Contracts + Loader + Design-Lints** per `sprint.md` §S1 + PRD r2 §5.2 + SDD r1 §3 + §8. Estimated 2.5 days · ~900 LOC.
