/**
 * Burn rite — pure logic tests. Burn-rite cycle S2 (sprint-149).
 *
 * Ports the canonical purupuru-game `burn.test.ts` assertions, plus the
 * resonance-leveling cases (FR-5) the canonical suite does not cover.
 * Asserts SDD invariants:
 *   1 — set→transcendence-card mapping (Jani→Forge, A→Garden, B→Void)
 *   4 — one-of-each-element eligibility (`.find()`, not `.filter()`)
 *   5 — one-way burn, removal by `id` (duplicate `defId` survives)
 *   7 — first burn yields the transcendence card at `resonance === 1`
 */

import { describe, expect, it } from "vitest";
import { executeBurn, getBurnCandidates } from "../burn";
import { CARD_DEFINITIONS, createCard, type Card } from "../cards";

/** Build a collection from base-card defIds. */
function makeCollection(defIds: readonly string[]): Card[] {
  return defIds.map((defId) => {
    const def = CARD_DEFINITIONS.find((d) => d.defId === defId)!;
    return createCard(def);
  });
}

const COMPLETE_JANI = [
  "jani-wood",
  "jani-fire",
  "jani-earth",
  "jani-metal",
  "jani-water",
] as const;

describe("getBurnCandidates", () => {
  it("returns 3 candidates (one per set type)", () => {
    expect(getBurnCandidates([]).length).toBe(3);
  });

  it("incomplete set is not marked complete (invariant 4)", () => {
    const cards = makeCollection(["jani-wood", "jani-fire", "jani-earth"]);
    const jani = getBurnCandidates(cards).find((c) => c.setType === "jani");
    expect(jani!.complete).toBe(false);
    expect(jani!.cards.length).toBe(3);
  });

  it("3 copies of one element is incomplete — one-of-each, not filter (invariant 4)", () => {
    const wood = CARD_DEFINITIONS.find((d) => d.defId === "jani-wood")!;
    const cards = [createCard(wood), createCard(wood), createCard(wood)];
    const jani = getBurnCandidates(cards).find((c) => c.setType === "jani");
    expect(jani!.complete).toBe(false);
    expect(jani!.cards.length).toBe(1); // .find() picks one wood-jani, no other element
  });

  it("complete jani set is marked complete", () => {
    const jani = getBurnCandidates(makeCollection([...COMPLETE_JANI])).find(
      (c) => c.setType === "jani",
    );
    expect(jani!.complete).toBe(true);
    expect(jani!.cards.length).toBe(5);
  });

  it("jani burns into The Forge (invariant 1)", () => {
    const jani = getBurnCandidates([]).find((c) => c.setType === "jani");
    expect(jani!.transcendenceDefId).toBe("transcendence-forge");
  });

  it("caretaker_a burns into The Garden (invariant 1)", () => {
    const ca = getBurnCandidates([]).find((c) => c.setType === "caretaker_a");
    expect(ca!.transcendenceDefId).toBe("transcendence-garden");
  });

  it("caretaker_b burns into The Void (invariant 1)", () => {
    const cb = getBurnCandidates([]).find((c) => c.setType === "caretaker_b");
    expect(cb!.transcendenceDefId).toBe("transcendence-void");
  });
});

describe("executeBurn", () => {
  it("removes burned cards and adds the transcendence card", () => {
    const allJani = makeCollection([...COMPLETE_JANI]);
    const extra = makeCollection(["caretaker-a-wood"]);
    const result = executeBurn(
      [...allJani, ...extra],
      allJani,
      "transcendence-forge",
    );
    expect(result.newCards.length).toBe(2);
    expect(result.newCards.some((c) => c.defId === "caretaker-a-wood")).toBe(
      true,
    );
    expect(result.newCards.some((c) => c.defId === "transcendence-forge")).toBe(
      true,
    );
    expect(result.transcendenceCard.cardType).toBe("transcendence");
  });

  it("burned cards are not in the result — one-way (invariant 5)", () => {
    const cards = makeCollection([...COMPLETE_JANI]);
    const result = executeBurn(cards, cards, "transcendence-forge");
    expect(result.newCards.length).toBe(1);
    expect(result.newCards[0].defId).toBe("transcendence-forge");
  });

  it("removes by id — a duplicate defId not in burnCards survives (invariant 5)", () => {
    const wood = CARD_DEFINITIONS.find((d) => d.defId === "jani-wood")!;
    const keep = createCard(wood); // a wood-jani we are NOT burning
    const allJani = makeCollection([...COMPLETE_JANI]); // a different wood-jani inside
    const result = executeBurn([keep, ...allJani], allJani, "transcendence-forge");
    expect(result.newCards.length).toBe(2); // keep + the transcendence card
    expect(result.newCards.some((c) => c.id === keep.id)).toBe(true);
  });

  it("first burn yields the transcendence card at resonance 1 (invariant 7)", () => {
    const cards = makeCollection([...COMPLETE_JANI]);
    const result = executeBurn(cards, cards, "transcendence-forge");
    expect(result.isLevelUp).toBe(false);
    expect(result.transcendenceCard.resonance).toBe(1);
  });

  it("re-burn when the transcendence card is already owned levels resonance (FR-5)", () => {
    // R1
    const firstSet = makeCollection([...COMPLETE_JANI]);
    const r1 = executeBurn(firstSet, firstSet, "transcendence-forge");
    expect(r1.transcendenceCard.resonance).toBe(1);

    // R1 → R2: re-complete the set, burn again while owning the Forge
    const secondSet = makeCollection([...COMPLETE_JANI]);
    const r2 = executeBurn(
      [...r1.newCards, ...secondSet],
      secondSet,
      "transcendence-forge",
    );
    expect(r2.isLevelUp).toBe(true);
    expect(r2.transcendenceCard.resonance).toBe(2);
    // leveled, not duplicated — exactly one transcendence-forge remains
    expect(
      r2.newCards.filter((c) => c.defId === "transcendence-forge").length,
    ).toBe(1);

    // R2 → R3
    const thirdSet = makeCollection([...COMPLETE_JANI]);
    const r3 = executeBurn(
      [...r2.newCards, ...thirdSet],
      thirdSet,
      "transcendence-forge",
    );
    expect(r3.transcendenceCard.resonance).toBe(3);
  });
});
