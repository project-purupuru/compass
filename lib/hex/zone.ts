/**
 * Zone — an element-tagged cluster of contiguous hex coordinates.
 *
 * Session 17 substrate primitive (operator-locked 2026-05-17). A Zone names
 * which hexes belong to a side's "field" + which wuxing element governs
 * that field's ambient VFX + buff math (Yu-Gi-Oh field-spell shape, future
 * cycle).
 *
 * Zone is pure DATA — no ambient/trigger STATE lives here. Per session-17
 * ratification: VFX intensity + trigger ramps live in the ZoneScene
 * composer (React refs + useFrame), not on the Zone struct. Keeps Zone
 * composable + serializable for future card-play wiring.
 *
 * Operator framings carried in:
 *   - "More elements coming" → element is the canonical ElementIdT, not a
 *     wood|water literal. All 5 elements valid from the substrate level.
 *   - "Two-side split is structural, not just visual" → each side owns
 *     1+ Zones; the Scene composes them.
 *   - "5 hexes per zone default" → triangle/star/hexring variants exist
 *     but the canonical demo shape is 5-hex (center + 4 ring).
 */

import { Schema as S } from "effect";

import type { ElementIdT } from "@/lib/wuxing/element";
import { hexAdd, type HexCoord } from "./axial";
import { HEX_DIRECTIONS } from "./neighbors";
import { hexRing } from "./iter";
import { HexCoordSchema } from "./plot";

// ── Zone shape ─────────────────────────────────────────────────────────────

export const Zone = S.Struct({
  /** Stable id — e.g. "player.zone.wood", "opponent.zone.water". */
  id: S.String,
  /** Wuxing element governing the zone's ambient VFX + buff math. */
  element: S.Literal("wood", "fire", "earth", "metal", "water"),
  /** 1+ contiguous hex coordinates that make up the zone. */
  coords: S.Array(HexCoordSchema),
});

export type ZoneT = S.Schema.Type<typeof Zone>;

// ── Cluster layouts ────────────────────────────────────────────────────────
//
// Canonical contiguous patches centered at a given coord. All layouts include
// the center plot first.

export type ClusterShape = "triangle" | "patch-5" | "hexring" | "star";

/**
 * Generate a cluster of contiguous hex coords centered at `center`.
 *
 *   - "triangle"  → 3 hexes: center + 2 adjacent (E, NE)
 *   - "patch-5"   → 5 hexes: center + 4 of the 6 ring neighbors
 *                   (operator default — feels like an elemental "patch")
 *   - "hexring"   → 7 hexes: center + full ring (radius-1 spiral)
 *   - "star"      → 7 hexes (alias for hexring)
 */
export function clusterCoords(
  center: HexCoord,
  shape: ClusterShape,
): readonly HexCoord[] {
  switch (shape) {
    case "triangle":
      return [
        center,
        hexAdd(center, HEX_DIRECTIONS[0]),   // E
        hexAdd(center, HEX_DIRECTIONS[1]),   // NE
      ];
    case "patch-5": {
      // Center + 4 ring neighbors. Skip indices 2 (N) and 5 (S) so the
      // patch reads as a horizontal cluster — fits side-by-side layout
      // along the z-axis better than a vertical patch.
      const picks = [0, 1, 3, 4]; // E, NE, W, SW
      return [
        center,
        ...picks.map((i) => hexAdd(center, HEX_DIRECTIONS[i])),
      ];
    }
    case "hexring":
    case "star":
      return [center, ...hexRing(center, 1)];
  }
}

// ── Zone factory ───────────────────────────────────────────────────────────

export interface MakeZoneArgs {
  readonly id: string;
  readonly element: ElementIdT;
  readonly center: HexCoord;
  readonly shape: ClusterShape;
}

export function makeZone({ id, element, center, shape }: MakeZoneArgs): ZoneT {
  return {
    id,
    element,
    coords: clusterCoords(center, shape) as ZoneT["coords"],
  };
}
