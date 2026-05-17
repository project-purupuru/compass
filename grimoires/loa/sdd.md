---
cycle: fixture-ecs-instancing-2026-05-17
session: 19
type: SDD
status: candidate (Path B — focused SDD; no full Flatline SDD ceremony per cycle 1+2 convention)
date: 2026-05-17
mode: ARCH (OSTROM) + craft lens (ALEXANDER) + k-hole-as-teacher
references:
  - grimoires/loa/prd.md (this cycle's PRD)
  - lib/engine/ecs/archetype.ts (cycle-1 substrate)
  - lib/engine/animation/sway-system.ts (cycle-1 system pattern)
  - app/battle-v2/_components/vfx/effects/InstancedLeafField.tsx (cycle-1 renderer template)
  - app/battle-v2/_components/vfx/effects/leafExtractors.ts (cycle-1 extractor template)
  - app/battle-v2/_components/vfx/effects/{Tree,Bush,Rock,Mushroom,Wildflower}.tsx (existing fixtures)
  - app/battle-v2/_components/vfx/effects/HexPlot.tsx (integration seam)
  - app/battle-v2/_components/vfx/effects/BigRealmScene.tsx (composer)
---

# Cycle-3 — Fixture-ECS-Instancing (SDD)

> Architecture for collapsing 5 fixture kinds (Tree · Bush · Rock · Mushroom · Wildflower)
> from per-React-component meshes into InstancedMesh archetypes. Each kind gets its own
> `lib/engine/ecs/<kind>-archetype.ts` substrate primitive + an `Instanced<Kind>Field.tsx`
> renderer. Integration via additive `suppressFixtures` opt-in on HexPlot. BLACK-leaves
> shader-chunk fix lands first as a standalone commit (meshLambertMaterial swap).

---

## 1. Overview

```
Existing data flow (non-instanced — N React components per tile):
  PlotT.fixtures[i]   →   <HexPlot>.dispatch(fix.kind)   →   <Tree>/<Bush>/<Rock>/...
                                                              └─ N <mesh> + Outlines per fixture
                                                              └─ Bush also has its OWN useFrame

New data flow (instanced — SHARED InstancedMesh per kind):
  PlotT.fixtures[i]   →   fixtureExtractors.gather(plots, worldPositions)
                              └─ produces TreeSpec[] · BushSpec[] · RockSpec[] · ...
                          ↓
                          per-kind Archetype tables (lib/engine/ecs/*)
                              └─ Float32 column slabs: position, rotation, scale, color, …
                          ↓
                          Instanced<Kind>Field.tsx renders
                              └─ 1-6 InstancedMesh layers per kind (NO per-frame work for
                                 static fixtures; leaf field handles sway separately)
                          ↓
                          HexPlot skips JSX render for kinds ∈ suppressFixtures
```

The cycle-1 pattern (Archetype + System + InstancedMesh + useFrame) is preserved for
the LEAF-bearing parts (cycle-1 still owns sway). The cycle-3 archetypes are STATIC —
no per-frame work needed because trunks/branches/stems/rocks/bushes don't animate
independently in the non-instanced path either (Bush is the exception and gets its
own design choice — see §5.2).

---

## 2. Component breakdown

### 2.1 New `lib/engine/` substrate (renderer-agnostic — no Three.js imports)

| File | Purpose |
|---|---|
| `lib/engine/ecs/tree-trunk-archetype.ts` | TreeTrunkCols + factory; one row per tree (trunk geometry). |
| `lib/engine/ecs/tree-branch-archetype.ts` | TreeBranchCols + factory; one row per branch (4 per tree typical). |
| `lib/engine/ecs/bush-archetype.ts` | BushCols + factory; one row per bush, variant column selects canonical geometry. |
| `lib/engine/ecs/rock-archetype.ts` | RockCols + factory; one row per rock primary + RockChunkCols for chunks (similar to tree split). |
| `lib/engine/ecs/mushroom-archetype.ts` | MushroomCols + factory; one row per mushroom (stem only — cap continues through cycle-1 leaf field). |
| `lib/engine/ecs/wildflower-archetype.ts` | WildflowerCols + factory; one row per wildflower (stem only — bloom continues through cycle-1 leaf field). |
| `lib/engine/index.ts` (extend) | Re-export all new types. |

**Note**: These archetypes have NO accompanying `system.ts` files because the cycle-3
archetypes are STATIC (no per-frame mutation). The cycle-1 `swayLeafSystem` handles
all the actual sway-animation work. If a future cycle needs whole-tree wind effects,
a `treeWindSystem` lands then.

### 2.2 New `app/battle-v2/_components/vfx/effects/` renderers

| File | Purpose |
|---|---|
| `InstancedTreeField.tsx` | Mounts TreeTrunkArchetype + TreeBranchArchetype. 2 InstancedMeshes (trunk + branch cylinders). |
| `InstancedBushField.tsx` | Mounts BushArchetype. N InstancedMeshes (one per canonical bush variant; default N=2). |
| `InstancedRockField.tsx` | Mounts RockArchetype + RockChunkArchetype. Up to N×M InstancedMeshes (one per shape × variant; default 3 shapes × 2 variants = 6). |
| `InstancedMushroomField.tsx` | Mounts MushroomArchetype. 1 InstancedMesh (cylinder stem). |
| `InstancedWildflowerField.tsx` | Mounts WildflowerArchetype. 1 InstancedMesh (cylinder stem). |
| `fixtureExtractors.ts` | Pure functions: `treeSpecsFromPlots`, `bushSpecsFromPlots`, etc. Mirrors `leafExtractors.ts` pattern. |
| `fixtureGeometryVariants.ts` | Module-load-time canonical geometry baking for Bush + Rock variants. |

### 2.3 Modified existing files (additive only — preserves cycle-1 + cycle-2 contracts)

| File | Change |
|---|---|
| `app/battle-v2/_components/vfx/effects/HexPlot.tsx` | Add `suppressFixtures?: ReadonlySet<FixtureKindT>` prop. Skip JSX render per kind when present. `suppressLeaves` prop stays as-is (orthogonal). |
| `app/battle-v2/_components/vfx/effects/BigRealmScene.tsx` | Add InstancedXField mounts (one per kind), driven by new `useInstancedFixtures` config. Pass `suppressFixtures` to each `<HexPlot>`. |
| `app/battle-v2/_components/vfx/effects/InstancedLeafField.tsx` | Swap `<meshToonMaterial>` → `<meshLambertMaterial>` (BLACK-leaves S1 commit 1). |
| `app/battle-v2/_components/vfx/VfxConfig.ts` (or equivalent) | Add `useInstancedFixtures: ReadonlySet<FixtureKindT>` to `BigRealmSceneConfigT` schema. Apply HMR-stale-ref backfill defaults pattern from cycle-2. |
| `lib/engine/index.ts` | Re-export new archetype types. |

### 2.4 Tests (G8, P2 — nice-to-have)

| File | Purpose |
|---|---|
| `lib/engine/ecs/tree-trunk-archetype.test.ts` | Per-archetype factory determinism + Float32 precision. |
| `lib/engine/ecs/tree-branch-archetype.test.ts` | Same shape. |
| `lib/engine/ecs/bush-archetype.test.ts` | Same shape + variant assignment determinism. |
| `lib/engine/ecs/rock-archetype.test.ts` | Same shape + shape/variant matrix. |
| `lib/engine/ecs/mushroom-archetype.test.ts` | Same shape. |
| `lib/engine/ecs/wildflower-archetype.test.ts` | Same shape. |
| `app/battle-v2/_components/vfx/effects/fixtureExtractors.test.ts` | Per-extractor: deterministic spec output for a given seed; consistent across runs. |

---

## 3. lib/engine archetype designs

### 3.1 TreeTrunkArchetype

**Why split trunk + branch into TWO archetypes** (divergence from operator brief's
"ONE TreeArchetype"): a tree's trunk is ONE geometry; its 3-5 branches each have
DIFFERENT matrices (per-branch yaw/pitch/length/thickness from `buildBranches`).
InstancedMesh requires one shared geometry per instance — branches and trunk can't
share. Two archetypes preserve the per-branch matrix variety while keeping each
archetype's column shape flat and instance count clean.

```typescript
// lib/engine/ecs/tree-trunk-archetype.ts
export type TreeTrunkCols = "posX" | "posY" | "posZ" | "rotY" | "scale";

export const TREE_TRUNK_COLUMN_SPECS: readonly ColumnSpec[] = [
  { name: "posX", itemSize: 1 },
  { name: "posY", itemSize: 1 },
  { name: "posZ", itemSize: 1 },
  { name: "rotY", itemSize: 1 },
  { name: "scale", itemSize: 1 },
];
```

- **Renderer** (in `InstancedTreeField`): per-instance matrix from `(posX, posY, posZ)`
  translation + `rotY` Y-rotation + uniform `scale`. Trunk source geometry is a
  tapered cylinder (`cylinderGeometry args=[topRadius, baseRadius, trunkHeight, 7]`)
  baked at module load.
- **Color**: trunk is always `PALETTE.trunk` — no per-instance color column. Set on
  material directly.
- **Outline**: dropped (per cycle-1 outline-on-instanced regression, accepted).

### 3.2 TreeBranchArchetype

```typescript
// lib/engine/ecs/tree-branch-archetype.ts
export type TreeBranchCols =
  | "anchorX" | "anchorY" | "anchorZ"  // tree base + branchOriginY (world space)
  | "parentRotY"                        // tree's whole-tree rotY
  | "yaw" | "pitch"                     // branch-local yaw + pitch (from buildBranches)
  | "length" | "thickness"              // branch dimensions
  ;

export const TREE_BRANCH_COLUMN_SPECS: readonly ColumnSpec[] = [
  { name: "anchorX", itemSize: 1 },
  { name: "anchorY", itemSize: 1 },
  { name: "anchorZ", itemSize: 1 },
  { name: "parentRotY", itemSize: 1 },
  { name: "yaw", itemSize: 1 },
  { name: "pitch", itemSize: 1 },
  { name: "length", itemSize: 1 },
  { name: "thickness", itemSize: 1 },
];
```

- **Renderer** (in `InstancedTreeField`): per-instance matrix composed from:
  ```
  M = translate(anchorX, anchorY, anchorZ)
    × rotY(parentRotY + yaw)
    × rotZ(-pitch)
    × translate(0, length/2, 0)
    × scale(thickness, length, thickness)
  ```
  Branch source geometry is a unit-cylinder (`cylinderGeometry args=[0.55, 1, 1, 5]`).
  The scale `[thickness, length, thickness]` produces a tapered cylinder with top
  radius `0.55*thickness` and base radius `thickness` — matches Tree.tsx exactly.
- **Color**: trunk hue (same as trunk).

### 3.3 BushArchetype

**Trade-off**: Bush.tsx merges 4-6 procedural icospheres into ONE BufferGeometry per
bush (cycle-1 craft note: "one merged geo + one outline + spherical-pivot normals").
Each bush has a UNIQUE merged geometry, which InstancedMesh can't share.

**Design choice** (default for cycle-3, operator pair-point at S2 BushArchetype design):
**Bake 2 canonical bush variants** (small, medium) at module load via `buildPuffCluster`.
Per-bush picks variant by seed. Loses per-bush shape variety; preserves merged-geo
craft (one outline per bush, shared-volume normals per variant).

```typescript
// lib/engine/ecs/bush-archetype.ts
export type BushCols = "posX" | "posY" | "posZ" | "rotY" | "scale" | "variant" | "hueR" | "hueG" | "hueB";

export const BUSH_COLUMN_SPECS: readonly ColumnSpec[] = [
  { name: "posX", itemSize: 1 },
  { name: "posY", itemSize: 1 },
  { name: "posZ", itemSize: 1 },
  { name: "rotY", itemSize: 1 },
  { name: "scale", itemSize: 1 },
  { name: "variant", itemSize: 1 },  // 0 or 1 (index into baked canonical bushes)
  { name: "hueR", itemSize: 1 },
  { name: "hueG", itemSize: 1 },
  { name: "hueB", itemSize: 1 },
];
```

- **Renderer**: split rows by `variant` column at render time; mount 2 InstancedMeshes
  (one per variant), each fed only matching rows.
- **Per-instance color**: via `setColorAt(i, color)` + `vertexColors` on material,
  same as cycle-1 leaf path.
- **Sway**: Bush.tsx had whole-bush useFrame sway. Cycle-3 default = **DROP the sway**
  for instanced bushes (operator visual gate decides if missed). If sway matters,
  add a `BushSwaySystem` (similar to swayLeafSystem) reading rotY column + writing
  back per frame. Defer unless operator flags.

**Alternative shape** (operator pair-point at S2):
- **Per-puff archetype**: BushPuffArchetype with one row per puff (4-6 per bush).
  Loses craft (separate outlines, separate volume normals per puff). Gains shape
  variety. Tradeoff favors craft per cycle-1 doctrine; default = canonical variants.

### 3.4 RockArchetype + RockChunkArchetype

**Same trade-off as Bush**: `buildRockGeometry` is fully procedural per-rock.

**Design choice**: Bake **3 canonical geometries per shape** (boulder × 3, slab × 3,
pebble × 3) at module load via `buildRockGeometry` with fixed seeds. Per-rock picks
shape × variant by seed. 9 canonical RockGeometries total.

```typescript
// lib/engine/ecs/rock-archetype.ts
export type RockCols =
  | "posX" | "posY" | "posZ"     // world position
  | "rotY"                        // variation
  | "scaleX" | "scaleY" | "scaleZ"  // non-uniform (slab squish: 1.25, 0.55, 1.15)
  | "shape" | "variant"           // shape: 0=boulder, 1=slab, 2=pebble; variant: 0..2
  | "hueR" | "hueG" | "hueB"      // per-rock color
  ;

export type RockChunkCols =
  | "posX" | "posY" | "posZ"
  | "rotY"
  | "scale"
  | "variant"  // 0..2 (re-use boulder geometries)
  | "hueR" | "hueG" | "hueB"
  ;
```

- **Renderer** (`InstancedRockField`): split rows by `(shape, variant)` column pair;
  mount up to 9 InstancedMeshes for primaries + up to 3 for chunks. In practice ~6-12
  InstancedMeshes total for rocks. Per-rock matrix from position + rotY + scaleXYZ.
- **Moss puffs**: continue to flow through cycle-1 leaf field via `rockMossLeafSpecs`
  (already exists). No new work for moss.

### 3.5 MushroomArchetype

**Simplest case** — Mushroom.tsx is just a tapered cylinder stem + cap LeafPuff. The
cap continues to flow through cycle-1 leaf field via `mushroomLeafSpecs`. Cycle-3
handles only the stem.

```typescript
// lib/engine/ecs/mushroom-archetype.ts
export type MushroomCols =
  | "posX" | "posY" | "posZ"
  | "rotY"
  | "scale"
  ;
```

- **Renderer** (`InstancedMushroomField`): 1 InstancedMesh, cylinder source baked at
  module load (`cylinderGeometry args=[stemTopRadius, stemBaseRadius, 1, 6]`), per-
  instance matrix from `(posX, posY+0.5*stemHeight*scale, posZ) + rotY + scale`.
- **Color**: stem is always `PALETTE.parchment` — material-level, no per-instance column.

### 3.6 WildflowerArchetype

**Same as Mushroom** — Wildflower.tsx is just a thin tapered cylinder stem + bloom
LeafPuff. Bloom continues through cycle-1 leaf field via `wildflowerLeafSpecs`.

```typescript
// lib/engine/ecs/wildflower-archetype.ts
export type WildflowerCols =
  | "posX" | "posY" | "posZ"
  | "rotY"
  | "scale"
  ;
```

- **Renderer** (`InstancedWildflowerField`): 1 InstancedMesh, cylinder source baked at
  module load (`cylinderGeometry args=[0.04*0.7, 0.04, 1, 5]`), per-instance matrix
  from `(posX, posY+0.5*stemHeight*scale, posZ) + rotY + scale`.
- **Color**: stem is always `#6b8f4a` (matches Wildflower.tsx) — material-level.

---

## 4. App-layer `Instanced<Kind>Field` components

All five components mirror the cycle-1 `InstancedLeafField.tsx` shape:

```typescript
// Template (pseudocode):
interface InstancedXFieldProps {
  readonly specs: readonly XSpec[];
}

export function InstancedXField({ specs }: InstancedXFieldProps) {
  // 1. Memo-build archetype(s) from specs.
  const { archetype, /* side data */ } = useMemo(() => {
    const arch = new Archetype<XCols>(X_COLUMN_SPECS, Math.max(8, specs.length));
    // Populate columns from each spec.
    // …
    return { archetype, /* … */ };
  }, [specs]);

  // 2. Mount InstancedMesh ref(s) — one per geometry variant.
  const meshRefs = /* one per variant */;

  // 3. useEffect uploads per-instance matrices + colors ONCE after mount
  //    (no useFrame needed — geometry is static).
  useEffect(() => {
    // Walk archetype rows, compose matrix per row, setMatrixAt + setColorAt.
    // …
  }, [archetype]);

  // 4. Render one <instancedMesh> per variant.
  return (
    <>
      {/* per variant */}
      <instancedMesh ref={meshRefs[v]} args={[geometry_v, material, count_v]}>
        {/* meshToonMaterial WITHOUT vertexColors (cleaner pattern per §8.3) —
            USE_INSTANCING_COLOR alone enables per-instance color when
            setColorAt() has been called. NO baked color attribute needed
            on the geometry. */}
      </instancedMesh>
    </>
  );
}
```

**Key differences from `InstancedLeafField`** (codex flatline 2026-05-17 corrections):
1. **NO `useFrame`** — cycle-3 archetypes are static. Per-frame cost = ZERO.
2. **`meshToonMaterial` WITHOUT `vertexColors` prop** — preserves cycle-1 cel-band
   craft. The cleaner pattern per §8.3: omit `vertexColors`, rely on
   `USE_INSTANCING_COLOR` alone (set automatically when `setColorAt()` is called).
   NO baked per-vertex `color` attribute needed on the geometry. Earlier draft
   recommended `meshLambertMaterial` based on a wrong diagnosis; codex verified
   that Toon includes the `<color_vertex>` / `<color_fragment>` chunks (Lambert
   was never the issue).
3. **Multiple InstancedMesh per kind** (for Tree/Bush/Rock) — split by variant or
   sub-archetype.

---

## 5. HexPlot integration

### 5.1 `suppressFixtures` prop

```typescript
// HexPlot.tsx — additive prop
interface HexPlotProps {
  readonly plot: PlotT;
  readonly size: number;
  readonly triggerKey?: number;
  readonly cornerYs?: readonly [number, number, number, number, number, number];
  readonly edgeBottomYs?: readonly [readonly [number, number], /* ×6 */];
  readonly suppressLeaves?: boolean;
  /** NEW (cycle-3): per-kind opt-out for fixtures handled by InstancedXField. */
  readonly suppressFixtures?: ReadonlySet<FixtureKindT>;  // default = empty Set
}
```

The fixture-dispatch switch in HexPlot.tsx changes to check `suppressFixtures`:

```typescript
{plot.fixtures.map((fix, i) => {
  if (suppressFixtures?.has(fix.kind)) return null;  // NEW
  // existing dispatch (case "tree", case "rock", etc.)
})}
```

**Back-compat**: when `suppressFixtures` is omitted or empty, behavior is identical
to today. Existing HexPlot callers (HexScene from cycle-1, BigRealmScene from
cycle-2) work unchanged.

### 5.2 `suppressLeaves` vs `suppressFixtures` — orthogonal axes

| Prop | Meaning | Cycle |
|---|---|---|
| `suppressLeaves` | Skip per-fixture `<LeafPuff>` JSX (leaves still rendered via cycle-1 InstancedLeafField) | cycle-1 |
| `suppressFixtures: Set<"tree">` | Skip ENTIRE `<Tree>` JSX (tree-trunk + branches + leaves all suppressed; cycle-3 InstancedTreeField + cycle-1 InstancedLeafField render them) | cycle-3 |

Composition: BigRealmScene typically wants BOTH on for a given kind — `suppressFixtures.has("tree")` skips the Tree JSX, `suppressLeaves: true` ensures the leaves are aggregated into the leaf field (already-cycle-1 behavior). The two flags compose naturally without overlap.

---

## 6. BigRealmScene integration

### 6.1 New `BigRealmSceneConfigT` field

```typescript
// VfxConfig.ts — extend BigRealmSceneConfigT
interface BigRealmSceneConfigT {
  // …existing fields…
  /** Which fixture kinds to render via InstancedXField (instead of HexPlot JSX). */
  useInstancedFixtures: ReadonlySet<FixtureKindT>;
  /** Toggles cycle-1 leaf field for leaves. Composes with useInstancedFixtures. */
  useInstancedLeaves: boolean;  // already exists
}
```

**HMR-stale-ref backfill** (cycle-2 doctrine): the `useInstancedFixtures` field needs
backfilling at `registerKnobs` time so new schema fields don't trip HMR-preserved refs.
Pattern from cycle-2 `d3c411fa` commit (fix(sprint-2-comp): backfill new default fields
into HMR-stale config refs).

### 6.2 New composer section

In `BigRealmScene.tsx`, after the existing `{config.showTileContent && plots.map(...)}`
section, add a block that:

1. Gathers per-kind specs from all plots
2. Mounts one `InstancedXField` per kind in `useInstancedFixtures`
3. Passes `suppressFixtures: useInstancedFixtures` to each `<HexPlot>` so JSX paths
   for those kinds are skipped

```typescript
// Sketch:
const fixtureSpecs = useMemo(() => {
  const worldPositions = plots.map(p => hexToWorld(p.coord, config.hexSize));
  return {
    tree: treeSpecsFromPlots(plots, worldPositions),
    bush: bushSpecsFromPlots(plots, worldPositions),
    rock: rockSpecsFromPlots(plots, worldPositions),
    mushroom: mushroomSpecsFromPlots(plots, worldPositions),
    wildflower: wildflowerSpecsFromPlots(plots, worldPositions),
  };
}, [plots, config.hexSize]);

// In JSX:
{config.useInstancedFixtures.has("tree") && (
  <InstancedTreeField specs={fixtureSpecs.tree} />
)}
{config.useInstancedFixtures.has("bush") && (
  <InstancedBushField specs={fixtureSpecs.bush} />
)}
// …same for rock, mushroom, wildflower
```

And on the HexPlot mount:

```typescript
<HexPlot
  plot={plot}
  size={config.hexSize}
  triggerKey={triggerKey}
  suppressLeaves={config.useInstancedLeaves}
  suppressFixtures={config.useInstancedFixtures}  // NEW
/>
```

---

## 7. Data flow: extractor → archetype → InstancedMesh

```
plots: PlotT[]  ─▶  fixtureExtractors.<kind>SpecsFromPlots(plots, worldPositions)
                          └─ walks plot.fixtures
                          └─ for kind == "tree" → produces TreeSpec[]
                          └─ for kind == "bush" → produces BushSpec[]
                          └─ …
                    ▼
                    specs: TreeSpec[] / BushSpec[] / …
                          (one entry per fixture, plain TS objects)
                    ▼
Instanced<Kind>Field
  ├─ useMemo([specs]):
  │     archetype = new Archetype(X_COLUMN_SPECS, specs.length)
  │     for each spec: archetype.add({ posX, posY, posZ, rotY, scale, … })
  ├─ useEffect([archetype]):
  │     walk rows, compose per-instance Matrix4
  │     mesh.setMatrixAt(i, M); mesh.setColorAt(i, color)
  │     instanceMatrix.needsUpdate = true; instanceColor.needsUpdate = true
  └─ Render <instancedMesh args=[geometry, material, count]>
```

**Determinism**: extractors use `mulberry32(seed)` for variant selection (per existing
fixture extractor patterns). Given a fixed `scatterSeed`, the spec output is
byte-for-byte reproducible.

**Float32 discipline**: TreeSpec / BushSpec / RockSpec / MushroomSpec / WildflowerSpec
interfaces use plain `number` (Float64), but the archetype `add()` converts to Float32
slabs. Tests must use `toBeCloseTo(..., 6)` for math-parity assertions (cycle-1
pattern from `sway-system.test.ts`).

---

## 8. BLACK-leaves fix (S1 commit 1, standalone) — REVISED 2026-05-17 post-codex flatline

### 8.1 The actual root cause (codex flatline a7030a10a29806747 verified)

> **The cycle-1 distillation's diagnosis was wrong.** `meshToonMaterial` DOES include
> the `<color_vertex>` and `<color_fragment>` chunks that consume `instanceColor`
> (verified at `three.module.js:565` / `:567` for Lambert, `:545` / `:547` for Toon).
> Lambert attempt 1 (commit `558707eb`) failed for the SAME reason Toon was failing,
> not because Lambert lacks color support.

The real chain in Three.js 0.184:

```
material.vertexColors = true
  → parameters.vertexColors → '#define USE_COLOR' (in vertex prefix at line 6798)
  → vertex shader declares: attribute vec3 color;
  → vertex shader runs color_vertex chunk (line 341):
      vColor = vec4(1.0);
      vColor.rgb *= color;            // ← THE PROBLEM
      vColor.rgb *= instanceColor.rgb;
```

`IcosahedronGeometry` ships with NO `color` attribute. Per the Khronos GLES 3.0.6 spec
(§1057-1059, §1201), an unbound `attribute vec3 color` resolves to `vec3(0,0,0)`.
Three.js only supplies `defaultAttributeValues` for `ShaderMaterial`, not standard
materials like `MeshToonMaterial` (`three.core.js:37479`, `:37672`). So
`vColor.rgb *= color` = `vColor.rgb *= vec3(0)` = `vec3(0)`, and the subsequent
`vColor.rgb *= instanceColor.rgb` operates on zero.

Result: every leaf renders pure black. NOT because of a shader-chunk gap — because
of a missing per-vertex `color` attribute on the geometry.

### 8.2 Fix as implemented (commit `96d1668b`, attempt 2)

`InstancedLeafField.tsx` now:

1. Constructs `IcosahedronGeometry` imperatively (not via JSX) inside a `useMemo`.
2. Bakes a per-vertex `color` attribute of `Float32Array(vertexCount * 3).fill(1)`
   so `vColor.rgb *= color` = `vColor.rgb * vec3(1)` = no-op.
3. The subsequent `vColor.rgb *= instanceColor.rgb` carries per-instance color into
   `vColor`, and the fragment shader's `<color_fragment>` chunk applies it via
   `diffuseColor.rgb *= vColor.rgb`.
4. Material stays `meshToonMaterial` (cel-band gradient preserved on leaves —
   the cycle-1 craft signal is intact).
5. `useEffect` dispose-on-unmount prevents GPU memory leak.

### 8.3 The CLEANER pattern for the 5 cycle-3 archetypes (recommended)

> **All NEW archetypes (Tree / Bush / Rock / Mushroom / Wildflower) SHOULD use this
> pattern, NOT the InstancedLeafField pattern.**

The simpler approach (codex flatline finding, MEDIUM priority): omit `vertexColors`
entirely and rely on `USE_INSTANCING_COLOR` alone.

```tsx
<meshToonMaterial
  gradientMap={DEFAULT_TOON_GRADIENT}
  color="#ffffff"
  // NO vertexColors prop
/>
```

In Three.js 0.184, when `InstancedMesh.instanceColor !== null` (i.e. `setColorAt()`
has been called at least once), the renderer sets `USE_INSTANCING_COLOR`. This
define enables the `vColor.rgb *= instanceColor.rgb` line in the vertex shader
AND enables `<color_fragment>` (`diffuseColor.rgb *= vColor.rgb`) in the fragment
shader. Critically, with `USE_INSTANCING_COLOR` set but `USE_COLOR` NOT set in the
vertex prefix (vertex prefix uses `parameters.vertexColors` alone at line 6798,
NOT OR'd), the `vColor.rgb *= color` line does NOT execute, so the unbound `color`
attribute issue never arises — no baked attribute needed.

Per codex: "Keeping vertexColors means every future leaf geometry must keep a
nonzero color attribute" (maintenance footgun). The cleaner pattern avoids that.

### 8.4 Why InstancedLeafField keeps the workaround pattern

`InstancedLeafField.tsx` ships at commit `96d1668b` with the vertexColors + baked
color attribute pattern. It works correctly. Refactoring to the cleaner pattern
mid-cycle adds risk (operator already visually validated this pattern); the
operator visual gate is the load-bearing signal, and pattern simplification is
LOW-severity per codex code review.

> **Cycle-4 cleanup candidate**: refactor InstancedLeafField to drop vertexColors
> + the baked color attribute, aligning with the pattern used by cycle-3 archetypes.
> Strict additive constraint applies: no behavior change visible to operators.

### 8.5 Operator visual validation gate (FR-1.2) — RESULT

`vfx-lab → hex-scene` with `useInstancedLeaves` ON (commit `96d1668b`):
- Per-instance leaf colors render correctly ✅
- Cel-band gradient on leaves preserved ✅
- Ink outline (drei `<Outlines>`) lost on instanced leaves — **expected**, matches
  cycle-1 accepted regression per sprint.md NFR-1 (drei `<Outlines>` builds an
  inverted-hull mesh that doesn't natively support InstancedMesh)

### 8.6 Why the fix landed FIRST in S1 (vs folded into TreeArchetype)

- **Standalone scope**: targeted commit, easy to revert; clear visual evaluation.
- **Validates render path for ALL 5 archetypes**: per §8.3, the cleaner pattern
  is now confirmed across vertex + fragment shader prefixes. The 5 cycle-3
  archetypes can adopt the cleaner pattern with confidence.
- **Cheap visual gate**: ~15-min visual eval at S1 commit-1; if pivot was needed,
  blast radius was contained to InstancedLeafField only.
- **Codex flatline corroboration**: source-grounded verification of the diagnosis
  at the time the fix landed (rather than discovering shader-chain issues later).

---

## 9. Test strategy

### 9.1 Existing tests stay green (NFR-2)

- `lib/engine/ecs/archetype.test.ts` — Archetype mechanics (swap-remove, capacity grow,
  zero-fill-on-add). Cycle-1 baseline.
- `lib/engine/animation/sway-system.test.ts` — Leaf sway math + Float32 discipline.
- `lib/hex/plot.test.ts` — PlotT decode/encode (cycle-2 baseline).

### 9.2 New tests (G8, P2)

Per-archetype determinism tests:
```typescript
describe("treeSpecsFromPlots", () => {
  it("produces deterministic specs for fixed seed", () => {
    const plots = [/* 2 plots with tree fixtures */];
    const specs1 = treeSpecsFromPlots(plots, [[0, 0], [10, 0]]);
    const specs2 = treeSpecsFromPlots(plots, [[0, 0], [10, 0]]);
    expect(specs1.length).toBe(specs2.length);
    for (let i = 0; i < specs1.length; i++) {
      expect(specs1[i].posX).toBeCloseTo(specs2[i].posX, 6);
      // …
    }
  });

  it("trunk + 4 branches per tree (default branchCount)", () => {
    const specs = treeSpecsFromPlots(/* 1 tree fixture */, [[0, 0]]);
    expect(specs.trunks).toHaveLength(1);
    expect(specs.branches).toHaveLength(4);
  });
});
```

Per-archetype factory tests (mirror Archetype mechanics tests):
```typescript
describe("TreeTrunkArchetype", () => {
  it("zero-fills omitted columns", () => {
    const arch = new Archetype<TreeTrunkCols>(TREE_TRUNK_COLUMN_SPECS);
    arch.add({ posX: [5] });
    expect(arch.columnArray("posY")[0]).toBe(0);
  });
});
```

### 9.3 What's NOT tested (operator visual gates)

- Per-instance color rendering (requires GL context — operator visual eval)
- Visual parity instanced vs non-instanced (requires browser — operator visual eval)
- Outline regression on instanced fixtures (known accepted regression)
- 60 fps @ 25×25 convergence (requires browser — operator perf eval)

---

## 10. Sequencing / rollout

### 10.1 Sprint shape (matches PRD §FR-1/2/3/4)

```
S1: BLACK-leaves fix + Tree archetype path
    commit 1: InstancedLeafField → meshLambertMaterial (FR-1)
              [OPERATOR VISUAL GATE — proceed only if visual acceptable]
    commit 2: TreeTrunkArchetype + TreeBranchArchetype + InstancedTreeField
              + treeSpecsFromPlots extractor
    commit 3: HexPlot suppressFixtures prop + BigRealmScene useInstancedFixtures
              config + InstancedTreeField mount
    commit 4: scale-test 10×10 with tree-instanced ON; PerfReadout shows GEO drop;
              operator visual A/B
              [S1→S2 pair-point]

S2: Bush + Rock + Mushroom + Wildflower archetypes
    commit 5: BushArchetype + InstancedBushField + canonical bush variants
              [OPERATOR PAIR-POINT: per-bush canonical vs per-puff fanout]
    commit 6: RockArchetype + RockChunkArchetype + InstancedRockField
              + canonical rock variants per shape
    commit 7: MushroomArchetype + InstancedMushroomField
    commit 8: WildflowerArchetype + InstancedWildflowerField
    commit 9: HexPlot suppressFixtures extends to all 5 kinds; BigRealmScene
              mounts all 5 InstancedXFields
              [S2→S3 pair-point]

S3: Scale-test convergence + RESULTS.md + cycle close
    commit 10: scale-test 5×5 / 10×10 / 25×25 with all instanced ON, ambients OFF
    commit 11: scale-test 5×5 / 10×10 / 25×25 with all instanced ON, ambients ON
    commit 12: RESULTS.md captures measurements + visual A/B observations
              [S3 close pair-point — if not converged, name cycle-4 earned-next]
```

Per cycle 1+2 Path B convention: each commit is a sprint task tracked in beads,
each sprint runs through `/run sprint-plan` (implement → review → audit cycle) with
cross-model dissent (Opus + GPT via cheval, 2-model DEGRADED mode) at REVIEW and
AUDIT gates. The visual gates at commit 1 + S1→S2 + S2→S3 are operator pair-points.

### 10.2 Each sprint earns its keep

| Sprint | Earns when | Doesn't earn |
|---|---|---|
| S1 | InstancedTreeField at 10×10 shows GEO drop AND visual parity with non-instanced | OR pivots BLACK-leaves fix to onBeforeCompile / custom shader if Lambert visual fails |
| S2 | All 4 remaining archetypes integrate via suppressFixtures without breaking back-compat | OR pair-points on BushArchetype design if canonical-variants approach feels too restrictive |
| S3 | 60+ fps @ 25×25 ambients ON (G1 met) OR PARTIAL close with named cycle-4 earned-next | — (S3 always closes; PARTIAL is a valid close per cycles 1+2 precedent) |

---

## 11. Risks (architecture-specific, complements PRD §Risks)

| Risk | Mitigation |
|---|---|
| TWO archetype split for Tree (trunk + branch) diverges from operator's "ONE TreeArchetype" mental model | Surface explicitly in this SDD §3.1. Architecture preserves visual parity (load-bearing); naming-divergence is cosmetic. If operator wants single-archetype shape, refactor S1 commit 2 to bake N-branches into a packed branch-columns layout (one row per tree with 4×8-float branch column packed) — workable but messier. Pair-point at S1 if operator flags. |
| Bush canonical-variants loses per-bush shape variety | Operator visual gate at S2 commit 5. If miss is felt, refactor to per-puff fanout (BushPuffArchetype). One bush = 4-6 instance rows. Loses merged-geo craft (separate outlines per puff). |
| Rock canonical-variants loses per-rock shape variety | Same as Bush. Operator gate at S2 commit 6. Likely less visible than Bush because rocks read as silhouette + texture, not finely individuated. |
| `meshLambertMaterial` swap on InstancedLeafField regresses leaf cel-band visibly | S1 commit 1 operator visual gate. Pivot to onBeforeCompile or custom shader before TreeArchetype work begins. |
| Sub-archetype geometry merging produces MORE InstancedMeshes than expected (e.g., InstancedRockField at 9 variants × 2 chunks-archetypes = 27 InstancedMeshes) | Cap variant count: Rock at 2 variants per shape (= 6 primaries + 3 chunks = 9 InstancedMeshes). Bush at 2 variants (= 2 InstancedMeshes). Tree at 2 (trunk + branches). Mushroom + Wildflower at 1 each. Total ceiling: 9 + 2 + 2 + 1 + 1 = 15 InstancedMeshes for fixtures. Acceptable (target ~10-30). |
| Static-archetype design assumes fixtures don't animate; if operator wants whole-tree wind sway later, add a TreeWindSystem then | Defer until requested. The substrate supports adding systems incrementally (cycle-1 pattern). |
| Per-instance color upload (`setColorAt`) in useEffect doesn't trigger on prop change without reseed | Memoize `colorsHex` array on `specs`; useEffect depends on it. Same pattern as cycle-1 InstancedLeafField. |
| Operator-untracked files in vfx/effects/ (e.g., LeafSwirl.tsx, Mist.tsx, RippleField.tsx, …) accidentally edited | Additive constraint: NEW files only for archetypes + InstancedXField + fixtureExtractors. Modifications restricted to HexPlot.tsx, BigRealmScene.tsx, InstancedLeafField.tsx, lib/engine/index.ts, VfxConfig.ts. Each commit reviewed for additive-only compliance. |

---

## 12. File-creation manifest

### 12.1 New files (additive)

```
lib/engine/ecs/
  tree-trunk-archetype.ts
  tree-branch-archetype.ts
  bush-archetype.ts
  rock-archetype.ts
  mushroom-archetype.ts
  wildflower-archetype.ts
  tree-trunk-archetype.test.ts        (G8, P2)
  tree-branch-archetype.test.ts       (G8, P2)
  bush-archetype.test.ts              (G8, P2)
  rock-archetype.test.ts              (G8, P2)
  mushroom-archetype.test.ts          (G8, P2)
  wildflower-archetype.test.ts        (G8, P2)

app/battle-v2/_components/vfx/effects/
  InstancedTreeField.tsx
  InstancedBushField.tsx
  InstancedRockField.tsx
  InstancedMushroomField.tsx
  InstancedWildflowerField.tsx
  fixtureExtractors.ts
  fixtureGeometryVariants.ts
  fixtureExtractors.test.ts           (G8, P2)
```

### 12.2 Modified files (additive only — no behavior change for existing callers)

```
lib/engine/index.ts                                         (re-exports)
app/battle-v2/_components/vfx/effects/HexPlot.tsx           (add suppressFixtures prop)
app/battle-v2/_components/vfx/effects/BigRealmScene.tsx     (mount InstancedXFields)
app/battle-v2/_components/vfx/effects/InstancedLeafField.tsx  (meshToon → meshLambert)
app/battle-v2/_components/vfx/VfxConfig.ts (or schema dir)  (add useInstancedFixtures field)
```

### 12.3 Files NOT touched (operator in-flight work — additive constraint)

```
ALL other operator-untracked .tsx files in app/battle-v2/_components/vfx/effects/
  (LeafSwirl, Mist, RippleField, Embers, DustMotes, Sparks, PuruhaniWalker,
   ZoneMonument, MountainRing, ZoneScene, PollenMotes, RealmScene, etc.)
ALL files in app/battle-v2/_components/world/ (palette, Foliage, clusterGeometry)
ALL files in lib/hex/ (plot, biome, decorator, zone, etc.)
ALL files in lib/wuxing/ (element, resonance, timeOfDay)
```

---

## 13. Provenance

- Session 19, 2026-05-17
- Operator: zksoju
- Branch: `feat/ecs-leaves-2026-05-17`
- Method: `/simstim-workflow` Path B — focused SDD, no full Flatline SDD ceremony
- Mode: ARCH (OSTROM) + craft lens (ALEXANDER) + k-hole-as-teacher
- Operator pacing: kaironic + teaching · pair-points at sprint boundaries
- Architectural decisions surfaced for operator pair-point:
  - **Tree split into TWO archetypes** (trunk + branch) instead of operator brief's "ONE TreeArchetype" — preserves per-branch matrix variety
  - **Bush + Rock use canonical-variants** instead of per-fixture procedural geometry — preserves cycle-1 craft quality (merged-geo + one outline) at the cost of per-fixture shape variety
  - **Cycle-3 archetypes are STATIC (no useFrame)** — sway already lives in cycle-1 leaf field; Bush whole-bush sway is dropped on the instanced path (operator visual gate decides)
  - **All instanced fixtures use `meshLambertMaterial`** — same shader-path constraint as BLACK-leaves fix; loses toon 2-band on instanced paths (accepted, same trade-off cycle-1 made for leaves)
