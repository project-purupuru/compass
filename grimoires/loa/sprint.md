---
status: draft-r0
type: sprint-plan
cycle: hex-composition-scale-2026-05-17
session: 18 (post-session-17 handoff)
mode: ARCH (OSTROM) + craft lens (ALEXANDER) — push scale boundaries
branch: feat/ecs-leaves-2026-05-17 (continues — see provenance below)
prd: grimoires/loa/prd.md
sdd: grimoires/loa/sdd.md
prd_source: grimoires/loa/specs/enhance-substrate-perf-and-engine.md (parent)
predecessor_cycle: engine-substrate-2026-05-17 (PARTIAL close — substrate proven, scale unverified)
predecessor_distillation: grimoires/loa/distillations/session-16-ecs-substrate-proof-2026-05-17.md
session_17_handoff: lib/wuxing/*, lib/hex/zone.ts, app/battle-v2/_components/vfx/effects/{ZoneScene,RealmScene,LeafSwirl,PollenMotes,Mist,RippleField,Embers,DustMotes,Sparks,PuruhaniWalker,ZoneMonument,ShengFlow,MusubiSilhouette,MountainRing}.tsx (all uncommitted operator in-flight)
convergence_target: "BigRealmScene composes N×N hex blocks via extended PlotT (element + ambientBindings). Scale-test at 5×5 → 10×10 → 20×20 captures perf signal that the 7-plot engine-substrate cycle couldn't surface. Numbers reveal what to ECS-ize next."
created: 2026-05-17
---

# Hex Composition + Scale Cycle

Build on the closed engine-substrate cycle. Substrate is proven; this cycle
proves the **composition shape** at the scale where it actually matters.

Operator framing (verbatim):
> "Each of these hexagon grids should be composable. We should think about
> it like building blocks, kind of like a Minecraft block. Each thing
> represents an individual section of the world, and then you can compose
> together a bunch of procedural stuff and environmental stuff together…
> we should see how it feels."

## Dependency graph

```
  S1 (PlotT extension + Zone refactor)
     │
     ▼
  S2 (BigRealmScene composer + VfxRegistry effect)
     │
     ▼
  S3 (scale-test 5×5 → 10×10 → 20×20 + distill what bottlenecks)
```

Each sprint runs implement → review (cross-model dissent) → audit (cross-
model dissent) → COMPLETED. Same gate pattern as cycle engine-substrate.

## Sprint 1 — Substrate composition primitives (~30 LOC)

Already partially landed (PlotT extension committed in this session). Tests
and Zone passthrough are the remaining work.

| Task | Files | AC |
|---|---|---|
| S1-T1 | `lib/hex/plot.ts` — DONE: `element?: ElementIdT` + `ambientBindings?: ElementIdT[]` optional fields on Plot schema | tsc passes; existing PlotT consumers unaffected (Plot was extended additively) |
| S1-T2 | `lib/hex/zone.ts` — verify Zone primitive composes cleanly with extended PlotT (no required changes; Zone already carries `element` at the group level) | no edits required; cite that this composes |
| S1-T3 | `lib/hex/plot.test.ts` (new) — assert PlotT can be constructed with and without `element` / `ambientBindings`; assert `S.Schema` validation accepts both shapes | vitest passes; ≥3 assertions |

**Sprint exit**: tsc passes; new test file green; no regression in `lib/engine` tests; PlotT consumers downstream unaffected.

## Sprint 2 — BigRealmScene composer (~120 LOC + knob registration)

| Task | Files | AC |
|---|---|---|
| S2-T1 | `app/battle-v2/_components/vfx/effects/BigRealmScene.tsx` — new effect. Takes `gridCols × gridRows` axial hex grid; assigns each cell an element via a seeded pattern (e.g. modulo cycle or Voronoi-style clustering); mounts terrain + element-glow disc per cell; mounts SHARED per-element ambients (one LeafSwirl across all `wood` cells, one Mist across all `water` cells, etc.) | tsc passes; renders an arbitrary-N hex grid with correct world positions; element distribution visibly mixed |
| S2-T2 | `app/battle-v2/_components/vfx/effects/BigRealmScene.tsx` — atmosphere driver (reuse RealmScene's pattern: time-of-day-driven sky + fog + lights) | tsc passes |
| S2-T3 | `app/battle-v2/_components/vfx/VfxConfig.ts` — add `BigRealmSceneConfig` schema (gridCols, gridRows, elementDistribution: "checker"/"voronoi"/"stripes", ambientBase, fogDensity, showWalkers, walkerCount, showMonuments, monumentEveryN, debugPerf, scatterSeed) + `BIG_REALM_SCENE_DEFAULTS` | tsc passes |
| S2-T4 | `app/battle-v2/_components/vfx/VfxRegistry.ts` — register `big-realm-scene` effect at top of picker (next to realm-scene) with all knob bindings | toggle appears in PostPane |

**Sprint exit**: `/battle-v2/vfx-lab` picker shows `big-realm-scene`. Selecting it renders an N×N hex grid with mixed elements + shared per-element ambients + atmosphere. Operator can change gridCols/gridRows live.

**Constraints (load-bearing)**:
- NEVER author 3D character/walker geometry — use PaperPuppet3D for any walker render (per session-17 doctrine memory `[[paper-puppet-aesthetic]]`)
- NEVER perimeter-ring mountains on a gameplay-facing surface (use terrain-class hexes for mountains)
- Consult `.claude/constructs/packs/purupuru-codex/` before assigning element affinity to specific landmark concepts
- Don't re-implement wuxing/zone/element primitives — import from `lib/wuxing/*` and `lib/hex/zone.ts`
- ECS-ize walkers is OUT OF SCOPE this cycle — keep them as-is; the scale test will tell us at what N they bottleneck

## Sprint 3 — Scale-test + distill

| Task | Files | AC |
|---|---|---|
| S3-T1 | Capture PerfReadout: 5×5 (25 tiles), 10×10 (100 tiles), 20×20 (400 tiles). Record FPS / FRAME / DRAW / TRIS / GEO / TEX / PROG at each scale, both with ambients ON and OFF, walkers ON and OFF | numbers exist in S3-T2 file |
| S3-T2 | `grimoires/loa/cycles/hex-composition-scale-2026-05-17/RESULTS.md` — measurement table with all scales × all toggles; visual observations at each scale | file exists; convergence target evaluated honestly |
| S3-T3 | `grimoires/loa/distillations/session-18-hex-composition-scale-2026-05-17.md` — Stage-5 distill: what bottlenecks at scale, what substrate evolution is earned next (walker ECS? shared ambient instances? LOD?), explicit deferred items | file exists |
| S3-T4 | `grimoires/loa/cycles/hex-composition-scale-2026-05-17/CYCLE-COMPLETED.md` — marker | file exists |

## What NOT to build (Barth)

- NO new ECS archetypes (walker pool stays React-side; defer until S3 numbers say so)
- NO LOD strategy (surface as deferred item in distill; defer to next cycle)
- NO ambient-instance sharing optimization beyond the simple "one InstancedMesh per element across all tiles with that binding"
- NO new VFX primitives (LeafSwirl/Mist/Embers/etc are all in session-17 substrate; reuse them)
- NO render-plugin port (PRD step 5, different cycle)
- NO mountains as a perimeter ring on the gameplay surface
- NO 3D character geometry — paper-puppet doctrine is LOCKED
- NO biome-decorator integration into BigRealmScene this cycle (HexScene's biome+decorator system stays for HexScene; BigRealmScene uses a lighter element-tinted terrain rendering until biome composition earns its keep at scale)

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| 20×20 = 400 tiles may exceed M4 perf budget without LOD | high | This is the POINT of the cycle — surface where the wall is |
| Element-ambient sharing across N tiles may have unexpected behavior (e.g. tile-confined spawn math may not generalize to a 20×20 grid's worth of `wood` tiles) | medium | Test at 5×5 first; bisect on shape if anomalies |
| Time-of-day atmosphere may overwhelm small differences at small scale | low | Defaults pin to a single phase ("morning") during measurement passes |
| Visual regression from engine-substrate's BLACK-leaves bug still unfixed | confirmed | This cycle's BigRealmScene uses element-glow discs + ambient particles, NOT InstancedLeafField. The BLACK-leaves bug is deferred and doesn't gate this work |

## Provenance

- Predecessor cycle: `engine-substrate-2026-05-17` (PARTIAL close 2026-05-17)
- PRD source: `grimoires/loa/specs/enhance-substrate-perf-and-engine.md`
- Session-17 handoff: visual substrate + Zone primitive + wuxing runtime (all uncommitted operator in-flight on this branch)
- Operator pacing: kaironic + teaching, same as last cycle
- Branch continuation: `feat/ecs-leaves-2026-05-17` (continues with new commits scoped via `feat(sprint-N-comp): …` to keep the cycle-2 lineage distinguishable from cycle-1's `feat(sprint-N): …`)
