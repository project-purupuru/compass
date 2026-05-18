/**
 * FallenLogArchetype — one row per fallen log. Per-instance position +
 * facing (rotY) + scale. NO per-instance color (all logs are PALETTE.trunk).
 *
 * Per SDD (cycle fixture-ecs-instancing-2026-05-17, S2-T5 added post-
 * worst-case-measurement). FallenLog.tsx is a single cylinder laid on its
 * side (rotated Z by π/2 in non-instanced render path; baked into the
 * canonical geometry here). Moss tufts on top continue through the
 * cycle-1 leaf field via new `fallenLogMossLeafSpecs` in leafExtractors.ts
 * (added in this commit for visual parity).
 *
 * Same column shape as MushroomArchetype / WildflowerArchetype — single
 * cylinder geometry, per-instance transform.
 *
 * Static — no per-frame mutation.
 */

import type { ColumnSpec } from "./archetype";

/**
 * Column names: posXYZ (3) + rotY (1) + scale (1) = 5 floats per row.
 *
 * Renderer (InstancedFallenLogField): per-instance matrix:
 *   T(posX, posY, posZ) × R_Y(rotY) × S(scale, scale, scale)
 *
 * Canonical geometry is a cylinder ALREADY rotated to lie horizontal
 * (long axis = world X) and translated so origin is at the log's bottom
 * surface — so per-instance position places the log on the ground without
 * additional offset math.
 */
export type FallenLogCols = "posX" | "posY" | "posZ" | "rotY" | "scale";

export const FALLEN_LOG_COLUMN_SPECS: readonly ColumnSpec[] = [
  { name: "posX", itemSize: 1 },
  { name: "posY", itemSize: 1 },
  { name: "posZ", itemSize: 1 },
  { name: "rotY", itemSize: 1 },
  { name: "scale", itemSize: 1 },
];
