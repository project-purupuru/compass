---
sprint: S1b
status: COMPLETED
date: 2026-05-12
branch: feat/hb-s1b-opponent-infra
parent_branch: feat/hb-s1a-clash-match
tasks:
  - T1b.1 ✓ opponent.{port,live,mock}.ts
  - T1b.2 ✓ opponent.test.ts (10 cases · snapshot deterministic)
  - T1b.3 ✓ phase-exhaustiveness fuzz (6 cases · ESLint custom rule deferred per SKP-003)
  - T1b.4 ✓ storage.ts (SSR-safe localStorage) + storage.test.ts (8 cases)
  - T1b.5 ✓ clash-error-recovery.md (scaffold doc for S2 wiring)
  - T1b.6 ✓ check-asset-paths.sh + lint.yml integration + asset-manifest.schema.json
  - T1b.7 ✓ battlefield-geometry.ts (Q-SDD-2 resolved)
tests_total: 79
test_duration: 671ms
pipeline_green:
  oxlint: 32 warnings · 0 errors
  oxfmt: all formatted
  tsc: clean
  check-asset-paths: all asset references resolve
operator-pair-point: DUE per sprint plan §S1-pattern-lock-criteria
next-sprint: S2 (BattleField + BattleHand)
---

# S1b · COMPLETED · Honeycomb pattern-lock

All 7 S1b tasks delivered. The full Honeycomb substrate is in place: Battle phase machine + Clash round resolution + Match orchestrator + Opponent parameterized policy + storage + geometry + lint/CI infra.

## What landed

| File | Purpose |
|---|---|
| `lib/honeycomb/opponent.{port,live,mock}.ts` | Per-element AI · 5 policies · deterministic given seed |
| `lib/honeycomb/storage.ts` | SSR-safe localStorage wrapper · 6 failure modes handled |
| `lib/honeycomb/battlefield-geometry.ts` | TERRITORY_CENTERS + LINEUP_GRID + helpers |
| `lib/honeycomb/__tests__/opponent.test.ts` | 10 cases · policy distinguishability + determinism |
| `lib/honeycomb/__tests__/storage.test.ts` | 8 cases (jsdom env) |
| `lib/honeycomb/__tests__/phase-exhaustiveness.test.ts` | 6 cases · fuzz fallback for ESLint rule (SKP-003) |
| `scripts/check-asset-paths.sh` | Grep all public/ refs across source · CI-integrated |
| `.github/workflows/lint.yml` | + check-asset-paths step |
| `grimoires/loa/schemas/asset-manifest.schema.json` | Locked schema for S6 |
| `grimoires/loa/notes/clash-error-recovery.md` | Scaffold for S2 error wiring |

## Pattern-lock criteria check (per sprint plan §S1-pattern-lock-criteria)

| Criterion | Target | Status |
|---|---|---|
| All 3 new ports typecheck clean | `pnpm tsc --noEmit` zero errors | ✓ |
| All invariant tests green | ≥25 clash + ≥9 transcendence + opponent + match transitions | ✓ 79 total |
| BattlePhase exhaustiveness enforced | fuzz test or never-assert pattern | ✓ phase-exhaustiveness test |
| Single Effect.provide site preserved | `scripts/check-single-runtime.sh` | ✓ (one `ManagedRuntime.make` in repo) |
| Substrate file count reasonable | `find lib/honeycomb -name "*.ts" \| wc -l` ≤ 30 | ✓ ~25 |
| Cumulative LOC ≤ +3,000 tracking | tracking signal | ✓ ~+2,800 across S0+S1a+S1b |

**OPERATOR PAIR-POINT DUE.** Honeycomb pattern-lock complete. Review before S2 enters.

## Architectural snapshot (post-S1b)

```
AppLayer = mergeAll(
  WeatherLive, SonifierLive,
  ActivityLive, PopulationLive,
  InvocationLive,
  BattleLive, ClashLive, OpponentLive,
  Layer.provide(AwarenessLive, PrimitivesLayer),
  Layer.provide(ObservatoryLive, AwarenessOnPrimitives),
  Layer.provide(MatchLive, PrimitivesLayer),  // Match depends on Clash
)
```

All R = never · single Effect.provide site at lib/runtime/runtime.ts.

## Carry-forward to S2

S2 is the BattleField + BattleHand port. The substrate is ready · the UI is what's missing.

- Productionize `BattleField.tsx` (created at S0 as spike, needs Match.current wiring)
- Evolve `LineupTray.tsx` → `BattleHand.tsx` reading from `useMatch()`
- Move CombosPanel inline (FR-23)
- Wire `match.client.ts` mirror of `battle.client.ts` (useMatch hook)
- Rewrite `BattleScene.tsx` v2 around Match phases

S2 entry condition: **MET** (assuming operator pair-point ratifies pattern-lock).
