/**
 * Battlefield geometry — spatial constants for BattleField rendering.
 *
 * Per Q-SDD-2 resolution (SDD §2.3): owns its own module to keep wuxing.ts
 * focused on elemental physics. Pure constants + helpers only · no runtime
 * coupling to anything outside lib/honeycomb/.
 *
 * Coordinate space: [0, 100] for both x and y (percentage of battlefield
 * viewport). Each element has a territory center; cards arrange around it.
 */

import type { Element } from "./wuxing";

/** Territory centers for each element on the BattleField (% of viewport). */
export const TERRITORY_CENTERS: Record<Element, { readonly x: number; readonly y: number }> = {
  wood: { x: 42, y: 28 }, // upper-left · spring · morning
  fire: { x: 36, y: 55 }, // mid-left · summer · noon
  earth: { x: 58, y: 48 }, // center · stability · afternoon
  metal: { x: 72, y: 35 }, // upper-right · autumn · evening
  water: { x: 48, y: 72 }, // lower-center · winter · night
} as const;

/** Lineup grid: 5 card slots arranged horizontally below the territory plane. */
export const LINEUP_GRID = {
  /** Top-edge of lineup zone (% of viewport). */
  topY: 82,
  /** Card slot width (% of viewport). */
  slotWidth: 16,
  /** Spacing between slots (% of viewport). */
  slotGap: 2,
  /** Total lineup width (% of viewport). */
  totalWidth: 16 * 5 + 2 * 4,
  /** Horizontal origin (centered): (100 - totalWidth) / 2. */
  originX: (100 - (16 * 5 + 2 * 4)) / 2,
} as const;

/** Get the (x, y) center for a card slot at a given lineup position (0..4). */
export function lineupSlotCenter(position: number): { readonly x: number; readonly y: number } {
  const x =
    LINEUP_GRID.originX +
    position * (LINEUP_GRID.slotWidth + LINEUP_GRID.slotGap) +
    LINEUP_GRID.slotWidth / 2;
  const y = LINEUP_GRID.topY + LINEUP_GRID.slotWidth * 0.7;
  return { x, y };
}

/** Distance between a card slot and an element's territory center. */
export function distanceToTerritory(position: number, element: Element): number {
  const slot = lineupSlotCenter(position);
  const center = TERRITORY_CENTERS[element];
  const dx = slot.x - center.x;
  const dy = slot.y - center.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Battlefield edge constants for VFX boundaries. */
export const BATTLEFIELD_EDGES = {
  top: 0,
  bottom: 100,
  left: 0,
  right: 100,
  /** Inner safe area (excluding lineup zone). */
  safeAreaTop: 5,
  safeAreaBottom: 78,
  safeAreaLeft: 5,
  safeAreaRight: 95,
} as const;
