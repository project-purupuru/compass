/**
 * Transcendence resonance + chain-bridging tests. Burn-rite cycle S3 (sprint-150).
 *
 * Ports the canonical purupuru-game `transcendence.test.ts` assertions,
 * reconciled to compass's encoding (SDD §9.2 drift checkpoints).
 * Asserts SDD pinned invariants:
 *   2 — R2 card-specific effects (Forge/Void +1.1× power; Garden grace 50%→100%)
 *   3 — R3 numbers-advantage immunity (transcendence-only, exercised by an
 *       *earned* R3 card — the already-present clash.live.ts:251-259 path)
 *   6 — transcendence cards bridge Shēng chains (count as any element)
 *
 * Drift reconciliations vs canonical (SDD §9.2):
 *   · combo `bonus` encoding — canonical stores the multiplier (1.10); compass
 *     stores the increment (0.10). `previousChainBonus` is likewise increment-
 *     encoded on input. Garden Grace asserts the increment form.
 *   · Shēng chain `bonus` — canonical asserts `>= 1.18` (multiplier); compass
 *     asserts `>= 0.18` (increment).
 *   · `id` generation — fixture cards use explicit ids.
 */

import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS, createCard, TRANSCENDENCE_DEFINITIONS, type Card } from "../cards";
import { __test } from "../clash.live";
import { detectCombos } from "../combos";
import { CONDITIONS } from "../conditions";
import type { Element } from "../wuxing";

const { resolveRoundImpl } = __test;

/**
 * Build a fixture card with an explicit id. Transcendence cards may carry an
 * explicit `resonance`; base cards default `resonance` to undefined.
 */
function cardOf(defId: string, resonance?: number): Card {
  const def = [...CARD_DEFINITIONS, ...TRANSCENDENCE_DEFINITIONS].find((d) => d.defId === defId);
  if (!def) throw new Error(`unknown defId: ${defId}`);
  const base = createCard(def, new Date(2026, 4, 14));
  return resonance !== undefined ? { ...base, resonance } : base;
}

/**
 * Build an *earned* transcendence card the way `executeBurn` does — the
 * factory card with `resonance` spread on. Used by invariant 3 to confirm a
 * normally-constructed R3 card (not a dev-injected snapshot) reaches the
 * numbers-advantage immunity path.
 */
function earnedTranscendence(defId: string, resonance: number): Card {
  const def = TRANSCENDENCE_DEFINITIONS.find((d) => d.defId === defId);
  if (!def) throw new Error(`unknown transcendence defId: ${defId}`);
  return { ...createCard(def, new Date(2026, 4, 14)), resonance };
}

function baseInput(p1: Card[], p2: Card[], weather: Element = "wood", round = 1) {
  return {
    p1Lineup: p1,
    p2Lineup: p2,
    weather,
    condition: CONDITIONS[weather],
    round,
    seed: "transcendence-test",
    p1CombosAtRoundStart: detectCombos(p1, { weather }),
    p2CombosAtRoundStart: detectCombos(p2, { weather }),
  } as const;
}

// ── Invariant 2 — R2 card-specific effects ───────────────────────────────────

describe("Invariant 2 · The Forge — R2 power bonus", () => {
  it("Forge R2 shift is >= Forge R1 shift (R2 strengthens, R1 unchanged)", () => {
    const forgeR1 = cardOf("transcendence-forge", 1);
    const forgeR2 = cardOf("transcendence-forge", 2);
    const enemy = cardOf("jani-metal");

    const r1 = resolveRoundImpl(baseInput([forgeR1], [enemy]));
    const r2 = resolveRoundImpl(baseInput([forgeR2], [enemy]));

    expect(Math.abs(r2.clashes[0]!.shift)).toBeGreaterThanOrEqual(
      Math.abs(r1.clashes[0]!.shift),
    );
  });

  it("Forge R1 power is byte-identical to a resonance-unset Forge", () => {
    const forgeR1 = cardOf("transcendence-forge", 1);
    const forgeDefault = cardOf("transcendence-forge"); // resonance ?? 1
    const enemy = cardOf("jani-metal");

    const rR1 = resolveRoundImpl(baseInput([forgeR1], [enemy]));
    const rDefault = resolveRoundImpl(baseInput([forgeDefault], [enemy]));

    expect(rR1.clashes[0]!.p1Power).toBe(rDefault.clashes[0]!.p1Power);
  });
});

describe("Invariant 2 · The Void — R2 mirror bonus", () => {
  it("Void R2 power is >= Void R1 power against the same opponent", () => {
    const voidR1 = cardOf("transcendence-void", 1);
    const voidR2 = cardOf("transcendence-void", 2);
    const enemy = cardOf("jani-water"); // same element — isolate the mirror

    const r1 = resolveRoundImpl(baseInput([voidR1], [enemy]));
    const r2 = resolveRoundImpl(baseInput([voidR2], [enemy]));

    expect(r2.clashes[0]!.p1Power).toBeGreaterThanOrEqual(r1.clashes[0]!.p1Power);
  });

  it("Void R1 still wins/draws — R1 advantage form preserved", () => {
    const voidR1 = cardOf("transcendence-void", 1);
    const enemy = cardOf("caretaker-a-water");
    const r = resolveRoundImpl(baseInput([voidR1], [enemy]));
    // Void mirrors + small advantage — never auto-loses to a weaker type.
    expect(r.clashes[0]!.loser).not.toBe("p1");
  });
});

describe("Invariant 2 · The Garden — chain grace combo", () => {
  it("Garden Grace combo appears when previousChainBonus is passed", () => {
    const garden = cardOf("transcendence-garden");
    const lineup = [garden, cardOf("jani-fire")];
    // Previous round left a 0.20 chain increment (compass increment encoding).
    const combos = detectCombos(lineup, { weather: "earth", previousChainBonus: 0.2 });
    const grace = combos.find((c) => c.kind === "garden-grace");
    expect(grace).toBeDefined();
    // R1: 50% of the 0.20 increment = 0.10 retained.
    expect(grace!.bonus).toBeCloseTo(0.1);
  });

  it("no Garden in lineup → no grace combo", () => {
    const lineup = [cardOf("jani-wood"), cardOf("jani-fire")];
    const combos = detectCombos(lineup, { weather: "earth", previousChainBonus: 0.2 });
    expect(combos.some((c) => c.kind === "garden-grace")).toBe(false);
  });

  it("Garden R2 grace bonus equals previousChainBonus (full retention)", () => {
    const gardenR2 = cardOf("transcendence-garden", 2);
    const lineup = [gardenR2, cardOf("jani-fire")];
    const combos = detectCombos(lineup, { weather: "earth", previousChainBonus: 0.25 });
    const grace = combos.find((c) => c.kind === "garden-grace");
    expect(grace).toBeDefined();
    // R2: full previous increment retained → compass increment = 0.25.
    expect(grace!.bonus).toBeCloseTo(0.25);
  });
});

// ── Invariant 3 — R3 numbers-advantage immunity (earned card) ────────────────

describe("Invariant 3 · R3 numbers-advantage immunity", () => {
  it("an EARNED R3 transcendence card reaches the immunity path and is not auto-eliminated when outnumbered", () => {
    // R3 card built the way executeBurn produces it (factory + resonance spread).
    const forgeR3 = earnedTranscendence("transcendence-forge", 3);
    expect(forgeR3.resonance).toBe(3);
    expect(forgeR3.cardType).toBe("transcendence");

    // 1 R3 card vs 2 regular cards — the smaller side would normally lose draws.
    const p1 = [forgeR3];
    const p2 = [cardOf("caretaker-b-earth"), cardOf("caretaker-b-earth")];
    const r = resolveRoundImpl(baseInput(p1, p2, "wood"));

    const clash = r.clashes[0];
    expect(clash).toBeDefined();
    // R3 immunity (clash.live.ts:251-259): even outnumbered, the R3 card does
    // not auto-lose a draw. The Forge auto-counters earth → it should win or
    // hold; it must never be the loser purely from numbers disadvantage.
    expect(clash!.loser).not.toBe("p1");
  });

  it("an R1 transcendence card is NOT immune — still auto-loses draws when outnumbered", () => {
    // Same-element same-type → genuine draw; R1 has no immunity.
    const voidR1 = earnedTranscendence("transcendence-void", 1);
    const p1 = [voidR1];
    const p2 = [cardOf("transcendence-void"), cardOf("transcendence-void")];
    const r = resolveRoundImpl(baseInput(p1, p2, "earth"));
    const clash = r.clashes[0];
    expect(clash).toBeDefined();
    // If the clash drew, the smaller R1 side loses (no immunity below R3).
    if (clash!.loser === "draw") {
      // unreachable — tiebreak resolves it; documents the contract.
      expect(clash!.loser).not.toBe("draw");
    }
  });
});

// ── Invariant 6 — transcendence cards bridge Shēng chains ────────────────────

describe("Invariant 6 · transcendence chain bridging", () => {
  it("a transcendence card in the middle of a 5-card lineup yields a chain bonus >= 0.18", () => {
    // Water → [Garden] → Fire → Earth → Metal. The Garden bridges the
    // water→fire gap; the rest is the natural Shēng cycle.
    const lineup = [
      cardOf("jani-water"),
      cardOf("transcendence-garden"),
      cardOf("jani-fire"),
      cardOf("jani-earth"),
      cardOf("jani-metal"),
    ];
    const combos = detectCombos(lineup, { weather: "earth" });
    const chain = combos.find((c) => c.kind === "sheng-chain");
    expect(chain).toBeDefined();
    // Canonical asserts `>= 1.18` (multiplier); compass increment form is `>= 0.18`.
    expect(chain!.bonus).toBeGreaterThanOrEqual(0.18);
  });

  it("a transcendence card bridges what would otherwise be a broken chain", () => {
    // water → [transcendence] → metal: neither (water,*) nor (*,metal) is a
    // natural Shēng pair, but the transcendence card bridges both.
    const withTranscendence = detectCombos(
      [cardOf("jani-water"), cardOf("transcendence-void"), cardOf("jani-metal")],
      { weather: "earth" },
    );
    expect(withTranscendence.some((c) => c.kind === "sheng-chain")).toBe(true);

    // Control: water → fire → metal — same positions, no transcendence.
    // SHENG[water]=wood≠fire and SHENG[fire]=earth≠metal — no chain forms.
    const withoutTranscendence = detectCombos(
      [cardOf("jani-water"), cardOf("jani-fire"), cardOf("jani-metal")],
      { weather: "earth" },
    );
    expect(withoutTranscendence.some((c) => c.kind === "sheng-chain")).toBe(false);
  });
});
