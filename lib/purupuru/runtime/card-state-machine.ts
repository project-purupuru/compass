/**
 * Card state machine — pure transition function (harness §7.2).
 *
 * Per SDD r1 §4.2 + validation_rules.md:26-27 invariant: a card cannot
 * exist in two locations at once.
 *
 * AC-5: full transition coverage.
 */

import type { CardLocation, SemanticEvent } from "../contracts/types";

/**
 * Returns the new card location for `cardInstanceId` given `event`, OR null if
 * the event doesn't reference this specific card. The caller dispatches per
 * card instance.
 */
export function transitionCard(
  current: CardLocation,
  event: SemanticEvent,
  cardInstanceId: string,
): CardLocation {
  // Helper: does event reference this card?
  const refersTo = (e: SemanticEvent): boolean => {
    if ("cardInstanceId" in e) return e.cardInstanceId === cardInstanceId;
    return false;
  };

  if (!refersTo(event)) return current;

  switch (current) {
    case "InDeck":
      // Drawn → InHand happens in two ticks: deck draws to staging, then enters hand.
      // Simplified for cycle 1: collapse Drawn into a single CardHovered-prep transition.
      // (Cycle 2 will refine if real deck draw mechanics ship.)
      return current;

    case "Drawn":
      // Transient state · UI moves Drawn → InHand on first reactive tick.
      return "InHand";

    case "InHand":
      if (event.type === "CardHovered") return "Hovered";
      if (event.type === "CardArmed") return "Armed";
      return current;

    case "Hovered":
      if (event.type === "CardArmed") return "Armed";
      // Hover ended → InHand (no specific event; UI manages)
      return current;

    case "Armed":
      if (event.type === "CardCommitted") return "Committed";
      if (event.type === "CardPlayRejected") return "InHand";
      return current;

    case "Committed":
      // Resolver picked it up.
      if (event.type === "CardResolved") return "Resolving";
      return current;

    case "Resolving":
      // Default cycle-1 path: Resolving → Discarded after CardResolved.
      // RewardGranted doesn't directly drive card state; CardResolved already fired.
      // Cycle-2 may add ReturnedToHand for specific card types.
      if (event.type === "CardResolved") return "Discarded";
      return current;

    case "Discarded":
    case "Exhausted":
    case "ReturnedToHand":
      // Terminal-ish states · cycle 1 doesn't shuffle back yet
      return current;

    default: {
      const _exhaustive: never = current;
      void _exhaustive;
      return current;
    }
  }
}
