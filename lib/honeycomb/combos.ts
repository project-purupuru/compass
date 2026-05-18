/**
 * Synergy detection — Shēng chain, Setup Strike, Elemental Surge, Weather Blessing.
 *
 * The hook of the game (per the design doc). Chains recalculate every round as
 * cards die. Order matters. Setup Strike deliberately breaks chains for focused
 * power — that's the tradeoff that makes lineup-shuffling between rounds dense.
 *
 * Pure module. Lifted from purupuru-game with the Setup Strike refinement from
 * world-purupuru state-v4 (Session 75 Gumi alignment).
 */

import type { Card } from "./cards";
import type { Element } from "./wuxing";
import { SHENG } from "./wuxing";

export type ComboKind =
  | "sheng-chain"
  | "setup-strike"
  | "elemental-surge"
  | "weather-blessing"
  | "garden-grace";

export interface Combo {
  readonly id: string;
  readonly kind: ComboKind;
  readonly name: string;
  readonly description: string;
  readonly positions: readonly number[];
  /** Multiplier applied to base power for affected positions. */
  readonly bonus: number;
  readonly affected: readonly number[];
}

export interface ComboSummary {
  readonly count: number;
  readonly totalBonus: number;
}

export interface DetectCombosOptions {
  readonly weather: Element;
  /** Previous-round chain bonus, used by The Garden grace mechanic. */
  readonly previousChainBonus?: number;
}

/**
 * Detect all active combos for the given lineup.
 *
 * Lineup is the 5 cards in arrangement order (left to right).
 * Returns combos in detection order. Multiple combos may affect the same
 * position; downstream `battle.live.ts` resolves stacking.
 */
export function detectCombos(lineup: readonly Card[], options: DetectCombosOptions): Combo[] {
  const combos: Combo[] = [];

  // 1. Shēng chain — consecutive generative-cycle pairs escalate.
  let chainStart = 0;
  for (let i = 0; i < lineup.length - 1; i++) {
    const a = lineup[i];
    const b = lineup[i + 1];
    if (!a || !b) continue;
    // Transcendence cards bridge chains — they count as any element needed
    // (canonical combos.ts:126-128).
    const isSheng =
      SHENG[a.element] === b.element ||
      a.cardType === "transcendence" ||
      b.cardType === "transcendence";
    if (isSheng) {
      // continues chain
      if (i === lineup.length - 2) {
        emitShengChain(combos, chainStart, i + 1);
      }
    } else {
      if (i > chainStart) emitShengChain(combos, chainStart, i);
      chainStart = i + 1;
    }
  }

  // 2. Setup Strike — caretaker before same-element jani (+30%, breaks chain).
  for (let i = 0; i < lineup.length - 1; i++) {
    const a = lineup[i];
    const b = lineup[i + 1];
    if (!a || !b) continue;
    const isCaretaker = a.cardType === "caretaker_a" || a.cardType === "caretaker_b";
    if (isCaretaker && b.cardType === "jani" && a.element === b.element) {
      combos.push({
        id: `setup-strike-${i}`,
        kind: "setup-strike",
        name: "Setup Strike",
        description: `${a.element} caretaker focuses ${a.element} Jani`,
        positions: [i, i + 1],
        bonus: 0.3,
        affected: [i + 1],
      });
    }
  }

  // 3. Elemental Surge — all 5 cards same element (+25%).
  if (lineup.length === 5) {
    const firstEl = lineup[0]?.element;
    if (firstEl && lineup.every((c) => c.element === firstEl)) {
      combos.push({
        id: "surge",
        kind: "elemental-surge",
        name: "Elemental Surge",
        description: `Five ${firstEl} cards — focused, predictable, strong`,
        positions: [0, 1, 2, 3, 4],
        bonus: 0.25,
        affected: [0, 1, 2, 3, 4],
      });
    }
  }

  // 4. Weather Blessing — cards matching today's weather get +15%.
  const weatherPositions = lineup
    .map((c, i) => (c.element === options.weather ? i : -1))
    .filter((i) => i >= 0);
  if (weatherPositions.length > 0) {
    combos.push({
      id: "weather-blessing",
      kind: "weather-blessing",
      name: "Weather Blessing",
      description: `${options.weather} resonance from the daily element`,
      positions: weatherPositions,
      bonus: 0.15,
      affected: weatherPositions,
    });
  }

  // 5. Garden Grace — The Garden retains a portion of last round's chain bonus.
  //    Canonical combos.ts:167-187. R1 retains 50%, R2 retains 100%.
  //
  //    Encoding (SDD §9.2): `previousChainBonus` arrives increment-encoded —
  //    the substrate carries chain bonus as `summary.totalBonus`, a sum of
  //    increment combo bonuses (`getPositionMultiplier` does `1 + c.bonus`).
  //    Canonical's formula is multiplier-encoded (`1 + (m-1)*0.5`); with
  //    `incr = m - 1` it reduces to the increment-native form below, and the
  //    pushed `bonus` is already in compass's increment encoding — no `-1`.
  const { previousChainBonus } = options;
  if (previousChainBonus && previousChainBonus > 0) {
    const garden = lineup.find((c) => c?.defId === "transcendence-garden");
    if (garden) {
      const resonance = garden.resonance ?? 1;
      // R1 retains 50% of last round's chain increment; R2 retains 100%.
      const actualGrace = resonance >= 2 ? previousChainBonus : previousChainBonus * 0.5;
      const positions = lineup.map((_, i) => i);
      combos.push({
        id: "garden-grace",
        kind: "garden-grace",
        name: "Garden Grace",
        description: "chain memory lingers",
        positions,
        bonus: actualGrace,
        affected: positions,
      });
    }
  }

  return combos;
}

function emitShengChain(combos: Combo[], start: number, end: number): void {
  const length = end - start + 1;
  if (length < 2) return;
  // Bonus scales with chain length: 2→+10%, 3→+18%, 4→+26%, 5→+35%
  const bonusByLength: Record<number, number> = { 2: 0.1, 3: 0.18, 4: 0.26, 5: 0.35 };
  const bonus = bonusByLength[length] ?? 0.35;
  const positions = Array.from({ length }, (_, k) => start + k);
  combos.push({
    id: `sheng-${start}-${end}`,
    kind: "sheng-chain",
    name: `Shēng Chain · ${length}`,
    description: `${length}-card generative cycle`,
    positions,
    bonus,
    affected: positions,
  });
}

export function getComboSummary(combos: readonly Combo[]): ComboSummary {
  return {
    count: combos.length,
    totalBonus: combos.reduce((sum, c) => sum + c.bonus * c.affected.length, 0),
  };
}

/** Position multiplier from combos. Multiplicative across combos. */
export function getPositionMultiplier(position: number, combos: readonly Combo[]): number {
  return combos
    .filter((c) => c.affected.includes(position))
    .reduce((mult, c) => mult * (1 + c.bonus), 1);
}
