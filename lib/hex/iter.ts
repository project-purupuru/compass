/**
 * Iteration patterns on axial hex grids — rings and spirals.
 */

import { hexAdd, hexScale, type HexCoord } from "./axial";
import { HEX_DIRECTIONS } from "./neighbors";

/**
 * All hexes at exactly `radius` distance from `center`. Order is
 * deterministic (corner-walk starting from the SW corner).
 *
 * Radius 0 returns just the center.
 */
export function hexRing(
  center: HexCoord,
  radius: number,
): readonly HexCoord[] {
  if (radius <= 0) return [center];
  // Start at the "southwest" corner of the ring (direction index 4 * radius)
  let current = hexAdd(center, hexScale(HEX_DIRECTIONS[4], radius));
  const results: HexCoord[] = [];
  for (let side = 0; side < 6; side++) {
    for (let step = 0; step < radius; step++) {
      results.push(current);
      current = hexAdd(current, HEX_DIRECTIONS[side]);
    }
  }
  return results;
}

/**
 * Spiral outward from `center` to and including `radius`. Center first,
 * then ring 1, then ring 2, ... Useful for "show me the N closest hexes."
 */
export function hexSpiral(
  center: HexCoord,
  radius: number,
): readonly HexCoord[] {
  const results: HexCoord[] = [];
  for (let r = 0; r <= radius; r++) {
    results.push(...hexRing(center, r));
  }
  return results;
}
