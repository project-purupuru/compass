/**
 * regions.ts — the five elemental territories of Tsuheji.
 *
 * Per build doc Session 11 (operator: "understand the different elements that
 * revolve around each specific area ... zones/outlined areas ... that would
 * inform how we can design elemental states and weather effects").
 *
 * The continent is partitioned into 5 regions, one per element district. Each
 * land point belongs to its nearest district — but the sample position is
 * NOISE-PERTURBED first (per the research), so the borders wave organically
 * instead of running dead-straight Voronoi lines. The result: legible
 * elemental territory with hand-drawn-feeling edges.
 *
 * This is the substrate for elemental states + weather: `regionAt(x,z)` tells
 * you which element governs any point on the map.
 */

import type { ElementId } from "@/lib/purupuru/contracts/types";

import { isOnLand } from "./landmass";
import { ZONE_POSITIONS } from "./zones";

/**
 * Cheap deterministic value-noise — smooth, seamless, no dependency. Returns
 * roughly [-1, 1]. Two octaves is enough to wave a Voronoi border believably.
 */
function valueNoise(x: number, z: number): number {
  const s =
    Math.sin(x * 1.93 + z * 0.71) * 0.6 +
    Math.sin(x * 0.57 - z * 1.31 + 2.3) * 0.4 +
    Math.sin((x + z) * 1.07 + 5.1) * 0.3;
  return s / 1.3;
}

/** How far (world units) the noise pushes a sample before the nearest-seed test. */
const BORDER_WAVE = 2.6;

/**
 * Which element governs this world position — or null if it's sea.
 *
 * Noise-perturbed nearest-seed: the organic-border trick. Each point's sample
 * is nudged by value-noise, then classified to the nearest seed zone. Same
 * input → same output (deterministic).
 *
 * Optional `seedZones` override replaces ZONE_POSITIONS entirely in the
 * nearest-seed test. Use cases:
 *   - active 2-element matchup with battlefield-overridden positions: pass
 *     `activeBattlefieldZones()` so the territory partition wraps around the
 *     player/opponent battlefield layout instead of canonical district art
 *   - debug overlays: pass arbitrary seed configurations
 *
 * When `seedZones` is omitted, falls back to canonical ZONE_POSITIONS (full
 * 5-element partition).
 */
export function regionAt(
  worldX: number,
  worldZ: number,
  seedZones?: readonly { readonly elementId: ElementId; readonly x: number; readonly z: number }[],
): ElementId | null {
  if (!isOnLand(worldX, worldZ)) return null;

  const px = worldX + valueNoise(worldX * 0.16, worldZ * 0.16) * BORDER_WAVE;
  const pz = worldZ + valueNoise(worldX * 0.16 + 41.7, worldZ * 0.16 + 17.3) * BORDER_WAVE;

  const seeds = seedZones ?? ZONE_POSITIONS;
  let best: ElementId | null = null;
  let bestSq = Infinity;
  for (const zone of seeds) {
    const dx = px - zone.x;
    const dz = pz - zone.z;
    const sq = dx * dx + dz * dz;
    if (sq < bestSq) {
      bestSq = sq;
      best = zone.elementId;
    }
  }
  return best;
}

/** The five elements, in district order — for iterating territories. */
export const REGION_ELEMENTS: readonly ElementId[] = ZONE_POSITIONS.map(
  (z) => z.elementId,
);
