---
session: 16
date: 2026-05-17
type: distillation
topic: columnar-ecs-substrate-proof
status: candidate-doctrine
use_label: usable
mode: ARCH (OSTROM) + craft lens (ALEXANDER) + k-hole-as-teacher
load_bearing: true
operator_quote: "we are exploring · we do have a lot of different ones, but we produce a lot of each one · we can /simstim this"
cycle: engine-substrate-2026-05-17
cycle_status: PARTIAL — substrate proven, integration partial, scale unverified
relates_to:
  - lib/engine/ecs/archetype.ts
  - lib/engine/animation/sway-system.ts
  - app/battle-v2/_components/vfx/effects/leafExtractors.ts
  - app/battle-v2/_components/vfx/effects/InstancedLeafField.tsx
  - grimoires/loa/specs/enhance-substrate-perf-and-engine.md (PRD)
  - grimoires/loa/specs/enhance-columnar-ecs-teaching-session.md (build doc)
  - grimoires/k-hole/research-output/dig-2026-05-17-columnar-ecs.md
  - grimoires/loa/cycles/engine-substrate-2026-05-17/RESULTS.md
---

# Session 16 — Columnar ECS · Teach + Proof

> Cycle `engine-substrate-2026-05-17`. Stage-1 proof slice of the larger
> engine-substrate PRD: scaffold `lib/engine/` (Bevy-shape archetype tables +
> system-as-function) and prove the shape works by routing all hex-plot
> leaves through ONE instanced mesh driven by ONE useFrame.
>
> **Cycle outcome: PARTIAL.** Substrate architecture validated by GEO drop
> (173 → 114); renderer integration partial due to a vertexColors +
> meshToonMaterial shader-path gap; scale benefits unverifiable at 7-plot
> scene scale.
>
> The bigger learning is method-level. Three bugs surfaced across this
> cycle: two caught by cross-model adversarial review, one only catchable
> by operator's eyes in a live GL context. The review-gate value-proposition
> proved itself on the first cycle that used it.

---

## The shift

```
BEFORE                                              AFTER
────────────────────────────────────────            ─────────────────────────────────────────
N × <LeafPuff> components                           ONE archetype table (LeafCols)
   N React reconciles                                 + ONE InstancedMesh
   N useFrame closures                                + ONE useFrame loop
   N icosphere geometries                             + per-instance matrix composition
   N outline meshes (drei <Outlines>)                 + extractor pure-functions per fixture
   M draw calls per leaf                              + suppressLeaves prop on each fixture
                                                       + opt-in via useInstancedLeaves toggle

drei <Instances> for macro foliage:                 leafExtractors.ts mirrors the per-fixture
   already SoA-shaped (trunks + canopies + bushes)     leaf math from Tree.tsx / Mushroom.tsx /
   no per-instance arbitrary attributes               Wildflower.tsx / Rock.tsx and produces
   no sway (renders ambient-still)                    world-space LeafSpec[] for the archetype
```

The substrate's contribution: a substrate-level pattern with per-instance
arbitrary attributes (sway phase, amplitude, frequency, color) that drei's
`<Instances>` can't express. The shape generalizes — same archetype-table
pattern will host future spawnables (spell particles, ambient sparks).

---

## Substrate layer (lib/engine/)

### Shape chosen: Archetype Table (Bevy-shape)

**Decision validated empirically against the actual scene:**

```
fixture kind   shape stability   instances/scene   useFrames each
Tree           stable            ~9                4 (one per branch)
Bush           stable            ~14               1 (whole-bush)
Mushroom       stable            ~8                1
Wildflower     stable            ~12               1
Rock (moss)    stable            ~16               1
Rain droplet   dynamic, looping  50–10,000         1 (shared, instanced)
```

Operator's framing: "we do have a lot of different ones, but we produce a
lot of each one." That's the textbook archetype-table fit — many tables,
each densely populated, all shape-stable post-mount. SparseSet deferred
until a churning use-case arrives (e.g., spell particles, status effects).

Hybrid contract: **per-kind storage decision at archetype-registration
time**, not per-frame. "Stable" or "churning" is a property of the kind.

### What earned its keep, what didn't

| Decision | Earned its keep? | Note |
|---|---|---|
| `Float32Array` column slabs | ✓ | Cache-friendly iteration, no GC. |
| swap-remove on destroy | ✓ | Substrate-bug caught by review: must zero omitted columns on slot reuse. |
| Power-of-2 capacity grow | ✓ | Cheap amortized push; reallocates O(log n) times. |
| Branded `EntityId` | ✓ (cosmetic) | Type-safety without runtime cost. |
| `World` registry | Mostly — earned when multi-archetype scheduling appears. | Currently a thin Map; thinness is correct for proof scope. |
| `System<TCols>` type alias | ✓ | No scheduler abstraction yet — call from useFrame. |
| `@effect/schema`-derived layouts | NO (deferred per build doc) | Don't earn until 2+ archetypes share layout patterns. |

### Float32 storage discipline (surfaced by tests, not docs)

The first sway-system unit test failed two assertions on Float32 precision
artifacts (`phase[0] = 0.7` stored as `0.699999988079071`). The "fix" wasn't
the substrate — it was teaching the tests to expect Float32 semantics:

- Snapshot column values BEFORE the system runs (so expected = stored, not
  literal)
- Use a local `f32(x)` helper that rounds Float64 through Float32
- Math-parity tests use `toBeCloseTo(..., 6)` (Float32 ULP at unit scale)

The substrate's contract is **single-precision throughout**. Consumers
assuming Float64 precision will be silently truncated. Worth a doc note
in `lib/engine/index.ts` header before the next archetype arrives.

---

## Application layer (hex-scene integration)

### What the integration actually does

When `useInstancedLeaves` is ON in HexSceneConfig:

1. `HexScene` walks all 7 plots' fixtures
2. `gatherLeavesFromPlots()` calls `leafExtractors.fixtureLeafSpecs(kind, ...)` per fixture
3. Each extractor (`treeLeafSpecs`, `mushroomLeafSpecs`, `wildflowerLeafSpecs`, `rockMossLeafSpecs`) mirrors the per-fixture leaf-placement math from the JSX render
4. The aggregated `LeafSpec[]` flows into `<InstancedLeafField>` which:
   - Allocates a `LeafArchetype` (lib/engine)
   - Mounts ONE `useFrame` running `swayLeafSystem` then per-instance matrix composition
   - Renders ONE `<instancedMesh>` of icospheres
5. `suppressLeaves={true}` is forwarded to each fixture so `<LeafPuff>` JSX is skipped

Bush is OUT OF SCOPE — its internal sub-puffs aren't `LeafPuff` calls; its own
useFrame stays alive. To be addressed in a future cycle if numbers say so.

### What broke at integration time (the BLACK leaves)

The Three.js shader path for `meshToonMaterial` + `vertexColors=true` +
`InstancedMesh.instanceColor` doesn't end-to-end consume per-instance
colors. The `setColorAt(i, color)` uploads bytes; the shader's `vColor`
varying never gets populated from `instanceColor`; the fragment shader
multiplies `material.color * vColor = white * (0,0,0) = pure black`.

**Cross-model review didn't catch this** — the dissenter (codex-headless)
caught the missing `vertexColors` prop (which would have hidden the
problem worse — leaves all-same-fallback-color instead of all-black), but
flipping it on revealed the deeper material-shader-chunk gap.

**This is a known class of bug**: GL-context-dependent behavior. Code review
can verify the JSX + the prop wiring; only a live renderer can verify the
fragment shader output. Doctrine takeaway below.

---

## Taste layer (visual + operator-feel)

- **Outline regression** — accepted up-front. Drei `<Outlines>` builds an
  inverted-hull mesh that doesn't natively instance. On the instanced path,
  leaves render without ink outlines. Trunks/branches/caps/etc. keep theirs.
  Not measured in this cycle's A/B because the BLACK leaves dominated the
  visual signal.
- **First-frame white flash** — designed-around with a white identity-multiplier
  base color. Never observed because the BLACK leaves never resolved to
  the per-instance colors.
- **Sway in motion** — not assessable until colors land. The matrix math
  for sway is unit-tested (5 cases), so motion should be correct once
  visible.
- **Phantom-sway** (secondary-leaf parity) — primary and secondary leaves
  share the same swayPhase (group-rotation parity matched). Icosphere
  isotropy makes this work for the proof scope. Documented in
  `leafExtractors.ts`.

---

## Process layer (the cross-model gate)

### Bugs surfaced this cycle (3 total)

| # | Sprint | Severity | Catch path | What |
|---|---|---|---|---|
| 1 | sprint-1 review | BLOCKING | cross-model dissent (`codex-headless`) | `Archetype.add()` reusing slots after swap-remove inherited stale data from omitted columns. Closed in `19a9eba6` + 3 regression tests. |
| 2 | sprint-2 review | BLOCKING | cross-model dissent (`codex-headless`) | `InstancedLeafField.tsx` missing `vertexColors` prop on toon material. Closed in `ff1249ff`. |
| 3 | sprint-2 verify | BLOCKING (visual) | operator's eyes, in-browser | `vertexColors` + `meshToonMaterial` + `InstancedMesh.instanceColor` shader-chunk gap. Deferred to follow-up cycle. |

### Doctrine candidate

> **Code review catches code-shape bugs. GL renderers catch shader-chunk
> bugs. The two gates are complementary, neither subsumes the other.**
>
> Apply when: the change introduces or modifies a render-pipeline material
> property (vertexColors, defines, gradient maps, custom shaders).
>
> The cross-model adversarial dissent gate **proved its keep** in this
> cycle's first use: caught two BLOCKING bugs the single-model implementer
> missed. Both were code-shape bugs (one storage-correctness, one
> JSX-prop-omission). The third bug — fundamentally a Three.js shader
> chunk inclusion question — required a GL context to surface. Document
> the boundary so future cycles know which gates each bug-class fires.

---

## Scale-where-it-matters

The 7-plot hex scene has ~80 leaves. The PRD targets thousands of entities.
At this scale:

- Per-LeafPuff React reconciler cost is already trivial on M4
- Per-LeafPuff useFrame closure cost is trivial
- R3F + drei batches per-LeafPuff draw calls (DRAW=1 in both paths is
  the signal — measurement collapsed because there's no draw-call problem
  to begin with at this scale)

**Where the substrate ACTUALLY matters:**

- **Zone-scene composition** (session-17 spec — `enhance-zone-scene-elemental-vfx.md`):
  ambient leaf/pollen/mist particle layers per-element, layered N times
- **Future spawnables**: spell particles, sparks-on-clash, status effects,
  weather (rain already follows the same recipe in `Rain.tsx`)
- **Larger scenes**: ring-3 hex grids (37 plots → ~400+ leaves), or open-
  world stretches

This cycle proves the **shape** is right. Scale-benefit measurement waits
until a scene actually has scale-pressure.

---

## What's deferred (next-cycle backlog)

### Substrate
- **SparseSet** layer for churning archetypes (when spell particles arrive).
- **Multi-archetype scheduler** with cross-system ordering constraints.
- **`@effect/schema`-derived buffer layouts** when 2+ archetypes share patterns.
- **Float32 storage doc note** in `lib/engine/index.ts` header.

### Integration
- **Black-leaf fix**: choose between (a) onBeforeCompile-injection of
  `<instancing_color>` chunk into meshToonMaterial, (b) switch to
  meshLambertMaterial on instanced path (loses cel-band on leaves), (c)
  custom ShaderMaterial, or (d) group-by-color InstancedMesh clusters.
- **Outline-on-instanced** custom inverted-hull shader (separate cycle).
- **Bush internal-sub-puff refactor** if Bush population becomes
  perf-relevant.

### Engine-substrate PRD next steps (per `enhance-substrate-perf-and-engine.md`)
- Step 5: RenderPlugin port (Three.js / WebGPU / roll-your-own swappable)
- Step 6: event-bus / oracle ingestion
- Step 7: PhysicsPlugin port (Rapier optional)
- Step 8: VFX vocabulary expansion (Thunder, Earthquake, displacement)
- Step 9: Five Oracles wiring (CORONA/TREMOR/BREATH/DELUGE)

### Measurement
- **PerfReadout DRAW/TRIS encoding** — both show "1" in both paths.
  Investigate whether the field is showing thousands (encoding artifact)
  or whether the original LeafPuff path was already heavily batched by
  drei/R3F. May reveal that draw-call measurement needs different tooling.
- **Larger-scene A/B** when zone-scene or ring-3+ scenes exist.

---

## Open questions for next session pair-point

1. **Which black-leaf fix path?** The four options have different cost/scope
   profiles. Recommend (b) — switch to meshLambertMaterial on instanced
   leaves — because leaves are small at viewing distance and the cel-band
   loss is barely visible. Operator's call.
2. **Should `lib/engine/` move to a published shared module** (constructs
   registry?) so other Compass cycles can adopt it without copying? The
   PRD's vision suggests yes; the current shape is small enough to defer
   the decision.
3. **Is `useInstancedLeaves` a permanent toggle or a temporary A/B knob?**
   If permanent, it should be promoted from `debugPerf`-adjacent in the
   PostPane "debug" folder to a proper "render quality" or "perf" section.
   If temporary (just for this cycle's verification), it stays as-is.
4. **When does the SparseSet path get earned?** Per the hybrid doctrine,
   the next spawnable that has churning components (e.g., spell particles
   with status effects) triggers it. Worth pre-naming the use-case so the
   substrate growth has a target.

---

## Anti-patterns to avoid (next cycle)

- ❌ **Bake assumptions about Three.js shader chunks** — vertexColors +
  toon + instanceColor was three layers of "should work" that didn't.
  Verify shader-path support BEFORE designing around it.
- ❌ **Use PerfReadout DRAW/TRIS as the primary signal** — both showed "1"
  in this cycle's A/B. Use GEO + visual inspection until DRAW encoding
  is clear.
- ❌ **Measure substrate benefit at small scale** — small N gives noise-
  level signal. Defer the measurement to the scale where it would matter.
- ❌ **Forget the PostPane knob registration** — the `useInstancedLeaves`
  field on the schema doesn't auto-surface a UI control. Hand-wire it in
  `VfxRegistry.ts` whenever a new schema field needs operator access. (Per
  session-14 operator-pinned "no AST introspection" decision.)

---

## References

- PRD: `grimoires/loa/specs/enhance-substrate-perf-and-engine.md`
- Build doc: `grimoires/loa/specs/enhance-columnar-ecs-teaching-session.md`
- Dig (columnar ECS): `grimoires/k-hole/research-output/dig-2026-05-17-columnar-ecs.md`
- Dig (three.quarks): `grimoires/k-hole/research-output/dig-2026-05-17-three-quarks-vfx.md`
- Results: `grimoires/loa/cycles/engine-substrate-2026-05-17/RESULTS.md`
- Sprint plan: `grimoires/loa/sprint.md`
- Bug-catch envelopes: `grimoires/loa/a2a/sprint-1/adversarial-review.json`, `grimoires/loa/a2a/sprint-2/adversarial-review.json`, `grimoires/loa/a2a/sprint-2/adversarial-audit.json`
- Cycle dir: `grimoires/loa/cycles/engine-substrate-2026-05-17/`
- Effect-substrate doctrine (peer-substrates / grounding-ladder): `construct-effect-substrate/patterns/`

## Provenance

- Session 16, 2026-05-17
- Operator: zksoju
- Run ID: `2026-05-17-9a4d3d`
- Branch: `feat/ecs-leaves-2026-05-17`
- Cycle: `engine-substrate-2026-05-17`
- Operator pacing: kaironic + teaching (not speed-build)
- Method: /simstim-flavored Path B (sprint.md + /run sprint-plan, no full Flatline PRD/SDD ceremony)
- Pair-points: stage 1 (terminology), stage 2 (sprint shape), S1→S2 gate, S2→S3 gate, S3 A/B fidelity gate
