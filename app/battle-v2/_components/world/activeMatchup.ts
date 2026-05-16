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

/** ZONE_POSITIONS filtered down to only the active matchup zones. */
export function activeZonePositions(): readonly ZonePlacement[] {
  return ZONE_POSITIONS.filter((z) => isActiveElement(z.elementId));
}
