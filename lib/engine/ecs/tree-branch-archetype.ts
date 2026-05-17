/**
 * TreeBranchArchetype — one row per branch (4 per tree typical), columns for
 * the branch's per-instance matrix anchored to its parent tree's branch origin.
 *
 * Per SDD §3.2 (cycle-3 fixture-ecs-instancing-2026-05-17). Tree.tsx's
 * `buildBranches(seed, count)` produces per-branch yaw / pitch / length /
 * thickness, and each branch's transform is:
 *
 *   M = translate(anchorPos)                       // tree base + branchOriginY
 *     * rotY(parentRotY + yaw)                     // tree facing + branch yaw
 *     * rotZ(-pitch)                               // branch pitch
 *     * translate(0, length/2, 0)                  // cylinder origin → center
 *     * scale(thickness, length, thickness)        // tapered cylinder dimensions
 *
 * Branch source geometry is a unit tapered cylinder
 * (`cylinderGeometry args=[0.55, 1, 1, 5]`); per-instance scale
 * `[thickness, length, thickness]` produces top radius = 0.55*thickness,
 * base radius = thickness, height = length — matches Tree.tsx exactly.
 *
 * Static columns only: branches don't sway in the non-instanced path either
 * (only leaves at branch tips do, handled by cycle-1 InstancedLeafField).
 */

import type { ColumnSpec } from "./archetype";

/**
 * Column names for the tree-branch archetype. Use as the type parameter for
 * Archetype: `new Archetype<TreeBranchCols>(TREE_BRANCH_COLUMN_SPECS, count)`.
 */
export type TreeBranchCols =
  | "anchorX"
  | "anchorY"
  | "anchorZ"
  | "parentRotY"
  | "yaw"
  | "pitch"
  | "length"
  | "thickness";

/**
 * Column layout: anchor (3) + parentRotY (1) + yaw (1) + pitch (1) + length (1)
 * + thickness (1) = 8 floats per row. Cache-friendly Float32 packing.
 *
 * Why anchor + parentRotY are duplicated per branch (not a join to trunk
 * archetype): the renderer (InstancedTreeField, T3) processes branches in a
 * tight inner loop without lookups — each row carries everything needed to
 * compose its matrix. The extractor (treeSpecsFromPlots) replicates the
 * tree's anchor/rotY into each branch row at build time.
 */
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
