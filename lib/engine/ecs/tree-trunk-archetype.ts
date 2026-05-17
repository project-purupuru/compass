/**
 * TreeTrunkArchetype — one row per tree, columns for the trunk's per-instance
 * matrix (position + rotation + scale).
 *
 * Per SDD §3.1 (cycle-3 fixture-ecs-instancing-2026-05-17). Tree's trunk is
 * always a single tapered cylinder geometry (matching Tree.tsx's
 * `cylinderGeometry args=[topRadius, baseRadius, trunkHeight, 7]`), so one
 * InstancedMesh instance per tree carries all the trunk data needed.
 *
 * Branches are a separate archetype (see tree-branch-archetype) because each
 * tree has 3-5 branches with different yaw/pitch/length/thickness — those
 * can't share a single InstancedMesh row with the trunk.
 *
 * Static columns only: no per-frame mutation needed (cycle-3 archetypes are
 * static; cycle-1's swayLeafSystem handles all sway on leaves separately).
 */

import type { ColumnSpec } from "./archetype";

/**
 * Column names for the tree-trunk archetype. Use as the type parameter for
 * Archetype: `new Archetype<TreeTrunkCols>(TREE_TRUNK_COLUMN_SPECS, count)`.
 */
export type TreeTrunkCols = "posX" | "posY" | "posZ" | "rotY" | "scale";

/**
 * Column layout: position (3 scalars) + rotY (1 scalar) + scale (1 scalar) =
 * 5 floats per row. Tight Float32 packing per cycle-1 substrate doctrine.
 *
 * Renderer (InstancedTreeField, T3): per-instance matrix composed as:
 *   M = translate(posX, posY, posZ) * rotY(rotY) * scale(scale, scale, scale)
 * Trunk source geometry is a tapered cylinder baked at module load with
 * canonical proportions (topRadius=0.075, baseRadius=0.13, height=1.05);
 * per-instance `scale` produces the actual tree size.
 */
export const TREE_TRUNK_COLUMN_SPECS: readonly ColumnSpec[] = [
  { name: "posX", itemSize: 1 },
  { name: "posY", itemSize: 1 },
  { name: "posZ", itemSize: 1 },
  { name: "rotY", itemSize: 1 },
  { name: "scale", itemSize: 1 },
];
