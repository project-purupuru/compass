/**
 * groveLayout.ts — where the grove's trees stand.
 *
 * Per build doc Session 12 (D1). The grove "remembers" via the substrate:
 * tree count is a pure function of `activationLevel`. This module is the
 * single source of truth for tree POSITIONS, so the canopy (GroveGrowth) and
 * the bears (BearColony) agree on exactly which trees exist and where.
 *
 * Growth ADDS trees, never reshuffles: a fixed pool of MAX_TREES candidate
 * positions is generated once (deterministically), and callers slice
 * `[0, treeCount(level))`. Tree #5 is always in the same spot — so a card play
 * grows the grove by *appending* a sapling, it doesn't rearrange the forest.
 */

import type { Vec2 } from "./agents/steering";
import { mulberry32 } from "./Foliage";
import { isOnLand } from "./landmass";

export interface GroveTree {
  readonly pos: Vec2;
  /** Per-tree seed — varies scale, canopy hue, sway phase. */
  readonly seed: number;
  /** Stable index into the pool — GroveGrowth springs in the highest indices. */
  readonly index: number;
}

const BASE_TREES = 4; // the grove at activationLevel 0 — already a grove
const TREES_PER_LEVEL = 3; // each wood card play thickens it by this many
const MAX_TREES = 28; // the pool ceiling
const GROVE_SPREAD = 6.4; // how far trees scatter from the grove centre

/** How many trees stand at this activation level. */
export function groveTreeCount(activationLevel: number): number {
  return Math.min(BASE_TREES + activationLevel * TREES_PER_LEVEL, MAX_TREES);
}

/**
 * The full candidate pool — MAX_TREES positions rejection-sampled onto land
 * around the grove centre. Deterministic (seeded), so it's stable across
 * renders. Callers slice to `groveTreeCount(level)`.
 */
export function buildGroveTrees(grove: Vec2): GroveTree[] {
  const rand = mulberry32(0x607e);
  const out: GroveTree[] = [];
  for (let i = 0; i < MAX_TREES; i++) {
    let placed: Vec2 | null = null;
    for (let t = 0; t < 24; t++) {
      // Square-root radius → uniform scatter over the disc, not centre-clumped.
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * GROVE_SPREAD;
      const x = grove.x + Math.cos(a) * r;
      const z = grove.z + Math.sin(a) * r;
      if (isOnLand(x, z)) {
        placed = { x, z };
        break;
      }
    }
    if (!placed) continue;
    out.push({ pos: placed, seed: 0x1000 + i * 977, index: out.length });
  }
  return out;
}
