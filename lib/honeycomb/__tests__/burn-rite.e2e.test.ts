/**
 * Burn rite — full end-to-end thread. Burn-rite cycle S5 (sprint-152),
 * Task 5.E2E / E2E-AC-4.
 *
 * Threads ONE card the whole way: a transcendence card is BURNED INTO
 * EXISTENCE, then dealt into a battle lineup, then resolved in clash.
 * Every prior sprint pins one seam — S5's `burn-ceremony.integration.test.ts`
 * the burn substrate path, S4's `match.reducer.test.ts` the deal seam, S3's
 * `transcendence.test.ts` the clash effects. This test proves the seams
 * CONNECT:
 *
 *   seed Collection → getBurnCandidates → executeBurn → replaceAll
 *     → initialSnapshot(seed, owned) → begin-match → choose-element
 *     → p1Lineup contains the earned card → resolveRoundImpl
 *     → the earned card is a clash participant
 *
 * The cycle's integration guarantee: a card the player earned through the
 * burn rite actually reaches — and survives the trip to — the battle it was
 * earned for. (S3 owns deep clash-mechanics assertions; this test owns the
 * THREAD.)
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { executeBurn, getBurnCandidates } from "../burn";
import { CARD_DEFINITIONS, createCard } from "../cards";
import { __test } from "../clash.live";
import { CollectionMock } from "../collection.mock";
import { Collection } from "../collection.port";
import { detectCombos } from "../combos";
import { CONDITIONS } from "../conditions";
import {
  initialSnapshot,
  reduce,
  type ReduceError,
  type ReduceResult,
} from "../match.reducer";

const { resolveRoundImpl } = __test;

function expectOk(r: ReduceResult | ReduceError): ReduceResult {
  if ("_tag" in r) throw new Error(`expected ReduceResult, got error ${r._tag}`);
  return r;
}

describe("burn rite — full thread: Collection → burn → deal → clash (E2E-AC-4)", () => {
  it("a transcendence card burned into existence reaches the battle lineup and resolves in clash", async () => {
    // ── Seed: a complete jani set (the burn fuel) + 4 caretaker_a cards so
    //    the post-burn collection still fills a 5-card lineup. ──
    const janiSet = CARD_DEFINITIONS.filter((d) => d.cardType === "jani").map(
      (d) => createCard(d),
    );
    const filler = CARD_DEFINITIONS.filter((d) => d.cardType === "caretaker_a")
      .slice(0, 4)
      .map((d) => createCard(d));
    expect(janiSet).toHaveLength(5);
    expect(filler).toHaveLength(4);

    // ── Burn path: the /burn route's ceremony→reveal substrate sequence —
    //    getBurnCandidates → executeBurn → Collection.replaceAll. ──
    const ownedAfterBurn = await Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const collection = yield* Collection;
          const owned = yield* collection.getAll();
          const jani = getBurnCandidates(owned).find(
            (c) => c.setType === "jani",
          );
          if (!jani?.complete) {
            throw new Error("expected the jani set to be burn-eligible");
          }
          const burn = executeBurn(owned, jani.cards, jani.transcendenceDefId);
          yield* collection.replaceAll(burn.newCards);
          return yield* collection.getAll();
        }),
        CollectionMock([...janiSet, ...filler]),
      ),
    );

    // The Forge was minted into the collection; the 5 jani are gone.
    const forge = ownedAfterBurn.find(
      (c) => c.defId === "transcendence-forge",
    );
    expect(forge).toBeDefined();
    expect(forge?.cardType).toBe("transcendence");
    expect(ownedAfterBurn.some((c) => c.cardType === "jani")).toBe(false);

    // ── Deal path: initialSnapshot carries the post-burn collection;
    //    begin-match preserves it (S4 FR-7a); choose-element deals it. ──
    const idle = initialSnapshot("e2e-burn-rite", ownedAfterBurn);
    const entered = expectOk(reduce(idle, { _tag: "begin-match" }));
    const arranged = expectOk(
      reduce(entered.next, { _tag: "choose-element", element: "metal" }),
    );

    // The earned Forge reached the playable lineup.
    const dealtForge = arranged.next.p1Lineup.find(
      (c) => c.defId === "transcendence-forge",
    );
    expect(dealtForge).toBeDefined();

    // ── Clash path: the dealt lineup resolves a round, and the
    //    burned-into-existence card is a clash participant. ──
    const p1 = arranged.next.p1Lineup;
    const weather = "metal" as const;
    const p2 = CARD_DEFINITIONS.filter((d) => d.cardType === "caretaker_b")
      .slice(0, p1.length)
      .map((d) => createCard(d));
    const result = resolveRoundImpl({
      p1Lineup: p1,
      p2Lineup: p2,
      weather,
      condition: CONDITIONS[weather],
      round: 1,
      seed: "e2e-burn-rite",
      p1CombosAtRoundStart: detectCombos(p1, { weather }),
      p2CombosAtRoundStart: detectCombos(p2, { weather }),
    });

    expect(result.clashes.length).toBeGreaterThan(0);
    const forgeClash = result.clashes.find(
      (c) => c?.p1Card.card.defId === "transcendence-forge",
    );
    expect(forgeClash).toBeDefined();
  });
});
