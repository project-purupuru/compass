/**
 * Burn rite — pure eligibility + resolution logic.
 *
 * Ported from purupuru-game's `burn.ts` (the canonical engine). Pure TS,
 * no Effect, no I/O — `getBurnCandidates` and `executeBurn` are pure
 * functions over a `Card[]`. The Collection-port seam (reading the
 * player's collection, persisting the result) is S4's concern, not this
 * module's — `burn.ts` stays pure (SDD §7.1, NFR-3).
 *
 * Canonical source: purupuru-game/prototype/src/lib/game/burn.ts
 * Drifts from canonical (per SDD §9.2):
 *   - imports adapted to compass's ./cards + ./wuxing; the transcendence
 *     def is resolved via `findDef` (compass keeps transcendence cards in
 *     TRANSCENDENCE_DEFINITIONS, not CARD_DEFINITIONS)
 *   - `executeBurn` mints the transcendence card via compass's
 *     `createCard()` factory for a uniform id, then spreads `resonance: 1`
 *     (canonical hand-rolls a `Date.now()` id)
 *   - canonical's unused `missing: Element[]` accumulator is dropped
 *     (computed but never returned or read — dead in canonical too)
 */

import { createCard, findDef, type Card, type CardType } from "./cards";
import { ELEMENT_ORDER } from "./wuxing";

/**
 * Which transcendence card each set burns into. PINNED (FR-9) — ported
 * verbatim from canonical `burn.ts:7-11`. Test-locked in `burn.test.ts`.
 */
const SET_TO_TRANSCENDENCE: Record<string, string> = {
  jani: "transcendence-forge",
  caretaker_a: "transcendence-garden",
  caretaker_b: "transcendence-void",
};

export interface BurnCandidate {
  readonly setType: CardType;
  readonly setLabel: string;
  readonly transcendenceDefId: string;
  readonly transcendenceName: string;
  /** One card per element that would be burned. */
  readonly cards: readonly Card[];
  /** Whether the player has all 5 elements for this set. */
  readonly complete: boolean;
}

/**
 * Check which sets the player can burn. Pure.
 *
 * A set is burnable when the collection holds **one card of each of the
 * 5 elements** for that set type — `.find()` per element, NOT `.filter()`.
 * Three copies of the same element do not satisfy a 5-element set.
 */
export function getBurnCandidates(
  playerCards: readonly Card[],
): BurnCandidate[] {
  const setTypes: { type: CardType; label: string }[] = [
    { type: "jani", label: "Elemental Jani" },
    { type: "caretaker_a", label: "Kizuna A" },
    { type: "caretaker_b", label: "Kizuna B" },
  ];

  return setTypes.map(({ type, label }) => {
    const transDefId = SET_TO_TRANSCENDENCE[type];
    const transDef = findDef(transDefId);

    const cards: Card[] = [];
    for (const el of ELEMENT_ORDER) {
      const card = playerCards.find(
        (c) => c.cardType === type && c.element === el,
      );
      if (card) cards.push(card);
    }

    return {
      setType: type,
      setLabel: label,
      transcendenceDefId: transDefId,
      transcendenceName: transDef?.name ?? "Unknown",
      cards,
      complete: cards.length === 5,
    };
  });
}

/**
 * Execute the burn: remove the 5 set cards, mint or level-up the
 * transcendence card. One-way — burned cards are gone (re-acquirable only
 * from future packs, out of scope this cycle). Pure.
 *
 * `burnCards` is taken on trust: the precondition (the set must be
 * `complete`) is enforced by the ceremony's phase gating (S5), not here.
 * Keeping the pure function permissive keeps it pure (SDD §10).
 *
 * Removal is by `id` (not `defId`) — a duplicate `defId` that is not in
 * `burnCards` survives the burn (invariant 5).
 *
 * If the player already owns the mapped transcendence card, its
 * `resonance` is incremented instead of minting a duplicate (FR-5).
 */
export function executeBurn(
  playerCards: readonly Card[],
  burnCards: readonly Card[],
  transcendenceDefId: string,
): {
  readonly newCards: readonly Card[];
  readonly transcendenceCard: Card;
  readonly isLevelUp: boolean;
} {
  const burnIds = new Set(burnCards.map((c) => c.id));
  const remaining = playerCards.filter((c) => !burnIds.has(c.id));

  // Already own this transcendence card? Level up its resonance.
  const existing = remaining.find((c) => c.defId === transcendenceDefId);
  if (existing) {
    const leveled: Card = {
      ...existing,
      resonance: (existing.resonance ?? 1) + 1,
    };
    const newCards = remaining.map((c) =>
      c.id === existing.id ? leveled : c,
    );
    return { newCards, transcendenceCard: leveled, isLevelUp: true };
  }

  // First burn: mint the transcendence card at resonance 1.
  const transDef = findDef(transcendenceDefId)!;
  const transcendenceCard: Card = { ...createCard(transDef), resonance: 1 };
  return {
    newCards: [...remaining, transcendenceCard],
    transcendenceCard,
    isLevelUp: false,
  };
}
