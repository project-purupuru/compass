---
session: 17
date: 2026-05-17
type: kickoff-build-doc
topic: per-zone-elemental-vfx-wood-water-cluster
status: ready
mode: FEEL (ARTISAN) + ARCH (OSTROM) + iterative VFX pacing (k-hole as teacher when needed)
operator_locked_decisions:
  ecs_substrate: DEFERRED (session 16) — 120fps + 1 draw call baseline = no perf budget breach yet
  zone_shape: cluster of 3-7 hexes per element
  cycle_scope: wood + water (canonical cycle-1 matchup)
  visual_register: same cel-toon, color-shifted per element
  wood_signature: leaves swirling + canopy sway + pollen motes (ambient)
  water_signature: rain + mist + ripples (ambient)
  trigger_model: ambient always-on + intensified on card play (two-layer)
  element_interaction: visually adjacent only (defer clash mechanics)
  route_topology: extend /battle-v2/vfx-lab with new "zone-scene" effect
convergence_target: "/battle-v2/vfx-lab gets a zone-scene effect that mounts ONE wood cluster (3-7 hexes) adjacent to ONE water cluster (3-7 hexes), each playing its element's ambient VFX continuously, with a tweakpane trigger to RAMP the weather (heavier leaves on wood; downpour on water). All ambient effects performant + character readability preserved. After 3-4 iterations without landing → reset, target was wrong."
depends_on:
  - grimoires/loa/specs/enhance-substrate-perf-and-engine.md (PRD — substrate context, but DON'T execute the ECS portions)
  - grimoires/k-hole/research-output/dig-2026-05-17-three-quarks-vfx.md (verdict: bespoke per-primitive, not three.quarks)
  - existing /battle-v2/vfx-lab "hex-scene" effect (foundation we extend)
  - existing app/battle-v2/_components/vfx/effects/Rain.tsx (Lane 2 reference impl — single InstancedMesh + single useFrame pattern)
run_id: TBD-on-session-start
---

# Session 17 — Zone-Scene · Wood + Water Cluster

> Per-zone elemental environments. Cycle-1 canonical matchup (wood vs water).
> Operator pivot from over-engineering substrate to FORWARD-MOVING gameplay
> environments. Same cel-toon register; element shifts hue + ambient VFX.

## Pre-flight reading (in this order)

| # | Path | Why |
|---|------|-----|
| 1 | `app/battle-v2/_components/vfx/effects/Rain.tsx` | The Lane 2 reference primitive. Pattern to replicate for all new ambient effects: single InstancedMesh, single useFrame, hex-tile-confined. |
| 2 | `app/battle-v2/_components/vfx/effects/HexScene.tsx` | The hex-scene composer we extend. Note its biome-decorator substrate (biome.ts + decorator.ts) — zones BUILD ON that. |
| 3 | `lib/hex/biome.ts` + `lib/hex/decorator.ts` | The procedural substrate. Zones reuse biomes per-tile; the zone is a CLUSTER of biome-tagged plots. |
| 4 | `app/battle-v2/_components/vfx/effects/HexPlot.tsx` | Per-tile renderer. Zones don't change this; they just compose more of them. |
| 5 | `grimoires/loa/specs/enhance-substrate-perf-and-engine.md` | Context (PRD), NOT to-do. We're NOT building the ECS substrate this session. |
| 6 | `grimoires/k-hole/research-output/dig-2026-05-17-three-quarks-vfx.md` | Verdict: bespoke per-primitive. Every new VFX in this session follows that recipe. |
| 7 | `grimoires/loa/context/10-game-pitch.md` | The canonical pitch. Wood vs water is cycle-1; the elemental opposition framing comes from here. |

## What this session builds

### NEW substrate (small)

```
lib/hex/zone.ts                  — Zone primitive: id + element + coords[] + ambient/trigger state
lib/hex/zone-layouts.ts          — Canonical cluster shapes (3-hex, 5-hex, 7-hex constellations)
```

### NEW VFX primitives (4 new + 1 existing)

```
app/battle-v2/_components/vfx/effects/
├─ Rain.tsx               (exists) — water TRIGGERED layer
├─ LeafSwirl.tsx          NEW     — wood AMBIENT: drifting leaves (instanced quads with leaf-tip puff color)
├─ PollenMotes.tsx        NEW     — wood AMBIENT: small gold/honey motes drifting upward
├─ Mist.tsx               NEW     — water AMBIENT: low fog hugging tile surface (semi-transparent plane sheets)
├─ RippleField.tsx        NEW     — water AMBIENT: soft surface ripples scattered over water plot caps
└─ ZoneScene.tsx          NEW     — composer: mounts wood cluster + water cluster + their ambient VFX + trigger button
```

### NEW effect entry in VfxRegistry

`zone-scene` joins `hex-scene` / `mini-scene` / `tree-fall` / `water-splash`. Default biomes per cluster auto-assigned (wood cluster = 3 grass-meadows + 2 glades; water cluster = 3 wetlands + 1 grass + 1 sand-shore).

## Operator-locked specs

### Zone shape

A `Zone` is a CLUSTER of 3–7 contiguous hex coordinates plus an element id + state.

```ts
interface Zone {
  id: string;                  // "wood-grove-alpha"
  element: "wood" | "water";   // (cycle-1 scope; others later)
  coords: readonly HexCoord[]; // 3-7 contiguous hexes
  ambient: AmbientState;       // baseline always-on VFX layer
  trigger: TriggerState | null; // ramped weather (active when set)
}
```

### Two-layer trigger model

- **Ambient (always-on)**: low-intensity continuous effect. Wood = slow drifting leaves + sway + faint pollen. Water = light mist + occasional ripples. Reads as "this zone is alive."
- **Trigger (ramped)**: card-play or operator-trigger ramps the ambient to intensified weather. Wood ambient → wood STORM (heavier leaves blowing, branches swaying harder). Water ambient → DOWNPOUR (rain density up, mist swirling).

For session 17 lab: tweakpane button TRIGGER ramps each zone independently. Card-play wiring is a future-session topic.

### Visual register per element (color-shifted)

Same cel-toon material everywhere. Element shifts hue band:

| Element | Foliage band | Mist/particle band | Ground band |
|---|---|---|---|
| Wood | canopyGreen / canopyAutumn | honey (motes) | grass / grassDark |
| Water | (n/a) | sea / seaDeep / foam-white | sand / wet-grass |

Reuse `pickFlavorHue(flavor, seed)` and the PALETTE table; introduce NO new colors this session.

### Cluster layouts

Three canonical shapes available in `lib/hex/zone-layouts.ts`:

- **Triangle** (3 hexes): center + 2 adjacent. Smallest viable zone.
- **Hexring** (6 hexes): hexRing radius 1. A center surrounded by 1-ring (use `hexRing({q:0,r:0}, 1)` from existing iter.ts).
- **Star** (7 hexes): center + full ring. Largest cluster.

For the wood+water demo: TWO triangles or TWO hexrings side-by-side (wood cluster + water cluster). Operator-pin defaults to **5-hex per zone** (center + ring of 4 chosen for a roughly elemental "patch").

## What NOT to build (Barth)

- NO ECS substrate work — deferred per pushback validation
- NO renderer plugin port — same as ECS, deferred
- NO physics integration — same, deferred
- NO element CLASH mechanics — visually adjacent only (operator-locked)
- NO card-play wiring this session — tweakpane button trigger is enough for the lab
- NO new colors / hues — reuse existing palette
- NO multi-character actor system — character placement stays as current (1 wood bear)
- NO sound/audio this session — operator named sound as "after that"
- NO 3rd-5th element (fire / earth / metal) — wood+water this cycle

## Stage-by-stage (loose; iterative-pacing)

The substrate-PRD step-by-step is for substrate sessions. This is iterative VFX — looser pacing, more "build and see how it feels":

### Stage A — Substrate sketch (~30 min)

Build the Zone primitive + 1 cluster layout. Mount an EMPTY zone in the lab. No VFX yet. Validates the composition shape works.

### Stage B — Wood ambient (~60 min)

Ship `LeafSwirl.tsx` + `PollenMotes.tsx`. Both follow Rain.tsx's pattern (single InstancedMesh, single useFrame, hex-confined). Mount on a wood cluster. Iterate visual feel in tweakpane until it reads as a wood zone.

### Stage C — Water ambient (~60 min)

Ship `Mist.tsx` + `RippleField.tsx`. Same pattern. Mount on a water cluster. Iterate.

### Stage D — Trigger layer (~45 min)

Wire each ambient primitive with an `intensity` knob (0..1). Add a trigger button per zone that ramps `intensity` to 1.0 over 1.5s, then decays back to baseline over 4s. Watch how the zone "responds" when triggered.

### Stage E — Composition (~45 min)

`ZoneScene.tsx` mounts WOOD CLUSTER + WATER CLUSTER side-by-side. Add to VfxRegistry as the `zone-scene` effect. Operator selects it from the lab picker. Two trigger buttons (one per zone).

### Stage F — Distill (~30 min)

Write `grimoires/loa/distillations/session-17-zone-scene-2026-05-17.md` documenting the per-element signatures, the trigger model, and what to port to /battle-v2 next.

## Design rules (Alexander)

- **Cel-coherence first**: every new particle must read in the existing 3-band toon register. Use `DEFAULT_TOON_GRADIENT`. No new materials.
- **Hex-tile confinement**: every primitive accepts a list of `HexCoord` and stays inside their inradii. Effects shouldn't bleed across zones (operator: "visually adjacent only").
- **Character readability**: ambient effects must NOT obscure the bear character. Particle density tuned for "alive but never busy." If you can't see the bear, you've overdone it.
- **Performance budget**: each new primitive must hold 60fps on M4 with ~1500 particles. Pattern is single InstancedMesh + single useFrame; that should easily clear the budget per Rain's proof.
- **Per-element flavor in vocab module**: extend `celVocab.ts` with `pickElementHue("wood"|"water", seed)` if needed, but reuse existing palette tables.

## Verify

When `zone-scene` effect selected in lab picker:
- ZoneScene mounts visibly: TWO clusters (wood left, water right) of 5 hexes each
- Wood cluster shows: drifting leaves (slow), tree canopy sway, faint pollen motes rising
- Water cluster shows: low mist hugging the surface, soft ripples on water tiles
- BOTH ambient layers run continuously, never stop
- TRIGGER button on wood → leaves intensify (more drift speed + count), pollen denser
- TRIGGER button on water → rain falls heavier, mist swirls, ripples multiply
- Both intensity ramps DECAY back to baseline over ~4s
- FPS holds 60+ on M4 (use PerfReadout)
- DRAW calls stay reasonable (target ≤ 40 with both clusters + all VFX)

## Open creative questions (operator pair-point at session start)

1. **Cluster shape pin**: 3-hex triangle vs 5-hex star vs 6-hex hexring? Demo with 5-hex unless operator overrides.
2. **Leaf colors for wood ambient**: pull from `canopyGreen` only OR mix in `canopyAutumn` (~30% seasonal accent)?
3. **Pollen density**: subtle (10-20 motes/zone) or noticeable (50+ motes)?
4. **Mist opacity**: thin haze vs visible cloud-bank?
5. **Trigger ramp curve**: linear-up-exponential-down OR symmetric S-curve?
6. **Where to place clusters in the scene** — center, offset, or operator-pannable?

## Why this matters (recap of why we pivoted from ECS)

The operator's 120fps + 1 draw call observation = the perf substrate work was solving a non-problem. The REAL movement is:
1. Each element gets a distinctive feel (visual + ambient + triggered)
2. Composing zones into scenes lets us "see how it starts to look in the actual game" (operator's stated loop)
3. The two-layer trigger model lays groundwork for card-play integration (later session)
4. Bespoke per-primitive VFX (per three.quarks dig) keeps us cel-coherent without a heavy lib

If a real perf problem surfaces (measured, not guessed), the deferred ECS session-16 doc is ready to fire.

## Substrate strengthening (the silent layer)

The operator framed: "strengthen VFX/environment substrate as we go." Each primitive in this session ADDS to the bespoke-VFX library that future cycles (fire/earth/metal/full-game) will draw from. By session end:
- Wood: LeafSwirl, PollenMotes, (existing) Tree-with-sway
- Water: Mist, RippleField, (existing) Rain, WaterSurface

Future cycles compose the same primitives + add: Embers/HeatShimmer (fire), Dust/QuakeChunks (earth), Sparks/Chimes (metal). All same recipe.

## Key references

| Topic | Path |
|---|---|
| This build doc | `grimoires/loa/specs/enhance-zone-scene-elemental-vfx.md` |
| Deferred ECS PRD (context) | `grimoires/loa/specs/enhance-substrate-perf-and-engine.md` |
| Deferred ECS kickoff | `grimoires/loa/specs/enhance-columnar-ecs-teaching-session.md` |
| Rain reference impl | `app/battle-v2/_components/vfx/effects/Rain.tsx` |
| Hex scene composer | `app/battle-v2/_components/vfx/effects/HexScene.tsx` |
| Biome substrate | `lib/hex/biome.ts` + `lib/hex/decorator.ts` |
| Cel vocab | `app/battle-v2/_components/vfx/celVocab.ts` |
| Three.quarks dig (why bespoke) | `grimoires/k-hole/research-output/dig-2026-05-17-three-quarks-vfx.md` |
| Game pitch (wood-water canon) | `grimoires/loa/context/10-game-pitch.md` |

## Pushback invitation

- If a primitive feels "off" in the lab — STOP and iterate the visual before adding the next one. Don't ship 4 mediocre primitives + a polish pass; ship 2 great ones and let the operator pair-point on whether to continue.
- If FPS dips below 60 on M4 with both clusters running — STOP and profile before adding more particles. The Rain pattern proved we can have 800+ instanced particles at 1 draw call; if we're not getting that, something's wrong with our impl, not the approach.
- If the wood and water clusters start to feel SAMEY (same shape, just different color) — that's a signal the AMBIENT layer is too quiet. Ramp it up.
- If the trigger ramp feels too aggressive — slow the ramp-up to 2.5s, let the operator FEEL the weather arriving.
