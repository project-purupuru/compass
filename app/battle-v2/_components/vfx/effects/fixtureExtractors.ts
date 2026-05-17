/**
 * fixtureExtractors — pure functions that compute per-fixture instance data
 * (positions, rotations, scales, per-archetype columns) from PlotT.fixtures
 * for the cycle-3 fixture-ecs-instancing path.
 *
 * Sibling to `leafExtractors.ts` (cycle-1) which handles leaf-puff
 * instancing. This module handles the fixture-body geometry — trunks,
 * branches, bush bodies, rock primaries, mushroom stems, wildflower stems.
 *
 * Each extractor mirrors the JSX math in its corresponding fixture .tsx
 * file (Tree.tsx, Bush.tsx, etc.) so visual parity holds at static frames.
 *
 * Per SDD §3 + §7 (cycle fixture-ecs-instancing-2026-05-17). All extractors
 * are pure — given a fixed seed, they produce byte-identical specs. Tested
 * via fixtureExtractors.test.ts (Float32 precision-aware per cycle-1
 * substrate doctrine).
 *
 * Architecture: extractors produce plain TS objects; InstancedXField
 * components consume the specs and populate Float32 archetype columns
 * via Archetype.add(). The substrate (lib/engine) stays renderer-agnostic.
 */

import type { FixtureRefT, PlotT } from "@/lib/hex/plot";

import { PALETTE } from "../../world/palette";

import { mulberry32 } from "../../world/Foliage";
import { buildBranches } from "./Tree";

// ── Shared types ───────────────────────────────────────────────────────────

type FixtureKindT = FixtureRefT["kind"];

// ── Tree ───────────────────────────────────────────────────────────────────

/**
 * One row of TreeTrunkArchetype. World-space.
 *
 * Mirrors Tree.tsx:99-112 trunk mesh placement:
 *   <mesh position={[0, trunkHeight / 2, 0]} scale={[scale, 1, scale]}>
 *     <cylinderGeometry args={[trunkTopRadius, trunkBaseRadius, trunkHeight, 7]} />
 *
 * The world position carried here is the TREE BASE (fixture-anchor in
 * world coords). The renderer's per-instance matrix translates by this,
 * then offsets the cylinder origin by trunkHeight/2 via the baked source
 * geometry (geometry origin sits at cylinder center, so we pre-translate
 * to half-trunk-height in the source geometry).
 */
export interface TreeTrunkSpec {
  readonly worldPosition: readonly [number, number, number];
  /** Whole-tree Y-rotation in radians. 0 = no rotation (visual parity with Tree.tsx). */
  readonly rotY: number;
  /** Uniform scale multiplier (matches Tree.tsx's `scale` prop). */
  readonly scale: number;
}

/**
 * One row of TreeBranchArchetype. World-space anchor, branch-local rotation.
 *
 * Mirrors Tree.tsx:114-160 branch group placement:
 *   <group position={[0, branchOriginY, 0]} rotation={[0, b.yaw, 0]}>
 *     <group rotation={[0, 0, -b.pitch]}>
 *       <mesh position={[0, blen / 2, 0]}>
 *         <cylinderGeometry args={[bthick * 0.55, bthick, blen, 5]} />
 *
 * Where:
 *   branchOriginY = trunkHeight * 0.7 = (scale * 1.05) * 0.7
 *   blen = b.length * scale
 *   bthick = b.thickness * scale
 *
 * Renderer (InstancedTreeField, T3) composes the matrix as:
 *   translate(anchor) * rotY(parentRotY + yaw) * rotZ(-pitch)
 *     * translate(0, length/2, 0) * scale(thickness, length, thickness)
 *
 * Branch source geometry: unit cylinder `cylinderGeometry(0.55, 1, 1, 5)`.
 * Per-instance scale produces the tapered branch (top = 0.55*thickness,
 * base = thickness, height = length).
 */
export interface TreeBranchSpec {
  /** World-space anchor point: tree base + (0, branchOriginY, 0). */
  readonly anchorPosition: readonly [number, number, number];
  /** Parent tree's whole-tree rotY (replicated per branch so renderer
   *  doesn't need a join). 0 when parent tree's rotY is 0. */
  readonly parentRotY: number;
  /** Branch yaw in radians (from Tree.tsx buildBranches). */
  readonly yaw: number;
  /** Branch pitch in radians (from Tree.tsx buildBranches). */
  readonly pitch: number;
  /** Branch length in world units (b.length * tree.scale). */
  readonly length: number;
  /** Branch thickness in world units (b.thickness * tree.scale). */
  readonly thickness: number;
}

/**
 * Aggregate output of treeSpecsFromPlots: trunks + branches, both arrays
 * sized independently. trunks.length = tree-fixture count. branches.length
 * = trunks.length × DEFAULT_TREE_BRANCH_COUNT.
 */
export interface TreeSpecs {
  readonly trunks: readonly TreeTrunkSpec[];
  readonly branches: readonly TreeBranchSpec[];
}

/**
 * Default branch count matches Tree.tsx default (branchCount=4).
 *
 * If we add per-tree branchCount variety (e.g., 3-5 randomized), update this
 * to read from the fixture's variant field. Cycle-3 keeps it constant for
 * visual parity with current Tree.tsx callers.
 */
export const DEFAULT_TREE_BRANCH_COUNT = 4;

/**
 * Walk plots' fixtures, produce TreeTrunkSpec[] + TreeBranchSpec[] for every
 * fixture of kind "tree".
 *
 * Caller responsibility: pass `plotWorldPositions[i]` for `plots[i]`.
 * Typically: `plots.map(plot => hexToWorld(plot.coord, hexSize))`.
 *
 * Fixture-kind dispatch happens here (not via a switch on every fixture in
 * the renderer). Other fixture-kind extractors will live alongside in this
 * file (S2-T1 bushSpecsFromPlots, S2-T2 rockSpecsFromPlots, etc.).
 */
export function treeSpecsFromPlots(
  plots: ReadonlyArray<PlotT>,
  plotWorldPositions: ReadonlyArray<readonly [number, number]>,
): TreeSpecs {
  if (plots.length !== plotWorldPositions.length) {
    throw new Error(
      `treeSpecsFromPlots: plot count ${plots.length} !== positions count ${plotWorldPositions.length}`,
    );
  }

  const trunks: TreeTrunkSpec[] = [];
  const branches: TreeBranchSpec[] = [];

  for (let p = 0; p < plots.length; p++) {
    const plot = plots[p];
    const [worldX, worldZ] = plotWorldPositions[p];
    const elev = plot.elevation;

    for (const fix of plot.fixtures) {
      if (fix.kind !== "tree") continue;

      // Tree base in world space: plot world + fixture offset, sits on cap.
      const treeX = worldX + fix.offset[0];
      const treeY = elev;
      const treeZ = worldZ + fix.offset[1];
      const treeScale = fix.scale;

      // Trunk spec — one per tree.
      trunks.push({
        worldPosition: [treeX, treeY, treeZ],
        // Visual parity with Tree.tsx (no per-tree rotation today).
        // Future variety: derive from fix.seed for per-tree rotY jitter.
        rotY: 0,
        scale: treeScale,
      });

      // Branch specs — N per tree (default 4).
      // buildBranches(seed + 7, count) matches Tree.tsx:88-90 exactly.
      const trunkHeight = treeScale * 1.05;
      const branchOriginY = trunkHeight * 0.7;
      const branchData = buildBranches(fix.seed + 7, DEFAULT_TREE_BRANCH_COUNT);

      for (const b of branchData) {
        branches.push({
          anchorPosition: [treeX, treeY + branchOriginY, treeZ],
          parentRotY: 0,
          yaw: b.yaw,
          pitch: b.pitch,
          length: b.length * treeScale,
          thickness: b.thickness * treeScale,
        });
      }
    }
  }

  return { trunks, branches };
}

// ── Rock ───────────────────────────────────────────────────────────────────

export type RockShape = "boulder" | "slab" | "pebble";

/**
 * One row of RockArchetype. Carries world-space position (with shape-specific
 * yOffset baked in), Y-rotation, non-uniform XYZ scale (handles slab squish),
 * shape tag (selects geometry pool in renderer), and per-instance hex hue.
 *
 * Used for BOTH primary rocks and their chunks (decorative companions) —
 * see fixture-ecs-instancing-2026-05-17 SDD §3.4 + rock-archetype.ts header
 * for the one-archetype-not-two design rationale.
 *
 * Mirrors Rock.tsx:
 *   <group position={[px, py + yOffset, pz]}>
 *     <mesh geometry={...} scale={primaryScale}>...</mesh>
 *     {chunks.map(c => <mesh ... scale={cs}>...</mesh>)}
 *   </group>
 *
 * Where yOffset, primaryScale, chunkScale, and hue all derive from Rock.tsx
 * formulas (replicated below in rockSpecsFromPlots).
 */
export interface RockSpec {
  readonly worldPosition: readonly [number, number, number];
  readonly rotY: number;
  /** Non-uniform XYZ scale. Boulder + pebble = uniform; slab = squashed. */
  readonly scale: readonly [number, number, number];
  /** Geometry pool selector. Boulder + slab share boulder pool; pebble uses pebble pool. */
  readonly shape: RockShape;
  /** Per-instance hex color string (e.g. "#9aa0a8"). Renderer converts via Color.set(). */
  readonly hue: string;
}

/**
 * Walk plots' fixtures, produce RockSpec[] for every fixture of kind "rock".
 *
 * Returns ALL rock-kind instances (primaries + chunks) in one flat array —
 * the renderer (InstancedRockField) groups by shape at render time to
 * dispatch to the correct geometry pool's InstancedMesh.
 *
 * Mirrors Rock.tsx EXACTLY for visual parity:
 *   - effectiveScale = isPebble ? scale * 0.45 : scale
 *   - yOffset        = effectiveScale * (isPebble ? 0.18 : isSlab ? 0.22 : 0.4)
 *   - primaryScale   = depends on shape (see Rock.tsx:137-143)
 *   - hue            = pick from PALETTE.stone (20% chance PALETTE.stoneLichen)
 *   - chunks         = 1-2 per non-pebble rock, smaller scale, offset position
 */
export function rockSpecsFromPlots(
  plots: ReadonlyArray<PlotT>,
  plotWorldPositions: ReadonlyArray<readonly [number, number]>,
): RockSpec[] {
  if (plots.length !== plotWorldPositions.length) {
    throw new Error(
      `rockSpecsFromPlots: plot count ${plots.length} !== positions count ${plotWorldPositions.length}`,
    );
  }

  const out: RockSpec[] = [];

  for (let p = 0; p < plots.length; p++) {
    const plot = plots[p];
    const [worldX, worldZ] = plotWorldPositions[p];
    const elev = plot.elevation;

    for (const fix of plot.fixtures) {
      if (fix.kind !== "rock") continue;

      // Rock base in world: plot world + fixture offset, sits on cap.
      const px = worldX + fix.offset[0];
      const py = elev;
      const pz = worldZ + fix.offset[1];
      const scale = fix.scale;

      // Shape from variant tag (Rock.tsx: variant "slab" | "pebble" | else "boulder").
      const shape: RockShape =
        fix.variant === "slab"
          ? "slab"
          : fix.variant === "pebble"
            ? "pebble"
            : "boulder";

      const isPebble = shape === "pebble";
      const isSlab = shape === "slab";
      const effectiveScale = isPebble ? scale * 0.45 : scale;

      // yOffset matches Rock.tsx:135.
      const yOffset = effectiveScale * (isPebble ? 0.18 : isSlab ? 0.22 : 0.4);

      // primaryScale matches Rock.tsx:137-143.
      const primaryScale: readonly [number, number, number] = isPebble
        ? [effectiveScale, effectiveScale * 0.4, effectiveScale]
        : isSlab
          ? [effectiveScale * 1.25, effectiveScale * 0.55, effectiveScale * 1.15]
          : [effectiveScale, effectiveScale, effectiveScale];

      // Hue: 20% chance lichen, 80% chance stone. Matches Rock.tsx:108-116.
      const hueRand = mulberry32(fix.seed + 2);
      const hue =
        hueRand() < 0.2
          ? PALETTE.stoneLichen[
              Math.floor(hueRand() * PALETTE.stoneLichen.length)
            ]!
          : PALETTE.stone[Math.floor(hueRand() * PALETTE.stone.length)]!;

      out.push({
        worldPosition: [px, py + yOffset, pz],
        rotY: 0, // visual parity with Rock.tsx (no per-rock rotation)
        scale: primaryScale,
        shape,
        hue,
      });

      // Chunks: 1-2 per non-pebble rock. Matches Rock.tsx:74-105.
      if (!isPebble) {
        const chunkCountRand = mulberry32(fix.seed + 222);
        const chunkCount = 1 + Math.floor(chunkCountRand() * 2); // 1 or 2

        const chunkOffsetRand = mulberry32(fix.seed + 4444);

        // Chunk hue: slightly different from primary (Rock.tsx:118-123).
        const chunkHueRand = mulberry32(fix.seed + 333);
        const altStones = PALETTE.stone.filter((s) => s !== hue);
        const chunkHue =
          altStones[Math.floor(chunkHueRand() * altStones.length)] ?? hue;

        for (let i = 0; i < chunkCount; i++) {
          const angle = chunkOffsetRand() * Math.PI * 2;
          const dist = effectiveScale * (0.55 + chunkOffsetRand() * 0.25);
          const chunkScale =
            effectiveScale * (0.22 + chunkOffsetRand() * 0.18);

          out.push({
            // chunk world position: primary position (with yOffset) + chunk offset.
            worldPosition: [
              px + Math.cos(angle) * dist,
              py + yOffset + chunkScale * 0.3,
              pz + Math.sin(angle) * dist,
            ],
            rotY: 0,
            scale: [chunkScale, chunkScale, chunkScale],
            shape: "boulder", // chunks always use boulder geometry pool
            hue: chunkHue,
          });
        }
      }
    }
  }

  return out;
}

// ── Future extractors (S2 scope, defined here for forward-reference) ──────

/**
 * Placeholder type — bushSpecsFromPlots lands in S2-T2.
 *
 * Per cycle-3 scope decision 2026-05-17: only Rock + Bush ship instancing
 * (the architecturally novel cases). Mushroom + Wildflower stay per-React
 * because they're pattern-repetition with Tree (single cylinder stem +
 * leaf-puff cap continuing through leaf field).
 */
export type BushSpec = never;

// ── Fixture-kind dispatch utility (forward-looking) ────────────────────────

/**
 * Type-safe check for whether a fixture kind has an extractor in this module
 * (vs. continuing through the per-React HexPlot dispatch). Returns false for
 * kinds without instanced support; cycle-3 ships extractors for tree + rock
 * + bush (S2-T2 pending). Mushroom, wildflower, grass-field, structure,
 * character, fallen-log all stay per-React.
 *
 * The cycle-3 SuppressFixtures Set passed to HexPlot drives the other side
 * of this dispatch (HexPlot skips dispatch for kinds in the Set).
 */
export function fixtureKindHasInstancedExtractor(
  kind: FixtureKindT,
): boolean {
  switch (kind) {
    case "tree":
    case "rock":
      return true;
    // S2-T2 will add: case "bush"
    default:
      return false;
  }
}
