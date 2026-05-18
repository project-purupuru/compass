---
session: 16
date: 2026-05-17
type: kickoff
status: planned
pacing: kaironic + teaching (NOT speed-build)
run_id: 2026-05-17-9a4d3d
---

# Session 16 — Columnar ECS Deep Dive (kickoff)

## Scope

- Teach: internalize columnar/archetype ECS pattern (Bevy Tables vs EnTT Sparse Sets)
- Understand: how columnar ECS composes with our existing Effect-TS substrate (peer-substrate doctrine)
- Validate: that Effect-TS Layer can host raw Float32Array as InstancedBufferAttribute
- Ship ONE proof: all hex-scene leaves render via single InstancedMesh + single useFrame
- Measure: draw call drop + FPS delta (gated by `useInstancedLeaves` debug knob)
- Distill: doctrine entry on what we learned + what's deferred

## Artifacts

- Build doc: `grimoires/loa/specs/enhance-columnar-ecs-teaching-session.md`
- PRD (source of truth): `grimoires/loa/specs/enhance-substrate-perf-and-engine.md`
- Lane 1 dig: `grimoires/k-hole/research-output/dig-2026-05-17-columnar-ecs.md`
- Lane 2 dig: `grimoires/k-hole/research-output/dig-2026-05-17-three-quarks-vfx.md`

## Prior session (15 - VFX work this conversation)

Shipped: cel-vocabulary system + biome-decorator substrate + height-classified hex edge rendering + per-tile hue jitter + animated cel water + Rain particle primitive (Lane 2 first VFX) + PerfReadout panel + Hex debug overlay + the substrate PRD (Lane 1).

Discovered (via Flatline-style review = FAGAN + GPT-5.5-pro adversarial passes): the cliff wall winding fix from FAGAN was wrong; GPT-5.5 caught the regression. Cross-product math is the tiebreaker when models disagree on geometric winding. Future geometric reviews should explicitly demand cross-product verification.

## Decisions made (preplan crystallization)

- Peer-substrate shape: ECS lives at `lib/engine/` as a separate substrate from `lib/honeycomb/` (Effect substrate). Both substrate-as-category; different shapes per scope. Per cycle-4 doctrine in construct-effect-substrate.
- Single archetype (`LeafEntity`) is sufficient for the proof — defer multi-archetype scheduler.
- Bevy Tables shape (strict contiguous, swap-remove) for leaves (count is static per scene). Sparse Sets deferred until we have moving-entity archetypes (creatures, transient particles).
- NO three.quarks adoption. Bespoke per-primitive VFX (Rain is the reference impl).
- NO renderer plugin port THIS session (PRD step 5 — different session).
- NO physics/Rapier integration THIS session (PRD step 7 — different session).
- A/B gating via `useInstancedLeaves` debug knob — current per-component path stays alive for comparison, not deleted.

## Pacing reminder

The operator's framing: "kaironic + teaching, NOT speed-build."

Stage budget guide (~3.5h total, can run longer):
- Stage 1 (read deeply): 30 min
- Stage 2 (sketch in scratch): 45 min
- Stage 3 (validate on paper): 30 min
- Stage 4 (ship the proof): 90 min
- Stage 5 (distill): 30 min

If Stage 4 doesn't land in 90 min: STOP. Re-read Stages 1-3. Iterate the sketch. Better to land Stages 1-3 deeply than to ship broken Stage 4.

## Open work bridging into this session

- `task #64` (L1 quick-win — instance the leaves) — THIS is the proof point. The task's scope IS Stage 4.
- The substrate PRD has 8 more steps (engine ports, oracle bus, etc.) — none of those THIS session.

## Adjacent context worth knowing

- El Capitan's Five Oracles (CORONA/TREMOR/BREATH/DELUGE) are real-world weather/cosmic data sources arriving in ~1 week. The engine substrate's event-bus is the integration point — but THAT integration is PRD step 9, NOT session 16.
- The peer-substrates doctrine landed in construct-effect-substrate cycle-4 (2026-05-13, ref compass-purupuru-cycle-1). It explicitly names "Thousands-of-entities scale → ECS (DOTS/SoA)" as the right shape for this scope. The PRD adopts it directly.
- Lane 2 (VFX iteration) is operator-paced and NOT this session's scope. Rain is shipped; thunder/earthquake/displacement are next-Lane-2-session topics, not session-16 topics.
