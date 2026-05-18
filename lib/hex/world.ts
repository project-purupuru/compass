/**
 * hex ↔ world conversion (flat-top orientation).
 *
 * Operator pin (session 14, 2026-05-16):
 *   - Orientation: FLAT-TOP (top edge horizontal). Cleaner "plot tile" read.
 *   - Cell size: 1.75 (circumradius). Hex width vertex-to-vertex = 3.5.
 *
 * Flat-top math (Red Blob Games reference):
 *   x = size * (3/2 * q)
 *   z = size * (sqrt(3)/2 * q + sqrt(3) * r)
 * Inverse:
 *   q = (2/3 * x) / size
 *   r = (-1/3 * x + sqrt(3)/3 * z) / size
 *
 * World y is unused (hex sits on the ground plane); elevation lives on the
 * Plot, not in this layer.
 */

import { hexRound, type HexCoord } from "./axial";

/** Operator-pinned default. Override via the second arg when needed. */
export const DEFAULT_HEX_SIZE = 1.75;

const SQRT3 = Math.sqrt(3);

export function hexToWorld(
  hex: HexCoord,
  size: number = DEFAULT_HEX_SIZE,
): readonly [number, number] {
  const x = size * (1.5 * hex.q);
  const z = size * ((SQRT3 / 2) * hex.q + SQRT3 * hex.r);
  return [x, z];
}

export function worldToHex(
  x: number,
  z: number,
  size: number = DEFAULT_HEX_SIZE,
): HexCoord {
  const frac = {
    q: ((2 / 3) * x) / size,
    r: (-(1 / 3) * x + (SQRT3 / 3) * z) / size,
  };
  return hexRound(frac);
}

/** Vertex positions in local hex space (cell-relative). */
export function hexVertices(
  size: number = DEFAULT_HEX_SIZE,
): readonly (readonly [number, number])[] {
  // Flat-top: vertices at angles 0°, 60°, 120°, 180°, 240°, 300°
  const verts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    verts.push([size * Math.cos(angle), size * Math.sin(angle)]);
  }
  return verts;
}

/** Edge-to-edge (inradius * 2). The "narrow" dimension of a flat-top hex. */
export function hexInradius(size: number = DEFAULT_HEX_SIZE): number {
  return (SQRT3 / 2) * size;
}

/** Vertex-to-vertex (= 2 * size). The "wide" dimension of a flat-top hex. */
export function hexCircumradius(size: number = DEFAULT_HEX_SIZE): number {
  return 2 * size;
}
