/**
 * Neighbor walks on the axial hex grid.
 *
 * Flat-top orientation. Direction indices 0..5 go clockwise starting from
 * the east-northeast neighbor (the "NE" direction). This matches the visual
 * order vertices are returned by `hexVertices()` so direction[i] corresponds
 * to the edge BETWEEN vertex[i] and vertex[i+1].
 *
 *   Direction layout (flat-top, looking down at xz plane, +z = south):
 *         (0)  NE
 *    (5) NW    (1) E
 *        center
 *    (4) SW    (2) SE
 *         (3)  S? wait, flat-top has 6 neighbors at:
 *
 * Re-checking flat-top neighbor offsets (Red Blob Games):
 *   0: { q:  1, r:  0 }   E
 *   1: { q:  1, r: -1 }   NE
 *   2: { q:  0, r: -1 }   NW
 *   3: { q: -1, r:  0 }   W
 *   4: { q: -1, r:  1 }   SW
 *   5: { q:  0, r:  1 }   SE
 */

import { hexAdd, type HexCoord } from "./axial";

/** 6 neighbor offsets, flat-top, axial. Index = direction. */
export const HEX_DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 },   // 0 E
  { q: 1, r: -1 },  // 1 NE
  { q: 0, r: -1 },  // 2 NW
  { q: -1, r: 0 },  // 3 W
  { q: -1, r: 1 },  // 4 SW
  { q: 0, r: 1 },   // 5 SE
];

/**
 * Human-readable direction labels (parallel to HEX_DIRECTIONS).
 * Per FAGAN review 2026-05-17: prior labels at indices 2 and 5 lied —
 * (q:0,r:-1) actually points world NORTH (not NW) and (q:0,r:1) points
 * world SOUTH (not SE). Fixed to match the hexToWorld math (world.ts).
 */
export const HEX_DIRECTION_LABELS = [
  "ESE",
  "ENE",
  "N",
  "WNW",
  "WSW",
  "S",
] as const;

export function hexNeighbor(hex: HexCoord, direction: number): HexCoord {
  return hexAdd(hex, HEX_DIRECTIONS[direction % 6]);
}

/** All 6 neighbors of a hex, in direction order. */
export function hexNeighbors(hex: HexCoord): readonly HexCoord[] {
  return HEX_DIRECTIONS.map((d) => hexAdd(hex, d));
}
