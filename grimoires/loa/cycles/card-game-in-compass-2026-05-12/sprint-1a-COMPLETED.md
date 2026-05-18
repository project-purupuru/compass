---
sprint: S1a
status: COMPLETED
date: 2026-05-12
branch: feat/hb-s1a-clash-match
parent_branch: feat/hb-s0-spike-tooling
tasks:
  - T1a.1 ✓ clash.{port,live,mock}.ts
  - T1a.2 ✓ clash invariant tests (25 cases per AC-4)
  - T1a.3 ✓ transcendence collision matrix (9 pairings)
  - T1a.4 ✓ match.{port,live,mock}.ts + transition matrix
  - T1a.5 ✓ match-transitions.test.ts (22 cases)
  - T1a.6 ✓ whisper determinism (moved from S7)
tests_total: 55 (5 battle + 3 whispers + 25 clash + 22 match-transitions)
test_duration: 580ms
pipeline_green:
  oxlint: 32 warnings · 0 errors
  oxfmt: all formatted
  tsc: clean
next-sprint: S1b
---

# S1a · COMPLETED

S1a (Honeycomb growth · clash + match + whisper determinism) closed cleanly
on 2026-05-12. All 6 tasks delivered, 55/55 tests green, full pipeline clean.

## What landed

- **Clash service** at `lib/honeycomb/clash.{port,live,mock}.ts` — pure-given-seed
  round resolution. AC-4 invariants verified: lineup rules, battle rules,
  type-power hierarchy, condition operativeness × 5, Forge/Void/Garden
  transcendence abilities, R3 immunity, deterministic replay.
- **Match service** at `lib/honeycomb/match.{port,live,mock}.ts` — phase
  orchestrator covering idle → entry → quiz → select → arrange → committed →
  clashing → disintegrating → between-rounds → result. SDD §3.3.1 transition
  matrix enforced via `validCommandsFor()` + typed `wrong-phase` errors.
- **Whisper determinism** — Math.random() replaced with `hashStringToInt(seed +
  whisperCounter + mood)`; counter held in MatchSnapshot. AC-12 closed.

## Architectural notes

- Match depends on Clash via `Layer.provide` (composition, not flat merge).
  `MatchOnClash = Layer.provide(MatchLive, PrimitivesLayer)`. AppLayer
  surface still has R = never.
- Stub opponent in `match.live.ts:stubOpponentLineup` is a placeholder;
  S1b T1b.1 replaces with real per-element parameterized policy.
- Transcendence collision resolution (9 pairings) verified in clash.test.ts.

## Carry-forward to S1b

- T1b.1 Opponent service (5 element policies)
- T1b.2 behavioral fingerprint tests
- T1b.3 BattlePhase compile-time enforcement
- T1b.4 localStorage SSR-safe wrapper
- T1b.5 clash error recovery doc
- T1b.6 S1 path-convention lock + CI grep
- T1b.7 battlefield-geometry.ts

S1b entry condition: **MET**.
