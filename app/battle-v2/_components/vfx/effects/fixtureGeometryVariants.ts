/**
 * fixtureGeometryVariants — canonical baked geometries for cycle-3 fixture
 * archetypes whose source geometry is procedural per-fixture in the non-
 * instanced render path (Rock, Bush, Mushroom, Wildflower, FallenLog).
 * Each variant is baked once at module load with a fixed seed; per-fixture
 * rows in the corresponding archetype pick a variant by seed (Rock) OR
 * share the single canonical geometry (Bush/Mushroom/Wildflower/FallenLog).
 *
 * Per SDD §3.3-§3.6 + worst-case-driven extension 2026-05-17.
 *
 * **Operator pushback on over-optimization (2026-05-17)**: SDD called for
 * 2-3 variants per kind. This module ships ONE canonical variant per kind
 * to keep the renderer simple. Visual variety comes from per-instance
 * SCALE + per-instance HUE (where supported). If a future cycle needs
 * more shape variety, adding variants is trivial (extend exports, update
 * renderer to dispatch by variant index).
 */

import {
  CylinderGeometry,
  type BufferGeometry,
} from "three";

import { buildPuffCluster, type ClusterPuff } from "../../world/clusterGeometry";
import { mulberry32 } from "../../world/Foliage";
import { buildRockGeometry } from "../authoredNormals";

// ── Rock variants ──────────────────────────────────────────────────────────

/**
 * Boulder pool: jitter=0.18, used for both boulder-shape + slab-shape rocks
 * (slab applies non-uniform scale to produce the squashed look while sharing
 * the boulder's silhouette family). Also used for chunks (small companion
 * rocks around primaries — they're boulders too, just scaled-down).
 */
export const ROCK_GEOMETRY_BOULDER: BufferGeometry = buildRockGeometry({
  shape: "boulder",
  seed: 0x70cc,
  upBias: 0.18,
  jitter: 0.18,
});

/**
 * Pebble pool: jitter=0.1, used for pebble-shape rocks only.
 */
export const ROCK_GEOMETRY_PEBBLE: BufferGeometry = buildRockGeometry({
  shape: "boulder",
  seed: 0x70dd,
  upBias: 0.12,
  jitter: 0.1,
});

// ── Bush variant ───────────────────────────────────────────────────────────

/**
 * Canonical merged-puff-cluster bush geometry. Mirrors Bush.tsx's
 * `buildBushPuffs(seed=0xb115 + 3, scale=1)` math EXACTLY, baked at module
 * load via buildPuffCluster with center-of-mass pivot.
 *
 * Preserves the cycle-1 craft principle: ONE merged geometry → ONE outline
 * → spherical-pivot normals → light wraps as one volume. Per-instance scale
 * (s, s, s) at render time produces final world dimensions.
 *
 * Trade-off accepted (operator over-optimization pushback 2026-05-17):
 * every bush instance shares this shape (only scale + hue vary). Loses
 * per-bush shape variety; preserves craft.
 */
function buildCanonicalBushPuffs(): ClusterPuff[] {
  // Mirror Bush.tsx:40-64 with seed=0xb115+3, scale=1.
  const rand = mulberry32(0xb115 + 3);
  const count = 4 + Math.floor(rand() * 3); // 4..6 puffs
  const puffs: ClusterPuff[] = [];

  // Anchor puff — large, centered, slightly above ground.
  puffs.push({
    offset: [0, 0.42, 0],
    radius: 0.55,
    detail: 1,
  });

  // Surrounding puffs — scattered at varied heights/radii.
  for (let i = 1; i < count; i++) {
    const a = ((i - 1) / (count - 1)) * Math.PI * 2 + (rand() - 0.5) * 0.7;
    const r = 0.22 + rand() * 0.18;
    const y = 0.3 + rand() * 0.4;
    puffs.push({
      offset: [Math.cos(a) * r, y, Math.sin(a) * r],
      radius: 0.32 + rand() * 0.16,
      detail: 1,
    });
  }
  return puffs;
}

export const BUSH_GEOMETRY: BufferGeometry = (() => {
  const puffs = buildCanonicalBushPuffs();
  // Center-of-mass pivot per Bush.tsx:86-89 (spherical-pivot normals).
  const avgX = puffs.reduce((s, p) => s + p.offset[0], 0) / puffs.length;
  const avgY = puffs.reduce((s, p) => s + p.offset[1], 0) / puffs.length;
  const avgZ = puffs.reduce((s, p) => s + p.offset[2], 0) / puffs.length;
  return buildPuffCluster(puffs, [avgX, avgY, avgZ]);
})();

// ── Mushroom stem variant ─────────────────────────────────────────────────

/**
 * Canonical mushroom stem geometry. Mirrors Mushroom.tsx:50-56 math:
 *   <cylinderGeometry args={[stemRadius * 0.85, stemRadius, stemHeight, 6]} />
 * where stemHeight = scale * 1.1, stemRadius = scale * 0.14.
 *
 * Baked at scale=1: cylinderGeometry(0.14 * 0.85, 0.14, 1.1, 6).
 * Origin TRANSLATED to BASE (default Three.js cylinder origin is center;
 * shift up by height/2 = 0.55).
 *
 * Per-instance scale (s, s, s) produces world dimensions matching
 * Mushroom.tsx exactly:
 *   stemRadius * 0.85 * s = 0.14 * 0.85 * s
 *   stemRadius * s = 0.14 * s
 *   stemHeight * s = 1.1 * s
 */
export const MUSHROOM_STEM_GEOMETRY: BufferGeometry = (() => {
  const geo = new CylinderGeometry(0.14 * 0.85, 0.14, 1.1, 6);
  geo.translate(0, 0.55, 0); // origin at base
  return geo;
})();

// ── Wildflower stem variant ───────────────────────────────────────────────

/**
 * Canonical wildflower stem geometry. Mirrors Wildflower.tsx:50-54 math:
 *   <cylinderGeometry args={[stemRadius * 0.7, stemRadius, stemHeight, 5]} />
 * where stemHeight = scale, stemRadius = scale * 0.04.
 *
 * Baked at scale=1: cylinderGeometry(0.04 * 0.7, 0.04, 1, 5).
 * Origin TRANSLATED to BASE.
 *
 * Per-instance scale (s, s, s) produces world dimensions matching
 * Wildflower.tsx exactly.
 */
export const WILDFLOWER_STEM_GEOMETRY: BufferGeometry = (() => {
  const geo = new CylinderGeometry(0.04 * 0.7, 0.04, 1, 5);
  geo.translate(0, 0.5, 0); // origin at base
  return geo;
})();

// ── Fallen log variant ────────────────────────────────────────────────────

/**
 * Canonical fallen log geometry. Mirrors FallenLog.tsx:53-66 math:
 *   length = scale * 2.5, radius = scale * 0.35
 *   <cylinderGeometry args={[radius, radius, length, 8]} />
 *   <mesh position={[0, radius, 0]} rotation={[0, 0, Math.PI / 2]}>
 *
 * Baked at scale=1: cylinderGeometry(0.35, 0.35, 2.5, 8). Rotated Z by π/2
 * so cylinder lies horizontal (axis along world X). Translated Y by +0.35
 * so log's bottom is at y=0.
 *
 * Per-instance scale (s, s, s) gives:
 *   log length = 2.5 * s along X
 *   log radius = 0.35 * s
 *   log bottom Y = 0 (touches ground when posY=0)
 *
 * Per-instance rotY rotates the log around vertical (= FallenLog.tsx's
 * `facing` prop).
 */
export const FALLEN_LOG_GEOMETRY: BufferGeometry = (() => {
  const geo = new CylinderGeometry(0.35, 0.35, 2.5, 8);
  geo.rotateZ(Math.PI / 2); // lie horizontal along world X
  geo.translate(0, 0.35, 0); // bottom on ground
  return geo;
})();
