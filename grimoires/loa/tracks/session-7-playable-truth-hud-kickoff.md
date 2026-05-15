---
session: 7
date: 2026-05-14
type: kickoff
mode: feel
status: planned
target: app/battle-v2/ (worktree compass-cycle-1 · feat/purupuru-cycle-1 · dev :3000/battle-v2)
---

# Session 7 — The Playable Truth + Game HUD (kickoff)

## Scope

- Build **the playable truth** — the one ritual where you play the Wood card and the world *answers*: card lift → petal arc → zone bloom → daemon reaction → result read → input returns.
- Bind the **anchor registry** (synthetic placeholders today) and wire the sequencer's unused `onBeatFired` callback — this is the keystone; the loop's *logic* already exists.
- **Camera as a FEEL instrument** — it is locked today; build a lean-on-commit / release-on-unlock rig.
- First slice of **game HUD** — `TideIndicator` + selection-summoned `EntityPanel` only. Full chrome is V2.
- FEEL-mode Studio (ALEXANDER). The studio *builds the toy* — acceptance oracle is the clarity test + the repeat test, not test coverage.

## Artifacts

- Build doc (merged ARCH + build): `grimoires/loa/specs/enhance-playable-truth-hud.md` — **source of truth**
- This track: `grimoires/loa/tracks/session-7-playable-truth-hud-kickoff.md`
- Substrate run trail: `.run/compose/20260514-884c20/orchestrator.jsonl` + `envelopes/final.kickoff.handoff.json`

## Prior session

The burn-rite cycle (sprints 148–152) shipped the honeycomb substrate + `/burn` ceremony on the `dev` branch — a *different* architecture from battle-v2. battle-v2 (`feat/purupuru-cycle-1`) runs entirely on `lib/purupuru/` with zero `lib/honeycomb/`. Branch consolidation collapsed 17 branches → `dev` + 3 live surfaces; battle-v2 is one of them. This session focuses around the battle-v2 world surface, solo-indie style — substrate-line reconciliation is deferred.

## Decisions made in kickoff

1. **Target = battle-v2 in the `compass-cycle-1` worktree.** Build the toy where it lives; defer substrate wiring (operator's director-mode rule + ALEXANDER's creative-selection loop).
2. **The keystone is the anchor-binding seam**, not "build the loop." DIG found the game loop's logic already wired end-to-end — what's missing is the *answer*: anchors are registered synthetic, the sequencer fires beats into the void, `onBeatFired` is unused.
3. **Invariant: the sim/presentation separation.** `lib/purupuru/runtime/` is off-limits. Presentation consumes events + beats; never mutates state. (OSTROM — the loop's rules must not be vibe-coded.)
4. **Camera is a first-class FEEL instrument** — a mass-having tween rig that glides, not a free-orbit control.
5. **BARTH scope: V1 = the one Wood ritual feeling good.** The full village-sim HUD (resource rail, notifications, time controls) is explicitly V2. "While I'm at it" is banned.
6. **Springs, not eases** — every motion gets named `mass·stiffness·damping` tokens in `battle-v2.css`.

## Next session entry point

```text
/feel   — FEEL mode · ALEXANDER
Read first: grimoires/loa/specs/enhance-playable-truth-hud.md (the source of truth)
Surface:    app/battle-v2/_components/  ·  dev server :3000/battle-v2

Build order (dependency-ordered, per the build doc):
  1. useAnchorBinding + bind the real anchors (the keystone — nothing works without it)
  2. wire onBeatFired (SequenceConsumer:36)
  3. PetalArc → 4. ZoneBloom → 5. DaemonReact → 6. CameraRig → 7. RewardRead → 8. TideIndicator+EntityPanel

Each step: build the toy → touch it on :3000/battle-v2 → name what felt right in tokens → promote.
The question at every step: does the player want to do it again?
```
