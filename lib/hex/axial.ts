/**
 * Axial hex coordinates — the canonical 2-axis coordinate system.
 *
 * Per Red Blob Games' hexagon reference (the de-facto vocabulary). Two axes
 * `q` and `r`; the implicit third `s = -q - r` keeps the cube-coordinate
 * algebra without storing it. Axial is space-efficient, walk-friendly, and
 * trivially invertible to world coords.
 *
 * Operator pin (session 14, 2026-05-16): cell size = 1.75 world units
 * (circumradius / center-to-vertex). Flat-top orientation. Vertex-to-vertex
 * width = 3.5; edge-to-edge height ≈ 3.03.
 *
 * This file is pure data + arithmetic — no Three.js, no React. Reusable
 * across compass and any sibling project that wants hex authoring.
 */

export interface HexCoord {
  readonly q: number;
  readonly r: number;
}

/** Cube-coordinate s is implicit. Useful for distance + line-walks. */
export const cubeS = (hex: HexCoord): number => -hex.q - hex.r;

export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

export function hexAdd(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q + b.q, r: a.r + b.r };
}

export function hexSub(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q - b.q, r: a.r - b.r };
}

export function hexScale(h: HexCoord, k: number): HexCoord {
  return { q: h.q * k, r: h.r * k };
}

/** Manhattan-equivalent distance on the hex grid. */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = cubeS(a) - cubeS(b);
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(ds)) / 2;
}

/** Stable string key for use in Map/Set lookups. */
export function hexKey(h: HexCoord): string {
  return `${h.q},${h.r}`;
}

export function parseHexKey(key: string): HexCoord {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}

/**
 * Round fractional axial coordinates (from world→hex conversion) to the
 * nearest valid integer hex. Cube-rounding preserves grid invariants.
 */
export function hexRound(frac: { q: number; r: number }): HexCoord {
  const fx = frac.q;
  const fy = -frac.q - frac.r;
  const fz = frac.r;
  let rx = Math.round(fx);
  let ry = Math.round(fy);
  let rz = Math.round(fz);
  const dx = Math.abs(rx - fx);
  const dy = Math.abs(ry - fy);
  const dz = Math.abs(rz - fz);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx, r: rz };
}
