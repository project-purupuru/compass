/**
 * Zones — the district placement table, re-grounded on canonical Tsuheji.
 *
 * Per build doc Session 10. Positions are PORTED from world-purupuru's
 * `$lib/world/locations.ts` — the canonical geography (pixel-detected off the
 * 4000² Tsuheji map). The 5 element districts are no longer invented; they ARE
 * canonical locations:
 *
 *   🪵 wood  → Konka Market        (Kaori's morning market)
 *   💧 water → Sea Street Stalls   (coastal market, salt air)
 *   🔥 fire  → Heart's Hearth      (Akane's forge — cards are crafted here)
 *   ⚙️ metal → Steel Jungle Shrine (polished metal and shadow)
 *   ⛰️ earth → The Golden Veil     (the honey district)
 *
 * Canonical positions are 0–100 percentages on the painted map. We map them
 * onto the `tsuheji-map.png` ground plane (MAP_SIZE world units, centred at
 * origin): worldX = (pctX − 50)/100 · MAP_SIZE · worldZ = (pctY − 50)/100 · MAP_SIZE.
 */

import type { ElementId } from "@/lib/purupuru/contracts/types";

import { LANDMASS_GRID, LANDMASS_MASK } from "./landmass-data";

/** The Tsuheji continent ground plane — world units, square, centred at origin. */
export const MAP_SIZE = 54;

/** Canonical map percentage → world [x, z] on the ground plane. */
export function pctToWorld(pctX: number, pctY: number): readonly [number, number] {
  return [((pctX - 50) / 100) * MAP_SIZE, ((pctY - 50) / 100) * MAP_SIZE];
}

// ── Snap-to-land ─────────────────────────────────────────────────────────────
// Some canonical `locations.ts` positions miss the traced continent — water's
// Sea Street Stalls is canonically on an archipelago island (not in the
// largest-component bitmask), and interpolated positions can land in a bay.
// `snapToLand` guarantees every district sits ON the continent: if the
// canonical cell is sea, find the nearest land cell and use its centre.

function landCell(gx: number, gz: number): boolean {
  if (gx < 0 || gx >= LANDMASS_GRID || gz < 0 || gz >= LANDMASS_GRID) return false;
  return LANDMASS_MASK[gz * LANDMASS_GRID + gx] === "1";
}

/**
 * Cells of clearance a district needs around it. The plot is ~1.55 world
 * units; at MAP_SIZE 54 / GRID 160 that's ~4.6 cells. SNAP_CLEARANCE 5
 * (±1.69 world units) is the smallest square that fully contains a 1.55-radius
 * plot — so the plot, fence and all never spill into the sea. The thin
 * coastal slivers that read as "floating" are exactly what this rejects.
 */
const SNAP_CLEARANCE = 5;

/** "Solid" land — every cell in a SNAP_CLEARANCE square around (gx,gz) is land. */
function solidLandCell(gx: number, gz: number): boolean {
  for (let dz = -SNAP_CLEARANCE; dz <= SNAP_CLEARANCE; dz++) {
    for (let dx = -SNAP_CLEARANCE; dx <= SNAP_CLEARANCE; dx++) {
      if (!landCell(gx + dx, gz + dz)) return false;
    }
  }
  return true;
}

function snapToLand(x: number, z: number): readonly [number, number] {
  const gx = Math.floor((x / MAP_SIZE + 0.5) * LANDMASS_GRID);
  const gz = Math.floor((z / MAP_SIZE + 0.5) * LANDMASS_GRID);
  if (solidLandCell(gx, gz)) return [x, z];
  // Nearest SOLID land cell — a full scan (160² cells) is instant for a
  // handful of districts, and robust where a ring-search could miss across
  // a strait. Solid (not just land) keeps the district off coastal slivers.
  let bx = gx;
  let bz = gz;
  let bestSq = Infinity;
  for (let cz = 0; cz < LANDMASS_GRID; cz++) {
    for (let cx = 0; cx < LANDMASS_GRID; cx++) {
      if (!solidLandCell(cx, cz)) continue;
      const dsq = (cx - gx) * (cx - gx) + (cz - gz) * (cz - gz);
      if (dsq < bestSq) {
        bestSq = dsq;
        bx = cx;
        bz = cz;
      }
    }
  }
  return [
    ((bx + 0.5) / LANDMASS_GRID - 0.5) * MAP_SIZE,
    ((bz + 0.5) / LANDMASS_GRID - 0.5) * MAP_SIZE,
  ];
}

export interface ZonePlacement {
  readonly zoneId: string;
  readonly elementId: ElementId;
  /** Canonical location name (from locations.ts). */
  readonly name: string;
  /** Canonical 0–100 position on the painted Tsuheji map. */
  readonly mapPct: { readonly x: number; readonly y: number };
  /** World position on the ground plane (derived from mapPct). */
  readonly x: number;
  readonly z: number;
  /** Decorative = locked, not playable in cycle-1. */
  readonly decorative?: boolean;
}

function place(
  zoneId: string,
  elementId: ElementId,
  name: string,
  pctX: number,
  pctY: number,
  decorative?: boolean,
): ZonePlacement {
  const [rawX, rawZ] = pctToWorld(pctX, pctY);
  const [x, z] = snapToLand(rawX, rawZ); // every district sits on the continent
  return { zoneId, elementId, name, mapPct: { x: pctX, y: pctY }, x, z, decorative };
}

/** The 5 element districts — canonical locations, spread "sides of Japan" far. */
export const ZONE_POSITIONS: readonly ZonePlacement[] = [
  place("wood_grove", "wood", "Konka Market", 42, 30),
  place("water_harbor", "water", "Sea Street Stalls", 78, 22, true),
  place("fire_station", "fire", "Heart's Hearth", 48, 55, true),
  place("metal_mountain", "metal", "Steel Jungle Shrine", 35.7, 40.5, true),
  place("earth_teahouse", "earth", "The Golden Veil", 61, 48.6, true),
];

/** Musubi Station — the central hub, where the rosenzu lines meet. */
export const MUSUBI_HUB = (() => {
  const [rx, rz] = pctToWorld(51.4, 39);
  const [x, z] = snapToLand(rx, rz);
  return { name: "Musubi Station", x, z } as const;
})();

/** Sora Tower — the tall watch. Sky-eyes' vantage; the raptor's perch. */
export const SORA_TOWER = (() => {
  const [rx, rz] = pctToWorld(50.2, 25.1);
  const [x, z] = snapToLand(rx, rz);
  return { name: "Sora Tower", x, z } as const;
})();

/** Centroid of the 5 districts — what the soaring overview camera frames. */
export const DISTRICTS_CENTROID: readonly [number, number] = (() => {
  const n = ZONE_POSITIONS.length;
  const sx = ZONE_POSITIONS.reduce((s, z) => s + z.x, 0) / n;
  const sz = ZONE_POSITIONS.reduce((s, z) => s + z.z, 0) / n;
  return [sx, sz];
})();

export function zoneById(zoneId: string | undefined): ZonePlacement | undefined {
  if (!zoneId) return undefined;
  return ZONE_POSITIONS.find((z) => z.zoneId === zoneId);
}
