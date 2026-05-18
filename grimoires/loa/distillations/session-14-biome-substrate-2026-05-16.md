---
session: 14
date: 2026-05-16
type: distillation
topic: biome-decorator-substrate
status: candidate-doctrine
use_label: background_only
mode: ARCH + craft lens
load_bearing: true
operator_quote: "set up boundaries and constraints for our game engine so that procedural generation is clean. the best experts to study from this WRT to seeding is Minecraft and i think we want to lay down the substrate for that. This is load bearing"
relates_to:
  - lib/hex/biome.ts
  - lib/hex/decorator.ts
  - lib/hex/plot.ts
  - app/battle-v2/_components/vfx/effects/HexScene.tsx
---

# Session 14 — Biome / Decorator Substrate

> **Operator-marked LOAD-BEARING.** The shift from hand-coded plot fixtures
> (one factory per plot kind in HexScene) to a declarative biome + decorator
> rule system with collision-aware placement. Same contract Minecraft uses:
> world seed + chunk coord → deterministic content, every time.

## The shift

```
BEFORE                                  AFTER
─────────────                           ─────────────
HexScene.tsx                            HexScene.tsx
  makeCenterPlot()  ← hand-coded          loop coords:
  makeAutumnPlot()  ← hand-coded            biomeId = mapping[coord]
  makeStonePlot()   ← hand-coded            decoratePlot({ seed, biome, hex }) ←
  makeGrassyPlot()  ← hand-coded                  ↑
  ...                                       BIOMES[id] · DecoratorRule[]
                                          + collision-aware placement
                                          + permeability rules
                                          + seed mixing
```

## Why it's load-bearing

1. **DETERMINISM** — same world seed → same fixtures, always. Two players opening the same hex see the same trees in the same positions. Foundation for shareable worlds, procedural quests, gameplay invariants.

2. **CONSTRAINTS** — fixtures can no longer randomly clip into each other. The placement engine reserves spatial disks per priority tier; lower-priority decorators reject candidates that collide unless explicitly permeable.

3. **COMPOSABILITY** — adding a new biome is a Biome literal, not code. Adding "deep-forest" or "stone-quarry" requires zero engine changes.

4. **GAMEPLAY READINESS** — biome rules can extend to gameplay (path-finding cost per terrain, ambient encounters per biome, resource yields). The substrate is general; this session uses it for VFX placement, future sessions plug other systems in.

## Substrate components

| Module | Role |
|---|---|
| `lib/hex/biome.ts` | `BiomeT` schema + `DecoratorRuleT` schema + `BIOMES` registry (meadow / glade / rocky-clearing / wetland / shrine-yard / void) |
| `lib/hex/decorator.ts` | `decoratePlot({ worldSeed, coord, hexSize, biome }) → FixtureRefT[]` — the placement engine |
| `lib/hex/plot.ts` (existing) | `FixtureRefT` shape — the output of decoration |
| `app/battle-v2/_components/vfx/effects/HexScene.tsx` | Thin caller — `RING_1_BIOMES` mapping + `decoratePlot` loop |

## Decorator rule semantics

```ts
{
  kind: FixtureKind,         // tree | bush | rock | mushroom | ...
  countRange: [min, max],    // how many to place per plot
  scaleRange: [min, max],    // scale as fraction of hexSize
  variants?: string[],       // pick one uniformly per placement
  radius: number,            // collision claim (fraction of hexSize)
  priority: number,          // higher = placed first
  placement: "center" | "edge" | "anywhere" | "rim",
  permeableWith?: FixtureKind[],  // kinds we can overlap with
  maxAttempts?: number,            // retries before skipping (default 12)
}
```

## Placement algorithm (Poisson-disc per priority tier)

```
for each rule (priority desc):
  count = seeded-roll(rule.countRange)
  for i in 0..count:
    for attempt in 0..maxAttempts:
      pos = polar-sample(placement, hexSize, rand)
      if NOT collides(pos, placed, rule.permeableWith):
        place fixture
        register disk
        break
    else:
      skip this slot (field too crowded — constraint working)
```

## Seed semantics (Minecraft contract)

```
fixtureSeed = mix(worldSeed, coord.q, coord.r, kindSalt, slotIndex)
```

Separate streams per `kindSalt` mean adding a new decorator kind doesn't disturb the seeds of existing placements. New kinds only consume new bytes of entropy.

## Canonical biomes (initial set)

| Biome | Terrain | Character | Trees | Bushes | Rocks | Ambient |
|---|---|---|---|---|---|---|
| `meadow` | grass | 1 wood-bear (center) | 1-2 green (edge) | 2-4 (anywhere) | 1-2 small (edge) | 1-3 wildflowers, 0-2 mushrooms |
| `glade` | grass | — | 1-2 autumn (edge) | 1-3 autumn (anywhere) | 0-1 small (edge) | 2-4 honey wildflowers, 1-3 mushrooms |
| `rocky-clearing` | stone | — | — | — | 2-3 boulders + 3-5 pebbles | 0-2 moss mushrooms, 0-1 fallen-log |
| `wetland` | water | — | — | — | — | — (the toon foam ring carries the read) |
| `shrine-yard` | shrine | — | — | — | — | 1 structure (center) |
| `void` | empty | — | — | — | — | — |

## Operator UI (Minecraft-style)

Lab gets a `world` folder at the top of the hex-scene KnobPane:

- **seed** — current world seed (hex display)
- **reroll world ↻** — randomizes seed (every plot re-rolls deterministically)

This is the operator-facing surface of the seed contract. Same UX as a Minecraft world seed input.

## Open threads

- **Per-plot elevation variation** — currently elevations are fixed per terrain (grass 0, stone 0.08, shrine 0.18, water -0.06). Operator hint about "different heights" suggests adding seeded jitter per plot. Next pass.
- **Edge transition rendering** — Plot.edges has the schema (`flat | raised | cliff | water | bridge`) but no renderer. When adjacent plots differ in elevation, no transition geo draws.
- **Biome variants** — `meadow` could split into sub-variants (sparse-grove, dense-meadow, dry-meadow) that share the meadow terrain but adjust decorator counts. Trivial to add.
- **Noise-driven biome assignment** — currently RING_1_BIOMES is a fixed direction → biome map. Production: 2D simplex noise sampled at each coord → biome from a weighted table per noise band.
- **MeshyAI** — still parked. Procedural cel-meshes still carrying weight.

## Promotion ladder

`use_label: background_only` until operator validates:
1. Reroll seed produces visibly different but coherent worlds.
2. Fixtures no longer clip into each other.
3. New biomes can be added without touching engine code.

On promotion: lands as `.claude/constructs/packs/vfx-playbook/knowledge/applied/biome-substrate.md` AND as `lib/hex/biome.ts` graduates to a stable export for sibling projects (purupuru-game, world-purupuru).

## Provenance

- Schema: `lib/hex/biome.ts` (Biome, DecoratorRule, PlacementMode, BIOMES registry)
- Engine: `lib/hex/decorator.ts` (decoratePlot, samplePosition, collides, mixSeed)
- Composition: `app/battle-v2/_components/vfx/effects/HexScene.tsx` (RING_1_BIOMES, buildPlot)
- Reference: Minecraft world generation (decorator chain, structure starts, biome carvers)
- Operator quote (2026-05-16): "this is load bearing"
