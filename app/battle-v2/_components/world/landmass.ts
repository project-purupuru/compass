/**
 * landmass.ts — the runtime collision + boundary layer.
 *
 * Per build doc Session 11 (operator: "understand the map itself ... collision
 * areas ... position actual locations"). Wraps the generated `landmass-data.ts`
 * (extracted from `tsuheji-map.png` by `_tools/extract-map-geometry.py`):
 *
 *   - `isOnLand(x,z)`     — constant-time bitmask lookup. The collision query.
 *   - `COASTLINE`         — the traced continent outline, in world coords.
 *   - `sampleOnLand(...)` — rejection-sampler for placing props/structures so
 *                           they land on the continent, never in the sea.
 *
 * Two representations, two consumers (per the research): the bitmask grid is
 * the gameplay query; the polygon is for rendering + future 3D extrusion.
 *
 * Coordinate basis matches `zones.ts`: normalized [0,1] = pct/100, mapped onto
 * the MAP_SIZE plane centred at origin.
 */

import { COASTLINE_NORM, LANDMASS_GRID, LANDMASS_MASK } from "./landmass-data";
import { MAP_SIZE } from "./zones";

/** World [x,z] → normalized [0,1] map coords. */
function toNorm(worldX: number, worldZ: number): readonly [number, number] {
  return [worldX / MAP_SIZE + 0.5, worldZ / MAP_SIZE + 0.5];
}

/** Is this world position on the Tsuheji continent? Constant-time bitmask read. */
export function isOnLand(worldX: number, worldZ: number): boolean {
  const [nx, nz] = toNorm(worldX, worldZ);
  if (nx < 0 || nx >= 1 || nz < 0 || nz >= 1) return false;
  const gx = Math.floor(nx * LANDMASS_GRID);
  const gz = Math.floor(nz * LANDMASS_GRID);
  return LANDMASS_MASK[gz * LANDMASS_GRID + gx] === "1";
}

/** The traced coastline, in world coords — for outline rendering + 3D extrusion. */
export const COASTLINE: readonly (readonly [number, number])[] = COASTLINE_NORM.map(
  ([nx, nz]) => [(nx - 0.5) * MAP_SIZE, (nz - 0.5) * MAP_SIZE] as const,
);

/**
 * Rejection-sample a point on land within `radius` of a centre. Returns null if
 * no land point is found in `tries` attempts (the centre is deep sea).
 * `rand` is a seeded RNG so placement stays deterministic.
 */
export function sampleOnLand(
  cx: number,
  cz: number,
  radius: number,
  rand: () => number,
  tries = 24,
): readonly [number, number] | null {
  for (let i = 0; i < tries; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * radius; // uniform over the disc
    const x = cx + Math.cos(a) * r;
    const z = cz + Math.sin(a) * r;
    if (isOnLand(x, z)) return [x, z];
  }
  return null;
}
