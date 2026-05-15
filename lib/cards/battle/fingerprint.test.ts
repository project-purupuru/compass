import { describe, expect, test } from "vitest";

import { createBattleCard } from "./card-defs";
import { fingerprintBattleState, stableJson } from "./fingerprint";
import { createMatch, lockIn, withPlayerLineup, type MatchState } from "./match";

function reinstanceLineup(lineup: MatchState["playerLineup"]) {
  return lineup.map((card) => createBattleCard(card.defId, card.resonance));
}

function reinstanceArrangeState(state: MatchState): MatchState {
  return {
    ...state,
    phase: "arrange",
    playerLineup: reinstanceLineup(state.playerLineup),
    opponentLineup: reinstanceLineup(state.opponentLineup),
    roundResult: null,
    revealedClashes: 0,
    history: [],
    winner: null,
  };
}

describe("Battle V2 state fingerprints", () => {
  test("produce a SHA-256 digest with sorted canonical JSON", () => {
    expect(stableJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');

    const digest = fingerprintBattleState(createMatch({ imbalanceElement: "wood" })).digest;
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
  });

  test("ignore uid churn and cosmetic clash whispers", () => {
    const base = createMatch({ imbalanceElement: "wood" });
    const clone = reinstanceArrangeState(base);

    expect(base.playerLineup[0]?.uid).not.toBe(clone.playerLineup[0]?.uid);

    const lockedBase = lockIn(base);
    const lockedClone = lockIn(clone);

    expect(fingerprintBattleState(lockedClone)).toEqual(fingerprintBattleState(lockedBase));
  });

  test("changes when the player lineup order changes", () => {
    const base = createMatch({ imbalanceElement: "wood" });
    const swapped = withPlayerLineup(base, [
      base.playerLineup[1],
      base.playerLineup[0],
      ...base.playerLineup.slice(2),
    ]);

    expect(fingerprintBattleState(swapped).digest).not.toBe(
      fingerprintBattleState(base).digest,
    );
  });
});
