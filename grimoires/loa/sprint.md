---
status: draft-r0
type: sprint-plan
cycle: engine-substrate-2026-05-17
session: 16
mode: ARCH (OSTROM) + craft lens (ALEXANDER) + k-hole-as-teacher
branch: feat/ecs-leaves-2026-05-17
prd: grimoires/loa/prd.md
sdd: grimoires/loa/sdd.md
prd_source: grimoires/loa/specs/enhance-substrate-perf-and-engine.md
kickoff: grimoires/loa/specs/enhance-columnar-ecs-teaching-session.md
digs:
  - grimoires/k-hole/research-output/dig-2026-05-17-columnar-ecs.md
  - grimoires/k-hole/research-output/dig-2026-05-17-three-quarks-vfx.md
convergence_target: "hex-scene leaves render through ONE InstancedMesh driven by ONE useFrame; useInstancedLeaves toggle A/Bs the path; ≥10× draw-call drop, FPS unchanged or better, visual parity at static frame"
run_id: 2026-05-17-9a4d3d
created: 2026-05-17
---

# Engine Substrate — Cycle 2 — Leaves Proof Sprint Plan

Three sprints. ~350 LOC of new code, additive only — no deletion of existing
fixture render paths. The new `useInstancedLeaves` toggle in HexSceneConfig
gates the alternate render path, so operator A/Bs by flipping it in PostPane.

This sprint plan is the proof-tier slice of the larger engine-substrate PRD
(`grimoires/loa/specs/enhance-substrate-perf-and-engine.md`). Subsequent
cycles will handle the render-plugin port (PRD step 5), event-bus (step 6),
physics-plugin (step 7), VFX vocabulary expansion (step 8), and oracle
ingestion (step 9). This cycle proves the ECS + InstancedMesh pattern works
in our cel-shaded register before extending it.

## Dependency graph

```
  S1 (ECS substrate) ──→ S2 (renderer + integration) ──→ S3 (verify + distill)

  - S1 ships standalone, fully unit-tested. lib/engine/ becomes consumable.
  - S2 consumes S1; adds the toggle + per-fixture suppression; manual smoke confirms visual parity.
  - S3 captures the A/B PerfReadout measurement + writes Stage-5 distillation.
```

S1 and S2 must run sequentially (S2 imports S1). S3 depends on S2 (needs the
toggle wired). No parallelism within the cycle.

---

## Sprint 1 — ECS substrate primitives

**Scope**: scaffold `lib/engine/` with the smallest viable archetype + system
shape needed for the leaf proof. No app code touches yet. Pure substrate.

**Files created**: 5 source + 2 test = ~150 LOC

| Task | Files | AC |
|---|---|---|
| S1-T1 | `lib/engine/ecs/archetype.ts` — `Archetype<TCols>` class with typed-array column slabs, `add(init): EntityId` (returns dense slot), `destroy(id)` via swap-remove, `columnArray(name): Float32Array` accessor, capacity grows in powers of 2 | tsc passes; exports `Archetype` class + `ColumnSpec` type |
| S1-T2 | `lib/engine/ecs/world.ts` — `World` with `createEntity(archetype, init): EntityId`, `destroyEntity(id)`. Single-archetype lookup (no routing across archetypes). Lightweight. | tsc passes; exports `World` class + `EntityId` brand type |
| S1-T3 | `lib/engine/ecs/system.ts` — `System<TCols>` type alias `(arch, dt, t) => void`. No scheduler, no registry — systems are called manually from useFrame. | tsc passes; exports `System` type |
| S1-T4 | `lib/engine/animation/sway-system.ts` — `swayLeafSystem` reads `(phase, amplitude, frequency)` columns + writes the rotation portion of a `matrix4` column. Uses `swayAngle` math semantically equivalent to `app/battle-v2/_components/vfx/celVocab.ts` (verify against the existing helper). | tsc passes; pure function; matches existing celVocab sway math |
| S1-T5 | `lib/engine/index.ts` — re-exports `Archetype, World, System, swayLeafSystem` | tsc passes |
| S1-T6 | `lib/engine/ecs/archetype.test.ts` — vitest: (a) create + add 5 → length 5; (b) destroy slot 2 → swap-remove behavior preserves contiguity; (c) capacity grows from 4 → 8 → 16 when filled; (d) columnArray returns the actual backing slab (mutations visible). ≥6 assertions. | `vitest run lib/engine` passes |
| S1-T7 | `lib/engine/animation/sway-system.test.ts` — vitest: (a) same archetype state + same `t` → bit-identical output across calls (determinism); (b) different `phase` columns → independent sway; (c) writes only the rotation portion of matrix4 (translation+scale untouched). ≥3 assertions. | vitest passes |

**Sprint 1 exit criteria**: `pnpm tsc --noEmit` passes, `pnpm vitest run lib/engine` passes (all assertions green), no exports consumed by app code yet.

**Not in scope**: no integration with R3F, no Three.js imports, no `@effect/schema`-derived layouts, no multi-archetype scheduler.

---

## Sprint 2 — Renderer + integration

**Scope**: wire the ECS substrate to a single `<InstancedMesh>` and gate the
alternate render path behind `useInstancedLeaves`. When toggle is ON, fixtures
skip their `<LeafPuff>` JSX and the scene mounts one `<InstancedLeafField>`
collecting all leaf data via extractor pure functions.

**Files created/modified**: 1 new renderer + 1 new extractor module + 1 config
edit + 4 fixture edits + 1 scene edit = ~190 LOC

| Task | Files | AC |
|---|---|---|
| S2-T1 | `app/battle-v2/_components/vfx/effects/InstancedLeafField.tsx` — R3F `<InstancedMesh>` bound to a `LeafArchetype` (allocated in `useMemo`). One `useFrame` mounts `swayLeafSystem(arch, dt, t)` then writes back to `mesh.instanceMatrix` (with `needsUpdate = true`) + `mesh.instanceColor`. Uses `icosahedronGeometry(detail=0)` + `meshToonMaterial` with `DEFAULT_TOON_GRADIENT` to match LeafPuff's primary puff. | tsc passes; component renders an instanced mesh given an archetype prop |
| S2-T2 | `app/battle-v2/_components/vfx/effects/leafExtractors.ts` — pure functions: `treeLeafData(fixture, plotOrigin)`, `mushroomLeafData(fixture, plotOrigin)`, `wildflowerLeafData(fixture, plotOrigin)`, `rockMossLeafData(fixture, plotOrigin)`. Each returns `LeafData[]` with `{ worldPosition, color, swayParams }`. Math mirrors the current per-fixture render (`buildBranches` in Tree.tsx, etc.). | tsc passes; vitest snapshot of stable scatter for one seed (≥2 assertions) |
| S2-T3 | `app/battle-v2/_components/vfx/VfxConfig.ts` — add `useInstancedLeaves: S.Boolean` to `HexSceneConfig` schema, default `false`. PostPane → debug section picks it up automatically via the existing schema-driven control rendering. | tsc passes; PostPane shows toggle under "debug" |
| S2-T4 | `app/battle-v2/_components/vfx/effects/Tree.tsx` — accept optional `suppressLeaves?: boolean` prop. When `true`, skip the `<LeafPuff>` JSX at each branch tip. Render trunk + branches normally. | tsc passes; visual smoke: toggle OFF behaves identically; toggle ON shows tree with no leaves |
| S2-T5 | `app/battle-v2/_components/vfx/effects/Mushroom.tsx` + `Wildflower.tsx` + `Rock.tsx` — same `suppressLeaves` prop pattern. Mushroom suppresses its cap LeafPuff; Wildflower suppresses its bloom-head LeafPuff; Rock suppresses its moss-tuft LeafPuff. Bush.tsx is OUT OF SCOPE (uses internal sub-puffs, not LeafPuff). | tsc passes |
| S2-T6 | `app/battle-v2/_components/vfx/effects/HexScene.tsx` — when `config.useInstancedLeaves` is true: walk `plots[].fixtures`, call the matching extractor per fixture kind, build one `LeafArchetype` with all leaves, mount `<InstancedLeafField archetype={archetype}>` once at the scene level. Pass `suppressLeaves={config.useInstancedLeaves}` to each fixture in HexPlot. | manual smoke: toggle ON renders all leaves through one InstancedMesh; toggle OFF unchanged |
| S2-T7 | `app/battle-v2/_components/vfx/effects/HexPlot.tsx` — forward `suppressLeaves` prop from HexScene through to Tree/Mushroom/Wildflower/Rock render calls (no own logic; pure pass-through). | tsc passes |

**Sprint 2 exit criteria**: `pnpm tsc --noEmit` passes; manual smoke in `/battle-v2/vfx-lab` confirms (a) toggle OFF behaves as today; (b) toggle ON renders all leaves visually equivalent at idle (modulo ink outlines on leaves — see "documented regressions" below).

**Documented regression** (Alexander craft-lens flag): drei's `<Outlines>` uses
an inverted-hull mesh that does NOT support instancing. The instanced path
will have NO ink outlines on the LEAVES specifically. Trunks, branches,
mushroom caps, wildflower stems, rocks — all keep their outlines. Per the
PRD's "outline parity" rule, this is a structural compromise we accept for
the proof; revisit with a custom instanced-outline shader in a later cycle if
the visual impact is significant.

**Not in scope**: Bush.tsx refactor, custom instanced-outline shader, render-plugin
port abstraction, deletion of LeafPuff or per-fixture render paths.

---

## Sprint 3 — A/B verify + distill

**Scope**: measure the A/B PerfReadout numbers, write the cycle's RESULTS doc
and the Stage-5 distillation per the build doc's pacing.

**Files created**: 3 docs + 1 cycle marker = no source code

| Task | Files | AC |
|---|---|---|
| S3-T1 | Capture PerfReadout values: navigate to `/battle-v2/vfx-lab`, enable `config.debugPerf`. Record (FPS, draw calls, triangles, useFrame count if available) with `config.useInstancedLeaves: false`. Toggle to `true` without other changes. Record again. | numbers recorded in S3-T2 file |
| S3-T2 | `grimoires/loa/cycles/engine-substrate-2026-05-17/RESULTS.md` — table with OFF vs ON values + delta, includes commit hashes from S1+S2, plus a static-frame screenshot pair if practical (in `RESULTS-assets/` if added). | file exists; convergence target met (≥10× draw-call drop confirmed; FPS unchanged or better; visual parity acknowledged) |
| S3-T3 | `grimoires/loa/distillations/session-16-ecs-substrate-proof-2026-05-17.md` — Stage 5 distillation per build doc: (a) what we learned about columnar ECS in OUR substrate (validating Table-over-Sparse against scene reality), (b) shape chosen + empirical justification (the fixture-table empirical analysis), (c) proof numbers (links to RESULTS.md), (d) explicit list of deferred items per PRD steps 5/6/7/8/9 + Bush internal refactor + custom outline shader, (e) open questions for next pair-point (e.g., when does a Sparse archetype appear in the engine roadmap?). | file exists; ≥1 explicit deferred item per PRD step; links to RESULTS.md |
| S3-T4 | `grimoires/loa/cycles/engine-substrate-2026-05-17/CYCLE-COMPLETED.md` — marker with shipped commits (S1, S2 from this cycle), LOC delta, proof status (PROVEN / PARTIAL / NOT-MET), references to RESULTS + distillation. | file exists; references S1+S2 commit shas |

**Sprint 3 exit criteria**: distillation written, results captured, cycle
marked complete. Convergence target evaluated honestly (PROVEN / PARTIAL /
NOT-MET).

---

## Acceptance criteria for the whole cycle

| # | Criterion | Verification |
|---|---|---|
| AC-1 | All hex-plot leaves render through ONE `<InstancedMesh>` when `useInstancedLeaves` is ON | Three.js scene introspection in PerfReadout shows `InstancedMesh` count = 1 for leaves |
| AC-2 | Single `useFrame` updates all leaves | `app/battle-v2/_components/vfx/effects/InstancedLeafField.tsx` mounts exactly one `useFrame`; per-fixture LeafPuff `useFrame`s skipped when `suppressLeaves` true |
| AC-3 | Draw call count drops ≥ 10× from OFF to ON | PerfReadout numbers in RESULTS.md |
| AC-4 | FPS unchanged or better when ON vs OFF at idle | PerfReadout numbers in RESULTS.md |
| AC-5 | Visual parity at static frame (modulo documented outline regression) | Manual A/B in PostPane; screenshot pair in RESULTS.md if practical |
| AC-6 | Per-fixture render paths still work with `useInstancedLeaves` OFF | Toggle OFF behaves indistinguishably from current main |

## What NOT to build (Barth)

- NO `RenderPlugin` port abstraction (PRD step 5 — different cycle)
- NO `PhysicsPlugin` port (PRD step 7)
- NO event-bus / oracle ingestion (PRD steps 6 + 9)
- NO migration of grass / rocks / macro-foliage to ECS — only LEAVES across hex-plot fixtures this cycle
- NO multi-archetype scheduler — single sway-system function called from one useFrame is the proof
- NO `@effect/schema`-derived buffer layouts — deferred until 2+ archetypes exist
- NO Bush internal sub-puff refactor — Bush stays as-is this cycle
- NO custom instanced-outline shader — accept ink-outline regression on leaves, document
- NO deletion of LeafPuff.tsx, Tree.tsx, Bush.tsx, Mushroom.tsx, Wildflower.tsx, Rock.tsx — alternate path only

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| leafExtractors math drifts from Tree.tsx render → visual parity breaks | medium | S2-T2 snapshot test pins extractor output; manual A/B catches drift |
| InstancedMesh + meshToonMaterial doesn't compose at instance scale | low | Rain.tsx already proves the combo works; matching its material setup |
| Outline regression on leaves is visually significant (not just small leaves) | medium | Document in RESULTS; if too noticeable, S3 distill names "custom instanced-outline shader" as the next session's first task |
| /run sprint-plan branch creation collides with feat/ecs-leaves-2026-05-17 (already on this branch) | low | If /run wants a fresh branch, it'll suffix the timestamp; that's fine |

## Provenance

- Build doc: `grimoires/loa/specs/enhance-columnar-ecs-teaching-session.md` (the kickoff)
- PRD source: `grimoires/loa/specs/enhance-substrate-perf-and-engine.md`
- Columnar dig: `grimoires/k-hole/research-output/dig-2026-05-17-columnar-ecs.md`
- three.quarks dig: `grimoires/k-hole/research-output/dig-2026-05-17-three-quarks-vfx.md`
- Operator pair-points (from session transcript 2026-05-17):
  - Stage 1 grounded with operator-confirmed framing: hybrid Table+Sparse decision per fixture kind; "fixture" is the codebase term
  - Path B chosen over full /simstim and direct-stages alternatives
  - Sprint shape approved as drafted; commit + dispatch /run sprint-plan immediately
