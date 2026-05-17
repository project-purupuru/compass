/**
 * fixtureGeometryVariants — canonical baked geometries for cycle-3 fixture
 * archetypes whose source geometry is procedural per-fixture in the non-
 * instanced render path (Rock, Bush). Each variant is baked once at module
 * load with a fixed seed; per-fixture rows in the corresponding archetype
 * pick a variant by their own seed.
 *
 * Per SDD §3.3 (Bush) + §3.4 (Rock), cycle fixture-ecs-instancing-2026-05-17.
 *
 * **Operator pushback on over-optimization (2026-05-17)**: SDD called for
 * 3 variants per shape (9 baked rock geos + 2 bush variants). This module
 * ships ONE variant per geometry pool — sufficient for the learning cycle.
 * Visual variety on instanced fixtures comes from per-instance SCALE
 * (rocks: 1000+ instances at different sizes; bushes: 2 sizes) rather
 * than from per-shape variation. If a future cycle needs more shape
 * variety, adding variants is trivial (extend these arrays, update the
 * renderer to dispatch by variant index).
 *
 * Trade-off: every rock has the SAME silhouette shape (just different
 * sizes); same for every bush within a variant. At a 25×25 grid scale,
 * the camera distance + density + atmosphere mostly hides per-fixture
 * sameness, but operators may want more variants for closer-camera
 * scenes (e.g., character zoom-ins).
 */

import { type BufferGeometry } from "three";

import { buildRockGeometry } from "../authoredNormals";

// ── Rock variants ──────────────────────────────────────────────────────────

/**
 * Boulder pool: jitter=0.18, used for both boulder-shape + slab-shape rocks
 * (slab applies non-uniform scale to produce the squashed look while sharing
 * the boulder's silhouette family). Also used for chunks (small companion
 * rocks around primaries — they're boulders too, just scaled-down).
 *
 * Single canonical variant per the cycle-3 over-optimization pushback. If
 * future cycles need more variety, add ROCK_GEOMETRY_BOULDER_VARIANT_1/2/etc.
 * and update InstancedRockField to dispatch by variant column.
 */
export const ROCK_GEOMETRY_BOULDER: BufferGeometry = buildRockGeometry({
  shape: "boulder",
  seed: 0x70cc,
  upBias: 0.18,
  jitter: 0.18,
});

/**
 * Pebble pool: jitter=0.1, used for pebble-shape rocks only (they're
 * smaller + smoother per Rock.tsx's `isPebble ? 0.1 : 0.18` jitter
 * branch). Different geometry from boulders.
 */
export const ROCK_GEOMETRY_PEBBLE: BufferGeometry = buildRockGeometry({
  shape: "boulder",
  seed: 0x70dd,
  upBias: 0.12,
  jitter: 0.1,
});

// ── Bush variants (S2-T2 placeholder — written in BushArchetype commit) ────

/**
 * Reserved for S2-T2. Bush's challenge is the per-bush merged-puff-cluster
 * geometry that Bush.tsx builds via buildPuffCluster. Two canonical
 * variants (small + medium) baked at module load to preserve the "one
 * merged geo + one outline + spherical-pivot normals" craft from cycle-1.
 *
 * NOT YET IMPLEMENTED — lands in S2-T2 commit.
 */
export const BUSH_GEOMETRY_VARIANTS: readonly BufferGeometry[] = [];

// Cylinder stem helpers (Mushroom / Wildflower) are NOT implemented in
// cycle-3 per operator scope decision 2026-05-17: instance only the
// architecturally-novel kinds; repetition-only kinds stay per-React.
// When they earn instancing in a future cycle, the pattern mirrors
// Tree's TRUNK_GEOMETRY_CACHE in InstancedTreeField.tsx.
