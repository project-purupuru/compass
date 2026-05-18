---
session: 16
date: 2026-05-17
type: kickoff-teaching-build-doc
topic: columnar-ecs-substrate-deep-dive
status: DEFERRED — operator pushback validated (2026-05-17). 120fps + 1 draw call baseline = no current perf budget breach. Revisit when measured evidence demands it. Doc preserved as future-work reference.
deferred_reason: "perf substrate work is interesting but premature. M4 heat was dev-mode overhead (Next compiler + HMR + DevTools), not scene cost. Lane 2 (per-zone elemental VFX) actually moves the game; this work doesn't."
supersedes_by: session 17 — per-zone elemental VFX cluster (enhance-zone-scene-elemental-vfx.md)
mode: ARCH (OSTROM) + craft lens (ALEXANDER) + teaching pacing (k-hole-as-teacher)
pacing: kaironic + teaching, NOT speed-build
operator_intent: "learn structurally + ship one small proof point"
convergence_target: "understanding of columnar/archetype ECS + Effect-TS Layer integration + ONE working proof: all hex-scene leaves in a SINGLE InstancedMesh driven by a SINGLE useFrame loop. After 3 iterations without that proof landing → reset, target was wrong."
depends_on:
  - grimoires/loa/specs/enhance-substrate-perf-and-engine.md (the PRD — source of truth)
  - grimoires/k-hole/research-output/dig-2026-05-17-columnar-ecs.md (Lane 1 research)
  - grimoires/k-hole/research-output/dig-2026-05-17-three-quarks-vfx.md (Lane 2 research)
  - construct-effect-substrate/patterns/peer-substrates-different-shapes.md (cycle-4 doctrine)
run_id: 2026-05-17-9a4d3d
---

# Session 16 — Columnar ECS · Teach + Proof

> Lane 1 substrate work. Operator is in teaching mode — understand before
> shipping. The PRD (`enhance-substrate-perf-and-engine.md`) is the source
> of truth for the WHAT and WHY. This doc is the TEACHING PATH and the
> ONE CONCRETE PROOF the session lands.

## Operator pacing

> "I want to focus around this work. I don't have to ship everything —
> I want to understand the columnar/ECS shape, dig into how it composes
> with our Effect-TS substrate, and walk away with a working baseline."

Translated:
- ✅ Read deeply. Re-read the digs. Read Flecs/Bevy docs if needed.
- ✅ Sketch (whiteboard / scratch files OK) before committing code.
- ✅ Ship ONE small proof point that proves the pattern works in our stack.
- ❌ Do NOT execute the full 9-step sequencing in the PRD this session.
- ❌ Do NOT pre-optimize before measuring.
- ❌ Do NOT swap renderers or add Rapier this session.

## Pre-flight reading (in this order)

| # | Path | Why |
|---|------|-----|
| 1 | `grimoires/loa/specs/enhance-substrate-perf-and-engine.md` | The PRD — full problem + sequencing. Read for context, NOT to-do list. |
| 2 | `grimoires/k-hole/research-output/dig-2026-05-17-columnar-ecs.md` | The "what" of columnar ECS. Bevy Tables + EnTT Sparse Sets are the two camps; pick a side or document why we straddle. |
| 3 | `grimoires/k-hole/research-output/dig-2026-05-17-three-quarks-vfx.md` | Why we're rolling bespoke particles, not adopting three.quarks. The verdict that informs Lane 2 going forward. |
| 4 | `/Users/zksoju/Documents/GitHub/construct-effect-substrate/patterns/peer-substrates-different-shapes.md` | Cycle-4 doctrine: ECS is a peer substrate to honeycomb, not a replacement. Sets the boundary. |
| 5 | `app/battle-v2/_components/vfx/effects/LeafPuff.tsx` | The current per-leaf React-component pattern — the anti-pattern this session replaces. |
| 6 | `app/battle-v2/_components/vfx/effects/Tree.tsx` + `Bush.tsx` | The call sites for LeafPuff — the consumers we have to satisfy with the new instanced primitive. |

## The teaching arc (5 stages, kaironic-paced)

### Stage 1 — Internalize the shape (read-only, ~30 min)

Walk through the columnar dig findings out loud. The four claims to test:
1. **Archetype tables** (Bevy/Flecs) = entities with the same component shape live in the same Table → linear sweep through memory hits CPU cache lines
2. **Sparse sets** (EnTT) = sparse Entity ID → dense index → O(1) component add at the cost of slightly-less-contiguous reads
3. **Effect-TS Layer can host the raw Float32Array as an InstancedBufferAttribute** — bypassing the `THREE.Mesh` object graph entirely
4. **Update systems iterate columns, not entities** — the SQL-on-columns insight is exactly the cache-friendly pattern that makes 100k+ entities tractable

Internalize until you can explain each in your own words. Don't proceed until you can.

### Stage 2 — Sketch the smallest viable ECS (~45 min, scratch files)

In `tmp/` or a scratch file (NOT in `lib/engine/` yet — we're sketching), write the smallest archetype primitive that supports the leaf-sway use case:

```ts
// Minimum viable:
//   - Component: { Position: Float32Array, SwayPhase: Float32Array, ... }
//   - Archetype: holds one Float32Array per component, plus an entity count
//   - World: maps entityId → archetype + slot
//   - System: query an archetype + iterate the columns
```

Don't generalize. Don't add registration ceremony. Get the SHAPE right.

### Stage 3 — Validate against the leaf use case (~30 min, on paper)

Take the current leaf rendering in Tree.tsx + Bush.tsx + Mushroom.tsx + Wildflower.tsx + Rock.tsx (moss). Count:
- How many LeafPuff instances render in a default hex-scene?
- How many useFrame hooks are created across them?
- How many draw calls?

Then sketch what would happen with the new ECS shape:
- One archetype: `LeafEntity = { worldMatrix, color, swaySeed }`
- One system: `swaySystem(world, dt)` updates all worldMatrices
- One renderer: `<InstancedMesh count={N} />` reading worldMatrices

Compare counts on paper before writing code.

### Stage 4 — Ship the proof (~90 min)

Build the minimum substrate to deliver the proof:

```
lib/engine/
├─ index.ts                     — re-exports
├─ ecs/
│  ├─ archetype.ts              — Float32Array column storage
│  ├─ world.ts                  — entity allocation + archetype lookup
│  └─ system.ts                 — system signature + scheduler skeleton
└─ animation/
   └─ sway-system.ts            — single update for all swayable leaves

app/battle-v2/_components/vfx/effects/
└─ InstancedLeafField.tsx       — InstancedMesh consuming the ECS archetype
                                  + single useFrame mounting the sway system
```

The proof works when:
- All leaves across the hex-scene render via ONE `<InstancedMesh>` (single draw call for foliage)
- ONE useFrame loop applies sway to all leaves (not N)
- Perf readout shows DRAW dropping sharply + FPS unchanged or better
- Visual output indistinguishable from current (per-leaf) implementation

**Critical: do NOT delete Tree/Bush/Mushroom/Wildflower yet.** Add an alternate render path gated by a debug knob (`useInstancedLeaves`) so you can A/B side-by-side and prove the perf win.

### Stage 5 — Distill (~30 min, writing)

Write a distillation entry at `grimoires/loa/distillations/session-16-ecs-substrate-proof-2026-05-17.md`:
- What we learned about columnar ECS
- The shape we chose (archetype table vs sparse set, and why)
- The proof results (numbers: draw calls before/after, FPS before/after, useFrame count)
- What's deferred (the other 8 steps in the PRD)
- Open questions for the operator pair-point

## Build doc — the minimum substrate (~90 min)

### 1. `lib/engine/ecs/archetype.ts`

```ts
// Conceptual shape — adapt to actual implementation.
// Component = a name + a typed array per-instance
// Archetype = a set of components + a dense slot pool

export interface ColumnSpec<T extends ArrayBufferView> {
  readonly name: string;
  readonly itemSize: number; // floats per slot
  readonly factory: (capacity: number) => T;
}

export class Archetype<TCols extends Record<string, ArrayBufferView>> {
  // dense slot index → component arrays
  // O(1) swap-remove on entity destroy
  // grow capacity in powers of 2
  // expose columnArray(name) for systems
}
```

Key invariants:
- Components live in TYPED ARRAYS (Float32Array, Uint32Array) — never plain JS objects
- Removal is SWAP-REMOVE (move last entity into removed slot) — keeps storage contiguous
- Capacity grows in powers of 2 (cheap reallocs)

### 2. `lib/engine/ecs/world.ts`

```ts
// World owns archetypes. Allocates entity IDs.
// For the leaf proof, we only need one archetype, so this is tiny.

export class World {
  createEntity(archetype, init): EntityId;
  destroyEntity(id: EntityId): void;
  archetype<T>(spec): Archetype<T>;
}
```

### 3. `lib/engine/ecs/system.ts`

```ts
// A system is just a function. The "scheduler" for the proof is just
// "call it from useFrame." We're not building generality yet.

export type System<TCols> = (
  archetype: Archetype<TCols>,
  dt: number,
  elapsedTime: number,
) => void;
```

### 4. `lib/engine/animation/sway-system.ts`

```ts
// Reads SwayParams column, writes Rotation/Position columns.
// Same swayAngle math as celVocab.ts but operating on arrays.

export const swayLeafSystem: System<LeafCols> = (arch, _dt, t) => {
  const phase = arch.columnArray("phase");
  const amplitude = arch.columnArray("amplitude");
  const frequency = arch.columnArray("frequency");
  const rotY = arch.columnArray("rotY");
  for (let i = 0; i < arch.length; i++) {
    rotY[i] = Math.sin(t * frequency[i] + phase[i]) * amplitude[i];
  }
};
```

### 5. `app/battle-v2/_components/vfx/effects/InstancedLeafField.tsx`

```ts
// Consumes the ECS archetype + renders one InstancedMesh.
// Reads `matrix4` columns out of the archetype and applies via
// mesh.setMatrixAt + mesh.instanceMatrix.needsUpdate.

// Mounts the sway system in useFrame:
useFrame(({ clock }, dt) => {
  swayLeafSystem(leafArchetype, dt, clock.elapsedTime);
  applyTransformsToInstancedMesh(leafArchetype, meshRef.current);
});
```

### 6. Integration: opt-in debug knob

Add to HexSceneConfig:
```ts
useInstancedLeaves: S.Boolean  // default false
```

When toggled on in PostPane:
- Tree, Bush, Mushroom, Wildflower, Rock render WITHOUT their LeafPuffs
- The scene mounts a single `<InstancedLeafField>` collecting all leaf data
- Operator A/Bs by toggling the knob, watches FPS + DRAW change

## Design rules (Alexander)

- **Visual parity** — the instanced path MUST be visually indistinguishable from the per-component path at static frames. Sway timing may differ slightly (one global tick vs N per-entity ticks); document the delta but don't accept big visual drift.
- **No new colors or hues** — reuse `pickFlavorHue` per-leaf. Each leaf still picks from canopyGreen/canopyAutumn/etc.
- **Outline parity** — if we lose ink outlines from going instanced, that's a structural compromise to surface immediately. (drei's `<Outlines>` may not work on instanced meshes; if so, document the trade and plan a fallback.)

## What NOT to build (Barth)

- NO render-plugin port this session (PRD step 5 — different session)
- NO physics-plugin port (PRD step 7 — different session)
- NO event-bus / oracle ingestion (PRD step 6 + 9 — different session)
- NO migration of trees/grass/rocks to ECS — only LEAVES this session (the smallest archetype that proves the pattern)
- NO multi-archetype scheduler — single sway-system function called from useFrame is the proof
- NO @effect/schema-derived buffer layouts (deferred until we have 2+ archetypes and the abstraction earns its keep)

## Verify (the proof points)

When toggling `useInstancedLeaves` ON in PostPane:

| Measurement | Before (per-component) | After (instanced) | Target |
|---|---|---|---|
| Draw calls | ~80-150 (one per leaf mesh + outline) | ~5-10 (instanced + cap + walls) | ≥ 10× drop |
| FPS at idle | baseline | unchanged or better | no regression |
| useFrame count | 50-100 | substantially fewer | dramatic drop |
| Visual diff | — | indistinguishable static frame | yes/no |

If draw calls don't drop sharply: the InstancedMesh isn't actually pooling correctly — investigate.
If FPS drops: the system loop has a hot bug; profile.
If visual differs: the sway timing or hue picking is off; fix before claiming victory.

## Open creative questions

1. **Archetype table vs sparse set?** Per dig: Bevy uses Tables (strict contiguous), EnTT uses Sparse Sets (O(1) add). For LEAVES which are largely STATIC (count doesn't change per frame), Table is fine. For future moving entities (creatures, particles spawned by spells), Sparse Set may matter. Defer the decision until we have a sparse use case.
2. **Effect-TS Layer integration shape?** The dig suggests using a Layer to host the mutable archetype as an "opaque resource." For session 16 we don't need this — the ECS is mounted as a React ref. Layer integration is a session-17 topic.
3. **`@effect/schema` for component layouts?** Tempting but premature. Defer.
4. **Outlines on instanced meshes?** Drei's `<Outlines>` uses an inverted-hull mesh that doesn't directly support instancing. Options: (a) ship without leaf outlines on the instanced path (small visual regression); (b) write a custom instanced inverted-hull shader (real work). Decide based on visual eval.

## Convergence target (single sentence)

After session 16: **the hex-scene renders all leaves through ONE InstancedMesh driven by ONE useFrame loop, toggleable A/B against the current per-component pattern, with measured proof of ≥10× draw-call drop and no FPS regression.** Plus a distillation entry documenting what we learned and what's deferred.

## Key references

| Topic | Path |
|---|---|
| The PRD (source of truth) | `grimoires/loa/specs/enhance-substrate-perf-and-engine.md` |
| Columnar dig | `grimoires/k-hole/research-output/dig-2026-05-17-columnar-ecs.md` |
| three.quarks dig | `grimoires/k-hole/research-output/dig-2026-05-17-three-quarks-vfx.md` |
| Peer-substrates doctrine | `/Users/zksoju/Documents/GitHub/construct-effect-substrate/patterns/peer-substrates-different-shapes.md` |
| Current leaf primitive | `app/battle-v2/_components/vfx/effects/LeafPuff.tsx` |
| Tree call site | `app/battle-v2/_components/vfx/effects/Tree.tsx` |
| Bush call site | `app/battle-v2/_components/vfx/effects/Bush.tsx` |
| Perf measurement | `app/battle-v2/_components/vfx/effects/PerfReadout.tsx` (toggle in PostPane → debug → "perf readout") |
| Rain (Lane 2 reference impl) | `app/battle-v2/_components/vfx/effects/Rain.tsx` — already uses single useFrame + InstancedMesh |
| Cel vocab (where leaf hues come from) | `app/battle-v2/_components/vfx/celVocab.ts` |
| Cycle-4 effect-substrate references | grounding-ladder, hakkutsu-as-divining-rod (in construct-effect-substrate/patterns/) |

## Pushback invitation

- This session's biggest risk is OVER-BUILDING the ECS substrate. Resist. The proof point is ONE archetype + ONE system + ONE InstancedMesh. If you find yourself writing scheduler abstractions or component registration ceremony, STOP and re-read this doc.
- The second-biggest risk is UNDER-MEASURING. If you skip the perf-readout A/B comparison, you have no proof. The numbers ARE the result.
- The third risk is BREAKING VISUAL PARITY. The instanced path must look effectively identical to current at idle. If it doesn't, the proof doesn't count.
