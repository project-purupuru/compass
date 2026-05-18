/**
 * BushArchetype — one row per bush. Per-instance position + rotY + scale +
 * per-instance hue. Geometry is ONE canonical merged-puff-cluster baked at
 * module load (per fixtureGeometryVariants.ts BUSH_GEOMETRY).
 *
 * Per SDD §3.3 (cycle fixture-ecs-instancing-2026-05-17, S2-T2 added post-
 * worst-case-measurement). The architectural novelty Bush teaches: merged-
 * geometry-per-fixture (vs per-instance procedural). Cycle-1 craft
 * principle preserved: ONE mesh = ONE outline = no overlapping ink.
 *
 * **Deviation from SDD**: SDD §3.3 proposed 2 canonical variants (small +
 * medium). This implementation ships ONE variant per operator over-
 * optimization pushback (matches Rock pattern). Visual variety comes from
 * per-instance SCALE + per-instance HUE; per-bush shape variety is the
 * trade-off accepted.
 *
 * **Sway dropped on instanced path**: Bush.tsx had whole-bush useFrame
 * sway via group.rotation.y/z. Instanced path is static. If operator visual
 * gate flags missing sway, future cycle can add a BushSwaySystem (mirrors
 * cycle-1's swayLeafSystem pattern reading rotY column).
 *
 * Static — no per-frame mutation by cycle-3 code.
 */

import type { ColumnSpec } from "./archetype";

/**
 * Column names: posXYZ (3) + rotY (1) + scale (1) + hueRGB (3) = 8 floats.
 *
 * Renderer (InstancedBushField): per-instance matrix:
 *   T(posX, posY, posZ) × R_Y(rotY) × S(scale, scale, scale)
 * Plus setColorAt(i, color) per instance for per-bush hue variation.
 */
export type BushCols =
  | "posX"
  | "posY"
  | "posZ"
  | "rotY"
  | "scale"
  | "hueR"
  | "hueG"
  | "hueB";

export const BUSH_COLUMN_SPECS: readonly ColumnSpec[] = [
  { name: "posX", itemSize: 1 },
  { name: "posY", itemSize: 1 },
  { name: "posZ", itemSize: 1 },
  { name: "rotY", itemSize: 1 },
  { name: "scale", itemSize: 1 },
  { name: "hueR", itemSize: 1 },
  { name: "hueG", itemSize: 1 },
  { name: "hueB", itemSize: 1 },
];
