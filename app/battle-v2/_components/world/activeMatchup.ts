/**
 * activeMatchup — the 2 elements currently active in the match.
 *
 * Cycle-1 doctrine (project_battle-v2-zone-composition memory): Yugioh-shape
 * battle. Each match has TWO land elements (one per side); the whole map
 * partitions into those 2 territories. The other 3 districts vanish from the
 * visible battlefield until a future match config rotates them in.
 *
 * Cycle-1 demo matchup: wood vs water (operator-locked 2026-05-16).
 *
 * All consumers should pull from this module — single source of truth for
 * "which elements are in play right now." Random pairings + match-driven
 * matchups slot in later by changing only this constant (eventually swapping
 * to a hook reading GameState).
 */

import type { ElementId } from "@/lib/purupuru/contracts/types";

import { ZONE_POSITIONS, type ZonePlacement } from "./zones";

/** The two elements currently competing on the map. */
export const ACTIVE_MATCHUP: readonly ElementId[] = ["wood", "water"] as const;

export function isActiveElement(elementId: ElementId): boolean {
  return ACTIVE_MATCHUP.includes(elementId);
}

// ─── Yugioh battlefield layout ──────────────────────────────────────────────
// Operator direction 2026-05-16: "user's side closer to them and opponent
// side closer to them like a yugioh map." Cycle-1 = wood (player) vs water
// (opponent) — placed on opposite ends of the Z axis so the camera reads a
// clear two-sided playmat instead of two clustered districts.
//
// Player side at POSITIVE Z (closer to camera in the world's southern half).
// Opponent side at NEGATIVE Z (further from camera in the northern half).
// If the Z direction reads inverted, swap the signs here — pure data.

export interface BattlefieldOverride {
  readonly x: number;
  readonly z: number;
}

const MATCHUP_BATTLEFIELD: Partial<Record<ElementId, BattlefieldOverride>> = {
  wood: { x: -2, z: 12 }, // player side
  water: { x: 2, z: -12 }, // opponent side
};

/** Returns the matchup-overridden (x,z) for an element, or null if no override. */
export function battlefieldOverrideFor(
  elementId: ElementId,
): BattlefieldOverride | null {
  return MATCHUP_BATTLEFIELD[elementId] ?? null;
}

/** Apply the battlefield override to a ZonePlacement (returns a new placement). */
export function effectiveZonePlacement(zone: ZonePlacement): ZonePlacement {
  const override = battlefieldOverrideFor(zone.elementId);
  if (!override) return zone;
  return { ...zone, x: override.x, z: override.z };
}

/** Active zone placements with battlefield overrides applied. */
export function activeBattlefieldZones(): readonly ZonePlacement[] {
  return ZONE_POSITIONS.filter((z) => isActiveElement(z.elementId)).map(
    effectiveZonePlacement,
  );
}

/** ZONE_POSITIONS filtered to active matchup zones (canonical x/z, no override). */
export function activeZonePositions(): readonly ZonePlacement[] {
  return ZONE_POSITIONS.filter((z) => isActiveElement(z.elementId));
}
