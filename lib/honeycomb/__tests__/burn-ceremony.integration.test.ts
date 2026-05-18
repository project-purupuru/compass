/**
 * Burn ceremony — end-to-end integration test. Burn-rite cycle S5
 * (sprint-152), SDD §9.4.
 *
 * The behavioral oracle for the `/burn` route's substrate path. Exercises
 * the exact sequence the route runs at the `ceremony → reveal` transition,
 * against the in-memory `CollectionMock`:
 *
 *   seed a complete jani set
 *     → `getBurnCandidates` finds it eligible
 *     → `executeBurn` (pure)
 *     → `Collection.replaceAll(result.newCards)`
 *     → `Collection.getAll()` shows The Forge at resonance 1, 5 jani gone
 *
 * Mirrors canonical UC-1. Pure logic is unit-tested in `burn.test.ts`;
 * this test pins the *integration* — the pure result actually round-trips
 * through the Collection service the route persists to.
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { executeBurn, getBurnCandidates } from "../burn";
import { CARD_DEFINITIONS, createCard, type Card } from "../cards";
import { CollectionMock } from "../collection.mock";
import { Collection } from "../collection.port";

/** A complete 5-element jani set — the burn-eligible fixture. */
function completeJaniSet(): Card[] {
  return CARD_DEFINITIONS.filter((d) => d.cardType === "jani").map((d) =>
    createCard(d),
  );
}

describe("burn ceremony — seed → eligible → burn → replaceAll → getAll (SDD §9.4)", () => {
  it("a complete jani set burns into The Forge at resonance 1, 5 jani gone (UC-1)", async () => {
    const seeded = completeJaniSet();
    expect(seeded).toHaveLength(5);

    // The route's `select` phase: read the collection, derive candidates.
    const program = Effect.gen(function* () {
      const collection = yield* Collection;

      const owned = yield* collection.getAll();
      const candidates = getBurnCandidates(owned);
      const jani = candidates.find((c) => c.setType === "jani");

      // Eligibility — the `select`/`confirm` gate (`candidate.complete`).
      if (!jani || !jani.complete) {
        throw new Error("expected the seeded jani set to be burn-eligible");
      }

      // The route's `ceremony → reveal` transition: pure burn, then persist.
      const burn = executeBurn(owned, jani.cards, jani.transcendenceDefId);
      yield* collection.replaceAll(burn.newCards);

      // The route's `done` phase: read the refreshed collection.
      const after = yield* collection.getAll();
      return { burn, after };
    });

    const { burn, after } = await Effect.runPromise(
      Effect.provide(program, CollectionMock(seeded)),
    );

    // The Forge minted at resonance 1 (invariant 7, first-burn).
    expect(burn.isLevelUp).toBe(false);
    expect(burn.transcendenceCard.defId).toBe("transcendence-forge");
    expect(burn.transcendenceCard.resonance).toBe(1);

    // Persisted collection: The Forge present, exactly one transcendence
    // card, and ALL five jani cards gone (invariant 5, one-way burn).
    expect(after).toHaveLength(1);
    const forge = after.find((c) => c.defId === "transcendence-forge");
    expect(forge).toBeDefined();
    expect(forge?.resonance).toBe(1);
    expect(after.some((c) => c.cardType === "jani")).toBe(false);

    // Removal is by id — none of the seeded jani ids survive.
    const seededIds = new Set(seeded.map((c) => c.id));
    expect(after.some((c) => seededIds.has(c.id))).toBe(false);
  });

  it("an incomplete set is not eligible — the precondition the route gates on (SDD §10)", async () => {
    // Three jani, two elements missing — `select`/`confirm` must not let
    // this reach `ceremony`. The pure `executeBurn` trusts its caller;
    // this eligibility check is the route's forward contract.
    const partial = CARD_DEFINITIONS.filter((d) => d.cardType === "jani")
      .slice(0, 3)
      .map((d) => createCard(d));

    const eligible = await Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const collection = yield* Collection;
          const owned = yield* collection.getAll();
          const jani = getBurnCandidates(owned).find(
            (c) => c.setType === "jani",
          );
          return jani?.complete ?? false;
        }),
        CollectionMock(partial),
      ),
    );

    expect(eligible).toBe(false);
  });

  it("re-burn while owning The Forge levels resonance, persisted (FR-5)", async () => {
    // Seed: The Forge at R1 already owned + a fresh complete jani set.
    const forgeR1: Card = {
      ...createCard(CARD_DEFINITIONS[0]),
      defId: "transcendence-forge",
      cardType: "transcendence",
      resonance: 1,
    };
    const freshSet = completeJaniSet();

    const after = await Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const collection = yield* Collection;
          const owned = yield* collection.getAll();
          const jani = getBurnCandidates(owned).find(
            (c) => c.setType === "jani",
          );
          if (!jani?.complete) throw new Error("expected eligible jani set");
          const burn = executeBurn(owned, jani.cards, jani.transcendenceDefId);
          yield* collection.replaceAll(burn.newCards);
          return yield* collection.getAll();
        }),
        CollectionMock([forgeR1, ...freshSet]),
      ),
    );

    // Exactly one Forge, leveled to R2 — not duplicated.
    const forges = after.filter((c) => c.defId === "transcendence-forge");
    expect(forges).toHaveLength(1);
    expect(forges[0].resonance).toBe(2);
    expect(after.some((c) => c.cardType === "jani")).toBe(false);
  });
});
