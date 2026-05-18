---
session: 18
date: 2026-05-17
type: distillation
topic: hex-composition + scale-wall-discovery
status: candidate-doctrine
use_label: usable
mode: ARCH (OSTROM) + craft lens (ALEXANDER) — scale-wall hunt
load_bearing: true
operator_quote: "we should think about it like building blocks, kind of like a Minecraft block · we should see how it feels at scale"
cycle: hex-composition-scale-2026-05-17
cycle_status: PARTIAL — scale-wall measured at 625 tiles; substrate evolution earned-next named
relates_to:
  - grimoires/loa/cycles/hex-composition-scale-2026-05-17/RESULTS.md
  - grimoires/loa/distillations/session-16-ecs-substrate-proof-2026-05-17.md (predecessor)
  - lib/hex/plot.ts (extended)
  - app/battle-v2/_components/vfx/effects/BigRealmScene.tsx
  - lib/engine/ (cycle-1 substrate to extend next)
predecessor_cycle: engine-substrate-2026-05-17
---

# Session 18 — Hex Composition · Scale Wall · The Next-Cycle Naming

> Cycle `hex-composition-scale-2026-05-17`. Built on the closed
> engine-substrate cycle to take the substrate question from "does the
> SHAPE work?" (cycle 1's answer: yes, at 7 plots) to "where does the
> SCALE matter?" (this cycle's answer: 625 tiles, 32fps, 10,257
> geometries — and we now know exactly what to ECS-ize next).

---

## The two-cycle arc

```
cycle 1 · engine-substrate-2026-05-17
  └─ proved the SHAPE: Archetype<TCols> + System + InstancedMesh +
     useFrame pattern works for ONE archetype (leaves)
  └─ PARTIAL close: substrate proven; renderer integration partial
     (vertexColors+meshToonMaterial+InstanceColor shader-chunk gap);
     scale-benefit unverified at 7-plot scale

cycle 2 · hex-composition-scale-2026-05-17  (this cycle)
  └─ proved the SCALE NEED: 625 tiles × ~16 geo/tile = 10,257 GEO at
     32fps on M4. The substrate's value emerges HERE, not at 7 plots.
  └─ PARTIAL close: scale-wall measured; ambient-VFX scale unmeasured;
     fixture-ECS-instancing named as the next earned evolution
```

The two cycles together give the framework engineer a complete answer
to "should we build this substrate?" — YES at composition scale, with
specific numbers for "where the wall is now" and "what's the next
substrate evolution that earns its keep."

---

## Substrate layer

### PlotT extension (already landed)

`lib/hex/plot.ts` gains two optional fields:

```ts
element?: ElementIdT          // wuxing affinity per tile
ambientBindings?: ElementIdT[] // which element-ambient pools this
                               // tile contributes to (default consumer-
                               // side: `[element]` when undefined)
```

Both additive; all existing PlotT consumers unaffected. Schema decode
tested in `lib/hex/plot.test.ts` (5 cases).

The composition substrate is now:

```
PlotT (lib/hex/plot.ts)
  ├─ coord, terrain, elevation, fixtures, edges  (original — what a hex IS)
  ├─ element                                      (new — wuxing affinity)
  └─ ambientBindings                              (new — ambient-pool membership)

Zone (lib/hex/zone.ts)         (from session-17 handoff)
  └─ { id, element, coords[] } — pure group data

[no new "Realm" or "World" substrate yet]  — premature; defer until needed
```

### What the substrate's runtime evolution will look like (next cycle)

Currently, each fixture in `HexPlot.tsx` renders as its own React
component:

```
Tree.tsx        → trunk mesh + 4 branch meshes + 4 LeafPuffs (with outlines)
Bush.tsx        → 4-6 sub-puffs + outlines
Mushroom.tsx    → stem + cap LeafPuff + outlines
Wildflower.tsx  → stem + bloom LeafPuff + outlines
Rock.tsx        → primary + 1-2 chunks + optional moss LeafPuff + outlines
```

At 625 tiles × ~16 geometries/tile, this hits the 10,257 GEO wall.

The next earned substrate evolution: lift each fixture-kind into its
own ECS archetype + InstancedMesh:

```
TreeArchetype       columns: { worldMatrix, color, swayParams }
BushArchetype       columns: { worldMatrix, color, sub-puff offsets }
RockArchetype       columns: { worldMatrix, hue, chunk offsets }
MushroomArchetype   columns: { stemMatrix, capMatrix, color, sway }
WildflowerArchetype columns: { stemMatrix, bloomMatrix, color, sway }

Renderer: 5 InstancedMesh layers, one per archetype, each fed all
fixtures of that kind across the whole grid.

Expected scale reduction:
  10,257 GEO  →  ~10-30 GEO (5 archetypes × 1-6 instanced meshes each)
  FPS at 625  →  60+ (within budget)
```

This is exactly what the cycle-1 leaf-proof prototyped at small scale.
The pattern is proven; the application is the next cycle's work.

**Dependency**: the cycle-1 BLACK-leaves bug (vertexColors +
meshToonMaterial + InstanceColor shader-chunk gap) MUST be fixed first.
Without it, InstancedMesh-rendered fixtures will render black, defeating
the visual parity goal.

---

## Application layer (BigRealmScene)

### What composes here

```
BigRealmScene  (N×N hex grid composer)
  ├─ grid          buildHexGrid(cols, rows) → axial coords
  ├─ assignment    voronoiAssign(coords, hexSize, seed) → element per tile
  ├─ plot build    decoratePlot({worldSeed, coord, hexSize, biome}) per tile
  ├─ render        HexPlot per plot (uses existing fixture components)
  ├─ ambients      SharedAmbientForElement per element (one InstancedMesh
  │                  per element fed all matching tiles — the "ambient
  │                  bindings" pool model)
  ├─ walkers       N PuruhaniWalker billboards (per-walker useFrame —
  │                  cycle-1 deferral, still standing)
  └─ atmosphere    time-of-day-driven sky/fog/lights
```

### Element → biome mapping (canon-aligned, not final canon)

```
wood   → glade
water  → wetland
fire   → rocky-clearing   (no fire-specific biome yet; closest hot association)
earth  → meadow
metal  → shrine-yard
```

When canon evolves (e.g., a `volcanic` or `forge` biome lands in
`lib/hex/biome.ts`), update the mapping. The codex
(`.claude/constructs/packs/purupuru-codex/`) is the canonical source for
which biome a Tsuheji-world location actually wears.

---

## Process layer (what the cycle taught about the gates)

### Adversarial dissent kept earning its keep

This cycle: 2 review-cycle findings:
1. **BLOCKING (S2 review)** — spec-drift: sprint.md called for
   `elementDistribution` + `monumentEveryN` knobs; operator's pair-point
   collapsed those into "voronoi-only" + "center-of-mass monuments." The
   runtime code matched operator intent; the sprint.md was stale. The
   dissenter is doing its job at sprint-vs-implementation parity, not
   just at code-correctness.
2. **ADVISORY (S1 review)** — JSDoc semantics: `ambientBindings`
   documented a default that wasn't actually implemented. Fixed in cycle.

Net: cycle-1 caught 2 BLOCKING runtime bugs (stale-data leak,
vertexColors miss). Cycle-2 caught 1 BLOCKING spec-drift + 1 ADVISORY
JSDoc accuracy. Both kinds of bugs cost the same in operator pain when
they surface late; both kinds are worth catching early.

### Operator-cycle bugs (the GL/runtime gate)

Two surfaced in this cycle's lab handoff:

1. **"No matching controller for 'gridCols'"** — vfx-lab/page.tsx's
   per-effect ref pattern had no branch for "big-realm-scene"; active
   config fell through to realm-scene which doesn't have gridCols. Fix:
   add the lab plumbing (6 edits per new effect). Substrate-shape
   candidate for future cycle: VFX_REGISTRY-driven dispatch instead of
   hardcoded conditional chains in the lab page.
2. **"No matching controller for 'showTileContent'"** — same class but
   different cause: HMR preserves useRef across hot-reloads. New schema
   fields added in the same dev session don't make it into the existing
   ref. Tactical fix: backfill defaults at registerKnobs time. Strategic
   fix (deferred): rethink the per-effect ref pattern so schema
   evolution doesn't require hard refreshes.

Both bugs were caught by the operator in the lab, not by code review.
Same doctrine candidate as cycle-1's BLACK-leaves: **GL/runtime gates
catch what shader-chunk gates and HMR-stale-ref gates can't.**

---

## Taste layer

- **Voronoi clustering looks like a real world.** Operator visual
  judgment: "looks pretty nice." Element clusters are visibly multi-
  hex, biome variety is rich, fixture scatter feels organic. The
  Minecraft-block-style composition vision lands.
- **Lag is perceptible at max scale even before the FPS counter
  confirms it.** Operator framed it: "very, very laggy when we go up to
  like maximum rows and maximum columns." Frame time 31.3ms = ~17ms
  over the 60fps budget. The perceptual signal arrives before the
  numerical one.
- **The substrate question becomes urgent at scale.** At small N, "do
  we need ECS-ization?" is theoretical. At 625 tiles, it's "this is
  unshippable until we do." The cycle moved the question from optional
  to load-bearing.

---

## What's deferred (next-cycle backlog)

### Substrate
- **TreeArchetype + BushArchetype + RockArchetype + MushroomArchetype +
  WildflowerArchetype** — ECS-ize each fixture kind across the whole
  grid. Cycle-3 backbone.
- **vertexColors + meshToonMaterial fix** — required before any
  InstancedMesh-rendered fixture can land with per-instance flavor
  variance. Four fix paths named in cycle-1 distillation (favor
  meshLambertMaterial swap or custom shader).
- **VFX_REGISTRY-driven lab dispatch** — replace per-effect refs +
  hardcoded conditional chains in `app/battle-v2/vfx-lab/page.tsx` with
  a registry-walked dispatch. Substrate-shape improvement; not blocking.
- **Walker ECS-ization** — handoff named it. At default count=5 the
  walkers aren't a measurable bottleneck; at walkerCount=50+ they
  probably will be. ECS-ize when scale demands.

### Application
- **Ambient-VFX-at-scale measurement** — same 625 tiles, showAmbients
  ON. Capture the additional perf cost.
- **LOD strategy** — distance-based ambient intensity falloff and/or
  fixture culling. Standard solution for open-world scale.
- **Biome diversity per element** — currently 1 biome per element.
  Some elements probably want 2-3 biome variants (different woods:
  glade vs meadow-with-tree-edge; different waters: pure water vs marsh).

### Measurement
- **PerfReadout DRAW/TRIS encoding** — flagged in cycle-1; still showing
  "1" at 10,257 GEO at 32 FPS. The display is encoding thousands
  somehow. Investigate the component.

---

## Open questions for next session pair-point

1. **Next cycle: fixture-ECS-instancing vs ambient-instancing vs walker
   ECS — which axis first?** My read: fixtures earn first (10,257 geo is
   the dominant signal); ambients second; walkers last. But operator's
   visual priorities may say otherwise.
2. **vertexColors+meshToonMaterial fix path** — operator's call from
   cycle-1's four options. Recommend meshLambertMaterial swap (smallest
   visual regression for biggest correctness win).
3. **When does the lab need a substrate refactor?** The VFX_REGISTRY +
   per-effect-ref pattern has now leaked twice. Next time it leaks,
   refactor.
4. **Ambient-shared-instances at scale** — currently one InstancedMesh
   per element. At 25 wood tiles vs 125 wood tiles, the same primitive
   handles both — but is that the right model? Should InstancedMesh
   per-element auto-LOD by distance from camera?

---

## Anti-patterns to avoid (next cycle)

- ❌ **Pre-build ECS archetypes for things that don't bottleneck.** The
  walker ECS-ization is tempting but at default count=5 it doesn't
  earn. Measure-then-archetype, not archetype-then-pray.
- ❌ **Treat the lab page as substrate-stable code.** It's
  operator-controlled in-flight scaffolding; new VFX effects need 6 +
  edits to page.tsx until the dispatch gets registry-driven.
- ❌ **Skip the operator-driven GL gate.** Code review caught most
  bugs cycles 1 and 2; the BLACK-leaves bug, the gridCols lab bug,
  and the HMR-stale-ref bug all required live browser observation
  to surface.
- ❌ **Set the convergence target before measuring.** Cycle-1's "≥10×
  draw-call drop" target was met by neither cycle because DRAW=1 in
  both — the perf readout doesn't measure what we thought it did. Use
  GEO + visual judgment until the readout's display encoding is fixed.

---

## References

- Cycle dir: `grimoires/loa/cycles/hex-composition-scale-2026-05-17/`
- Results: `grimoires/loa/cycles/hex-composition-scale-2026-05-17/RESULTS.md`
- Predecessor cycle: `engine-substrate-2026-05-17` (cycle-1, PARTIAL close)
- Predecessor distillation: `grimoires/loa/distillations/session-16-ecs-substrate-proof-2026-05-17.md`
- Sprint plan: `grimoires/loa/sprint.md`
- PRD lineage: `grimoires/loa/specs/enhance-substrate-perf-and-engine.md` (parent — describes the engine substrate roadmap; cycles 1+2 land steps 1-2; next cycle is step 3+: fixture instancing across composition)
- Build doc for cycle-1 (substrate proof): `grimoires/loa/specs/enhance-columnar-ecs-teaching-session.md`
- Session-17 handoff (wuxing + zone + ambient primitives): operator-untracked working tree, cited in sprint.md

## Provenance

- Session 18, 2026-05-17
- Operator: zksoju
- Run ID: `2026-05-17-hex-comp`
- Branch: `feat/ecs-leaves-2026-05-17` (continued from cycle-1)
- Cycle: `hex-composition-scale-2026-05-17`
- Operator pacing: kaironic + teaching, same as cycle-1
- Pair-points: cycle frame selection, S2 element-distribution + walker scope, S2 lab-dispatch fix, S2 HMR-ref fix, S3 close-as-PARTIAL
