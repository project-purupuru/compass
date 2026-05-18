/**
 * WildflowerArchetype — one row per wildflower STEM. Per-instance
 * position + rotY + scale. NO per-instance color (all stems are
 * a uniform leafy green per Wildflower.tsx).
 *
 * Per SDD §3.6 (cycle fixture-ecs-instancing-2026-05-17, S2-T4 added
 * post-worst-case-measurement). Wildflower.tsx stem is a thin tapered
 * cylinder; the BLOOM is a LeafPuff that continues to flow through the
 * cycle-1 leaf field via `wildflowerLeafSpecs` (unchanged).
 *
 * Same shape as MushroomArchetype (5 floats per row). The difference is
 * material color + canonical stem dimensions.
 *
 * Static — no per-frame mutation.
 */

import type { ColumnSpec } from "./archetype";

/**
 * Column names: posXYZ (3) + rotY (1) + scale (1) = 5 floats per row.
 * Material color = "#6b8f4a" (leafy green) per Wildflower.tsx.
 */
export type WildflowerCols = "posX" | "posY" | "posZ" | "rotY" | "scale";

export const WILDFLOWER_COLUMN_SPECS: readonly ColumnSpec[] = [
  { name: "posX", itemSize: 1 },
  { name: "posY", itemSize: 1 },
  { name: "posZ", itemSize: 1 },
  { name: "rotY", itemSize: 1 },
  { name: "scale", itemSize: 1 },
];
