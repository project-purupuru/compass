/**
 * MushroomArchetype — one row per mushroom STEM. Per-instance position +
 * rotY + scale. NO per-instance color (all stems are PALETTE.parchment).
 *
 * Per SDD §3.5 (cycle fixture-ecs-instancing-2026-05-17, S2-T3 added
 * post-worst-case-measurement). Mushroom.tsx stem is a tapered cylinder;
 * the CAP is a LeafPuff that continues to flow through the cycle-1 leaf
 * field via `mushroomLeafSpecs` (unchanged by this commit).
 *
 * Same pattern as Tree's trunk archetype but simpler — only one
 * sub-geometry per fixture (no branches). All stems share canonical
 * geometry; per-instance scale produces the world-space dimensions.
 *
 * Static — no per-frame mutation.
 */

import type { ColumnSpec } from "./archetype";

/**
 * Column names: posXYZ (3) + rotY (1) + scale (1) = 5 floats per row.
 *
 * Renderer (InstancedMushroomField): per-instance matrix:
 *   T(posX, posY, posZ) × R_Y(rotY) × S(scale, scale, scale)
 * Material color is uniform PALETTE.parchment (set on material; no per-
 * instance hue column needed).
 */
export type MushroomCols = "posX" | "posY" | "posZ" | "rotY" | "scale";

export const MUSHROOM_COLUMN_SPECS: readonly ColumnSpec[] = [
  { name: "posX", itemSize: 1 },
  { name: "posY", itemSize: 1 },
  { name: "posZ", itemSize: 1 },
  { name: "rotY", itemSize: 1 },
  { name: "scale", itemSize: 1 },
];
