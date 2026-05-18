---
session: 14-followup
date: 2026-05-17
type: PRD (substrate-tier, Lane 1)
topic: perf-substrate-platform-agnostic-engine
status: candidate-for-operator-review
mode: ARCH (OSTROM) + craft lens (ALEXANDER)
depends_on:
  - effect-substrate construct cycle-4 doctrine — peer-substrates-different-shapes, grounding-ladder, hakkutsu-as-divining-rod
  - dig-2026-05-17-three-quarks-vfx — verdict: roll bespoke particle, do NOT adopt three.quarks
  - dig-2026-05-17-columnar-ecs (in flight)
operator_quotes:
  - "render thousands of objects with no issue and very little lag. right now even with a MacBook M4 it does seem to lag and overheat"
  - "stay agnostic to the actual render platform so we don't tie our designs with specific render and physics plugins"
  - "ThreeJS WebGPU and Rapier are now choices. If you wanna roll your own, or use WebGL, you can build your own renderer / physics plugin"
  - "people to be able to run this on a very shitty PC and bad Wi-Fi and seamlessly"
references:
  - https://github.com/Alchemist0823/three.quarks
  - Matthew Collison @MrCollison — Trizen ECS + columnar stores
  - El Capitan convo — Five Oracles (CORONA/TREMOR/BREATH/DELUGE)
---

# Substrate Perf + Platform-Agnostic Engine (PRD)

> Substrate-tier work. Lane 1 of the session-14-followup (paired with Lane 2 = VFX iteration). The operator's tweet-of-Trizen-ECS + the M4-overheating + the "render-platform-agnostic" ask all point at the same thing: **the React-component-per-fixture pattern doesn't scale**, and the substrate needs an ECS-shaped layer for thousands-of-entities scope.
>
> The peer-substrates doctrine (cycle-4 of effect-substrate) already names this: "Thousands-of-entities scale (cards-as-particles · AI sims) → ECS (DOTS/SoA)." This PRD specifies that substrate.

## Problem

1. **M4 overheating in `/battle-v2/vfx-lab`** — operator-reported (2026-05-17). Likely caused by ~50-100 individual `useFrame` listeners (one per leaf cluster + water + characters + clouds + mist + cliff anim + bears + etc.) each running every frame. Each registration is React-reconciler overhead + closure-per-callback CPU cost. Death by a thousand cuts.

2. **No platform-agnostic engine boundary.** Current code is tightly coupled to:
   - `@react-three/fiber` (renderer + scene + animation loop)
   - `three` directly for geometry/materials
   - No physics layer at all (planned: optional Rapier)
   - Future Three.js → WebGPU migration, or a roll-your-own renderer for non-web platforms, would require touching every primitive.

3. **No batching/instancing for repeated geometry.** Each leaf puff is its own draw call. At hex-scene scale: ~80 leaves × 2 outline meshes each = ~160 draw calls JUST for foliage. Browser GPU spends most time on draw-call overhead, not actual triangle work.

4. **VFX library decision pending.** Operator wants environmental effects (rain, thunder, earthquake displacement, trees-falling) that span multiple hex tiles AND run smoothly on bad hardware. K-hole dig (2026-05-17-three-quarks-vfx) verdict: **three.quarks does NOT compose with our cel-shaded register at 100k+ scale**. Need bespoke primitive.

5. **Multi-source data ingestion ahead.** El Capitan convo names Five Oracles (CORONA solar flares, TREMOR seismic, BREATH air quality, DELUGE weather, future Wildfire). When integrated, each will inject async signals that affect game state. Substrate must accept N concurrent event sources cleanly.

## Goals

| # | Goal | Measurement |
|---|------|-------------|
| G1 | Render 1,000+ active entities at 60fps on M4 | Perf readout (already added 2026-05-17) — `FPS ≥ 60` at 1k fixture scene |
| G2 | Drop draw calls 10x for repeated geometry (leaves, grass tufts, fixtures) | DRAW count visible in perf readout — target ≤ 30 for current hex-scene |
| G3 | Renderer + physics behind plugin interface | `lib/engine/render-plugin.ts` + `lib/engine/physics-plugin.ts` boundary; current Three.js implementation just one impl |
| G4 | Particle VFX primitive that fits cel register | Rain works, runs at 60fps with 10k droplets, composes with `meshToonMaterial` |
| G5 | Substrate accepts multi-source async events | `lib/engine/event-bus.ts` w/ typed channels for each oracle |

## Non-goals (Barth)

- NO WebGPU migration this cycle. Three.js stays the default renderer. Plugin boundary just makes future migration trivial.
- NO multiplayer this cycle. The event-bus shape anticipates it (typed channels can route across network), but no actual network code.
- NO three.quarks adoption. Bespoke primitive only.
- NO scope creep into honeycomb-substrate's existing Effect.PubSub. ECS is a PEER substrate per the doctrine; not a replacement.
- NO rewrite of existing battle-v2 world. The engine substrate is additive — existing routes keep working; new lab routes adopt the new primitives.

## Architecture

### Two substrates, peer-shaped (per cycle-4 doctrine)

```
lib/honeycomb/            lib/engine/                lib/purupuru/
└─ Effect.PubSub          └─ SoA columnar ECS        └─ EventEmitter + pure resolver
    fiber-aware                typed arrays                grep-testable boundary
    async game state           thousands of entities       sim/presentation discipline
```

Each holds the substrate role (Reality + Contracts + Schemas + State Machines + Events + Hashes + Tests). Different shapes for different scopes. **Not one subsumes the other.** Per peer-substrates-different-shapes.md.

### lib/engine — the new piece

```
lib/engine/
├─ index.ts                — re-exports
├─ ecs/
│  ├─ archetype.ts         — archetype storage (entities with the same component shape)
│  ├─ component.ts         — typed component definitions (Position, Velocity, Sway, etc.)
│  ├─ query.ts             — iterate over archetypes matching a component set
│  ├─ world.ts             — World container; create/destroy entities; tick systems
│  └─ system.ts            — System type + scheduler
├─ render-plugin/
│  ├─ port.ts              — renderer interface (begin/end frame, mount/unmount mesh, etc.)
│  ├─ three.ts             — Three.js implementation
│  └─ types.ts             — RenderHandle, MeshDescriptor, etc.
├─ physics-plugin/
│  ├─ port.ts              — physics interface (step, raycast, body, joint, etc.)
│  ├─ none.ts              — no-op stub (current default)
│  └─ rapier.ts            — Rapier implementation (later, optional)
├─ animation/
│  ├─ sway-system.ts       — SINGLE useFrame loop for all swayable entities
│  ├─ wave-system.ts       — water surface vertex animation (centralized)
│  └─ types.ts
├─ event-bus/
│  ├─ port.ts              — typed channel interface
│  ├─ live.ts              — in-process channel
│  └─ remote.ts            — placeholder for network channel (multiplayer)
└─ instanced/
   ├─ instanced-leaves.tsx — InstancedMesh + per-instance matrix from ECS
   ├─ instanced-rocks.tsx  — same pattern for rocks
   └─ instanced-grass.tsx  — same pattern for grass tufts
```

### The columnar/archetype insight (Trizen / Bevy / EnTT / ClickHouse)

Current React pattern (anti-pattern at scale):
```tsx
{leaves.map((leaf) => (
  <LeafPuff key={leaf.id} {...leaf} swaySeed={leaf.id} />  // each → useFrame, mesh, outline
))}
```

ECS pattern (target):
```ts
// One archetype: SwayableLeaf = { Position, Color, Radius, SwayParams }
const swayables = world.query(SwayableLeaf);

// One system: updates ALL swayable entities in a tight loop
function swaySystem(world, dt, t) {
  const arch = world.archetype(SwayableLeaf);
  const positions = arch.componentArray("Position"); // Float32Array, packed
  const sway = arch.componentArray("SwayParams");    // Float32Array
  for (let i = 0; i < arch.length; i++) {
    const phase = sway[i * 3];     // amplitude, frequency, phase packed
    // ... update positions[i] directly
  }
}

// Renderer reads positions FROM the archetype directly into an InstancedMesh.
// Three.js gets a single typed-array update per frame; one draw call total.
```

**Why this is fast**:
- Typed arrays (SoA) = CPU cache hits while iterating
- One useFrame = one React reconcile per frame, not N
- One InstancedMesh = one draw call, not N
- Adding/removing entities = `archetype.add/swap-remove` (O(1)), not React tree edits

The "archetype bundling" is exactly Matthew Collison's tweet: entities with the same component shape pack together → SQL-like queries on columns become trivial → ClickHouse-of-game-state.

### Plugin shape (operator-pinned: stay platform-agnostic)

```ts
// lib/engine/render-plugin/port.ts
export interface RenderPlugin {
  initialize(canvas: HTMLCanvasElement, opts: RenderOpts): Promise<void>;
  mountInstancedGroup(descriptor: InstancedGroupDescriptor): RenderHandle;
  updateInstance(handle: RenderHandle, index: number, matrix: Matrix4): void;
  beginFrame(camera: CameraState): void;
  endFrame(): void;
  dispose(): void;
}
```

Two implementations to ship:
- `render-plugin/three.ts` (default, current)
- `render-plugin/types.ts` only (no impl) — proves the interface is real

WebGPU + WebGL alternates land later. Same for physics (Rapier optional).

### VFX particle primitives (Lane 2 substrate)

Per dig-2026-05-17-three-quarks-vfx convergence:
- NOT three.quarks (top-down material ownership fights our bottom-up toon shaders at scale)
- Bespoke per-effect primitives that compose with `meshToonMaterial`
- Each primitive = one ECS archetype + one InstancedMesh + one update system

First primitive: **Rain**. Defined per-tile (operator: "weather can affect multiple squares, maybe 4-7 hexes"). Drop matrices live in the ECS, animated by one system, rendered as one InstancedMesh.

## Sequencing (proposed)

| # | Step | Scope | Validates |
|---|------|-------|-----------|
| 1 | Perf readout in lab (DONE 2026-05-17) | Tiny | Baseline measurement |
| 2 | **Lane 2 quick win** — Rain primitive bespoke (rough first cut) | Small | Particle pattern + per-tile confinement work |
| 3 | **Lane 1 quick win** — Instanced leaves (single InstancedMesh, single useFrame for sway) | Medium | Draw-call drop measurable; sets pattern for grass + rocks |
| 4 | Lane 1 — `lib/engine/ecs/*` scaffold (archetype, world, system) | Medium | ECS core; standalone tests |
| 5 | Lane 1 — render-plugin port + Three.js impl | Medium | Plugin boundary proven |
| 6 | Lane 1 — event-bus port + in-process impl | Small | Ready for oracle ingestion |
| 7 | Lane 1 — physics-plugin port + no-op impl + optional Rapier | Medium | Physics-optional contract |
| 8 | Lane 2 — Thunder, Earthquake, displacement-on-tree-fall primitives | Medium | VFX vocabulary expansion |
| 9 | Lane 2 — Oracle ingestion (CORONA/TREMOR/BREATH/DELUGE) wired to event-bus | Medium | Real-world weather → game |

Each step ships independently. Lane 1 + Lane 2 can interleave.

## Open creative questions (operator pair-point)

1. **ECS substrate name** — `lib/engine`, `lib/honeycomb-ecs`, `lib/loom`? Naming determines mental model.
2. **Rapier as default-OFF or default-ON?** Affects bundle size + cold-start. Default-OFF unless physics required.
3. **WebGPU adoption priority** — defer entirely or do a small spike now to validate the plugin port shape?
4. **Multiplayer event substrate** — same bus shape OR separate `lib/network`? (Per peer-substrates doctrine: scope-driven.)
5. **Oracle wiring** — pull each oracle's MCP endpoint from a registry in `.loa.config.yaml`, or hardcode in the event-bus?
6. **Engine substrate testing** — vitest pure-function (no Effect coupling)? Or Effect-tier for fiber lifecycle? Probably the former, mirroring lib/purupuru's discipline.

## Promotion ladder

This PRD is `candidate-for-operator-review`. On operator approval:
1. Cycle ID assigned (e.g., compass-cycle-2-engine-substrate)
2. SDD via `/architect`
3. Sprint plan via `/sprint-plan`
4. Execution via `/run sprint-plan` with Flatline + Bridgebuilder gates

Sub-step short-circuits are fine for the L2 lane (operator-paced VFX iteration). L1 substrate work should ride the full Loa workflow.

## Convergence target

**Render 1,000 hex-scene fixtures at 60fps on M4 with all current visual effects intact, plus a rain primitive on 4 hexes, plus a perf readout showing < 30 draw calls.** When that lands, the engine substrate has proven itself. Everything else (multi-oracle, multiplayer, WebGPU) is additive.

## Provenance

- Operator quotes (Lane 1 + Lane 2 framing): session-14-followup message 2026-05-17
- Matthew Collison tweet on Trizen ECS + columnar stores: 2026-05-17
- El Capitan convo on Five Oracles: 2026-05-15
- K-hole dig three.quarks: `grimoires/k-hole/research-output/dig-2026-05-17-three-quarks-vfx.md`
- K-hole dig columnar ECS: `grimoires/k-hole/research-output/dig-2026-05-17-columnar-ecs.md` (in flight)
- Doctrine references:
  - `construct-effect-substrate/patterns/peer-substrates-different-shapes.md` (cycle-4)
  - `construct-effect-substrate/patterns/grounding-ladder-as-substrate-primitive.md` (cycle-4)
  - `construct-effect-substrate/patterns/hakkutsu-as-divining-rod.md` (cycle-4)
