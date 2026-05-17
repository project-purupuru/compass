/**
 * RockArchetype — one unified archetype for rock-kind instances (BOTH
 * primary rocks AND their decorative chunks). Per-instance matrix carries
 * everything needed to render: world position (with yOffset baked in),
 * Y-rotation, non-uniform XYZ scale (for slab squish), shape tag (selects
 * geometry pool), and per-instance hue.
 *
 * Per SDD §3.4 (cycle fixture-ecs-instancing-2026-05-17, S2-T1).
 *
 * **Deviation from SDD**: SDD §3.4 proposed TWO archetypes
 * (RockArchetype + RockChunkArchetype, mirroring Tree's split). This
 * implementation uses ONE archetype. Rationale (operator pushback on
 * over-optimization, 2026-05-17): primary rocks and chunks share the
 * SAME boulder geometry pool — they differ only in matrix (chunks are
 * smaller + offset-positioned). One archetype with one renderer pass
 * is simpler to teach + debug; SDD's two-archetype split was a
 * speculative pattern-mirror, not a measured need.
 *
 * **Geometry pool selection** via `shape` column:
 *   - 0 (boulder) + 1 (slab) → renderer uses BOULDER geometry (jitter=0.18)
 *   - 2 (pebble)             → renderer uses PEBBLE geometry (jitter=0.1)
 *
 * **Per-instance color** via setColorAt() on the InstancedMesh. No
 * vertexColors prop on the material — cleaner pattern per SDD §8.3.
 * Hue stored as 3 floats (R, G, B) in the archetype for stride-1
 * iteration in the renderer.
 *
 * Static — no per-frame mutation. Same pattern as TreeTrunkArchetype +
 * TreeBranchArchetype.
 */

import type { ColumnSpec } from "./archetype";

/**
 * Column names for the rock archetype. 11 scalars per row:
 *   posXYZ (3) + rotY (1) + scaleXYZ (3) + shape (1) + hueRGB (3) = 11
 *
 * scaleXYZ supports non-uniform scale for slab variants (1.25, 0.55, 1.15).
 * Boulders and pebbles use uniform scale (X=Y=Z); rendered identically.
 *
 * shape ∈ {0, 1, 2}:
 *   0 = boulder       — uniform scale, boulder geometry pool
 *   1 = slab          — non-uniform scale, boulder geometry pool
 *   2 = pebble        — uniform scale, pebble geometry pool
 *
 * Chunks (the smaller-rock companions Rock.tsx renders around the primary)
 * use shape=0 always — they're small boulders.
 */
export type RockCols =
  | "posX"
  | "posY"
  | "posZ"
  | "rotY"
  | "scaleX"
  | "scaleY"
  | "scaleZ"
  | "shape"
  | "hueR"
  | "hueG"
  | "hueB";

export const ROCK_COLUMN_SPECS: readonly ColumnSpec[] = [
  { name: "posX", itemSize: 1 },
  { name: "posY", itemSize: 1 },
  { name: "posZ", itemSize: 1 },
  { name: "rotY", itemSize: 1 },
  { name: "scaleX", itemSize: 1 },
  { name: "scaleY", itemSize: 1 },
  { name: "scaleZ", itemSize: 1 },
  { name: "shape", itemSize: 1 },
  { name: "hueR", itemSize: 1 },
  { name: "hueG", itemSize: 1 },
  { name: "hueB", itemSize: 1 },
];

/**
 * Shape constants for clarity at call sites.
 * Stored as numbers in the Float32 archetype (Float32 has exact
 * integer representation up to 2^24 — small enum values are safe).
 */
export const ROCK_SHAPE_BOULDER = 0 as const;
export const ROCK_SHAPE_SLAB = 1 as const;
export const ROCK_SHAPE_PEBBLE = 2 as const;
