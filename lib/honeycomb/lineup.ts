/**
 * Lineup validation — pure rules from purupuru-game/INVARIANTS.md.
 *
 *   - Exactly 5 cards per lineup
 *   - Max 1 transcendence card per lineup
 *
 * Pure module. Returns the failure reason, or null when the selection is valid.
 */

import type { Card } from "./cards";

export type LineupError =
  | { readonly kind: "wrong-count"; readonly got: number }
  | { readonly kind: "too-many-transcendence"; readonly got: number };

export function validateLineup(selectedCards: readonly Card[]): LineupError | null {
  if (selectedCards.length !== 5) {
    return { kind: "wrong-count", got: selectedCards.length };
  }
  const transcendenceCount = selectedCards.filter((c) => c.cardType === "transcendence").length;
  if (transcendenceCount > 1) {
    return { kind: "too-many-transcendence", got: transcendenceCount };
  }
  return null;
}

export function canAddToLineup(card: Card, current: readonly Card[]): boolean {
  if (current.length >= 5) return false;
  if (card.cardType === "transcendence") {
    return !current.some((c) => c.cardType === "transcendence");
  }
  return true;
}
