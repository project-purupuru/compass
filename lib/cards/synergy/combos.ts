/**
 * Synergy System — chain-based. Ported verbatim-in-logic from Gumi's game repo
 * (purupuru-game/prototype/src/lib/game/combos.ts) — her interpretation of the
 * canon. The only change: the input is a minimal `ComboCard` shape instead of
 * the repo's `BattleCard` (so this stands alone). The detection rules,
 * thresholds, bonuses, names, and tooltips are unchanged.
 *
 * 4 synergies:
 *   1. Shēng Chain    — consecutive generative-cycle pairs escalate
 *   2. Setup Strike   — caretaker before same-element jani (+30%, breaks chain)
 *   3. Elemental Surge — all cards same element (+25%, exclusive)
 *   4. Weather Blessing — cards matching today's weather (+15%, non-positional)
 *   (+ Garden Grace — transcendence-garden retains chain bonus across rounds)
 */

import { SHENG, type Element } from "./wuxing";

export type ComboCardType = "jani" | "caretaker_a" | "caretaker_b" | "transcendence";

/** Minimal card shape the synergy detector needs. */
export interface ComboCard {
  readonly element: Element;
  readonly cardType: ComboCardType;
  /** Optional — only Garden Grace reads these. */
  readonly defId?: string;
  readonly resonance?: number;
}

export interface Combo {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly tooltip: string;
  /** Which lineup positions are involved. */
  readonly positions: number[];
  /** Power multiplier. */
  readonly bonus: number;
  /** Which positions receive the bonus. */
  readonly beneficiaries: number[];
}

/** Chain bonus per length (index = number of links, value = per-card multiplier). */
const CHAIN_BONUS = [1.0, 1.1, 1.15, 1.18, 1.2];
// 0 links = no bonus, 1 = +10%, 2 = +15%, 3 = +18%, 4 = +20% (full cycle)

const CHAIN_NAMES: Record<number, { name: string; icon: string }> = {
  1: { name: "Shēng Link", icon: "🔗" },
  2: { name: "Shēng Chain", icon: "⛓️" },
  3: { name: "Shēng Flow", icon: "🌊" },
  4: { name: "Full Cycle", icon: "🌀" },
};

const CHAIN_TOOLTIPS: Record<number, string> = {
  1: "Two cards in the generative cycle — the first nourishes the second. Place more in sequence to extend the chain.",
  2: "Three cards flowing through the Shēng cycle. The chain grows stronger with each link.",
  3: "Four cards in the generative cycle. One more completes the full circle.",
  4: "The complete Wuxing cycle — all five phases flowing into each other. Harmony, not dominance — the bonus is meaningful but not overwhelming.",
};

/**
 * Detect all active synergies in a lineup.
 * @param previousChainBonus If The Garden survived last round, pass the previous chain bonus for grace period.
 */
export function detectCombos(
  lineup: readonly ComboCard[],
  weatherElement?: Element,
  previousChainBonus?: number,
): Combo[] {
  if (lineup.length === 0) return [];

  const combos: Combo[] = [];
  const elements = new Set(lineup.map((c) => c.element));
  const isMonoElement = elements.size === 1 && lineup.length >= 3;

  // ===== ELEMENTAL SURGE (all same element, 3+ cards) =====
  if (isMonoElement) {
    const el = lineup[0].element;
    const elNames: Record<string, string> = {
      wood: "The forest breathes as one",
      fire: "A wildfire needs no permission",
      earth: "The mountain speaks with one voice",
      metal: "Every edge aligned",
      water: "The flood finds every crack",
    };
    combos.push({
      id: "elemental-surge",
      name: `${el.charAt(0).toUpperCase() + el.slice(1)} Surge`,
      icon: "⚡",
      description: `Pure ${el} energy`,
      tooltip: `All cards share the same element. Overwhelming force, but predictable — the AI will counter with ${el === "wood" ? "metal" : el === "fire" ? "water" : el === "earth" ? "wood" : el === "metal" ? "fire" : "earth"}. ${elNames[el] ?? ""}`,
      positions: lineup.map((_, i) => i),
      bonus: 1.25,
      beneficiaries: lineup.map((_, i) => i),
    });
    // Surge is exclusive — no other synergies apply.
    return combos;
  }

  // ===== SHĒNG CHAIN =====
  // Find the longest consecutive Shēng sequence — but Setup Strike positions BREAK the chain.

  // First, find Setup Strike positions (caretaker before same-element jani).
  const setupStrikePositions = new Set<number>();
  for (let i = 0; i < lineup.length - 1; i++) {
    const a = lineup[i];
    const b = lineup[i + 1];
    const isCaretaker = a.cardType === "caretaker_a" || a.cardType === "caretaker_b";
    if (isCaretaker && b.cardType === "jani" && a.element === b.element) {
      setupStrikePositions.add(i);
      setupStrikePositions.add(i + 1);
    }
  }

  // Add Setup Strikes.
  for (let i = 0; i < lineup.length - 1; i++) {
    const a = lineup[i];
    const b = lineup[i + 1];
    const isCaretaker = a.cardType === "caretaker_a" || a.cardType === "caretaker_b";
    if (isCaretaker && b.cardType === "jani" && a.element === b.element) {
      const elName = a.element.charAt(0).toUpperCase() + a.element.slice(1);
      combos.push({
        id: `setup-strike-${i}`,
        name: "Setup Strike",
        icon: "🎯",
        description: `${elName} caretaker empowers their Jani`,
        tooltip: `The ${elName} Caretaker channels their bond into a devastating strike. Powerful, but breaks any Shēng chain passing through these positions.`,
        positions: [i, i + 1],
        bonus: 1.3,
        beneficiaries: [i + 1],
      });
    }
  }

  // Now find Shēng chains, broken by Setup Strike positions.
  let chainStart = 0;
  let chainLength = 0; // number of links (pairs)

  for (let i = 0; i < lineup.length - 1; i++) {
    const a = lineup[i];
    const b = lineup[i + 1];
    // Transcendence cards bridge chains — they count as any element needed.
    const isSheng =
      SHENG[a.element] === b.element ||
      a.cardType === "transcendence" ||
      b.cardType === "transcendence";
    const isBroken = setupStrikePositions.has(i) || setupStrikePositions.has(i + 1);

    if (isSheng && !isBroken) {
      if (chainLength === 0) chainStart = i;
      chainLength++;
    } else {
      if (chainLength > 0) emitChain(combos, chainStart, chainLength);
      chainLength = 0;
    }
  }
  if (chainLength > 0) emitChain(combos, chainStart, chainLength);

  // ===== WEATHER BLESSING =====
  if (weatherElement) {
    const weatherCards = lineup
      .map((c, i) => ({ element: c.element, index: i }))
      .filter((c) => c.element === weatherElement);

    if (weatherCards.length > 0) {
      combos.push({
        id: "weather-blessing",
        name: "Weather Blessing",
        icon: "☀️",
        description: `${weatherElement} energy amplified`,
        tooltip: `Today's cosmic weather favors ${weatherElement}. All ${weatherElement} cards in your lineup get a power boost.`,
        positions: weatherCards.map((c) => c.index),
        bonus: 1.15,
        beneficiaries: weatherCards.map((c) => c.index),
      });
    }
  }

  // === CHAIN GRACE PERIOD (The Garden ability) ===
  if (previousChainBonus && previousChainBonus > 1.0) {
    const hasGarden = lineup.some((c) => c.defId === "transcendence-garden");
    if (hasGarden) {
      const graceBonus = 1 + (previousChainBonus - 1) * 0.5;
      const gardenResonance =
        lineup.find((c) => c.defId === "transcendence-garden")?.resonance ?? 1;
      // R2: grace extends to full previous bonus (100% instead of 50%).
      const actualGrace = gardenResonance >= 2 ? previousChainBonus : graceBonus;
      combos.push({
        id: "garden-grace",
        name: "Garden Grace",
        icon: "🌿",
        description: "chain memory lingers",
        tooltip:
          "The Garden remembers the chain that was. Surviving cards retain a portion of the previous round's chain bonus.",
        positions: lineup.map((_, i) => i),
        bonus: actualGrace,
        beneficiaries: lineup.map((_, i) => i),
      });
    }
  }

  return combos;
}

function emitChain(combos: Combo[], start: number, links: number) {
  const clampedLinks = Math.min(links, 4);
  const bonus = CHAIN_BONUS[clampedLinks];
  const info = CHAIN_NAMES[clampedLinks] ?? CHAIN_NAMES[1];
  const tooltip = CHAIN_TOOLTIPS[clampedLinks] ?? CHAIN_TOOLTIPS[1];

  // Chain covers positions start through start+links (inclusive).
  const positions = Array.from({ length: links + 1 }, (_, i) => start + i);
  const beneficiaries = [...positions];

  combos.push({
    id: `sheng-chain-${start}-${links}`,
    name: info.name,
    icon: info.icon,
    description: `${links} link${links > 1 ? "s" : ""} in the generative cycle`,
    tooltip,
    positions,
    bonus,
    beneficiaries,
  });
}

/**
 * Total synergy multiplier for a position. Per combo name, only the highest
 * bonus applies (dedup), then multiply across names.
 */
export function getPositionMultiplier(position: number, combos: readonly Combo[]): number {
  const bestByName = new Map<string, number>();
  for (const combo of combos) {
    if (combo.beneficiaries.includes(position)) {
      const existing = bestByName.get(combo.name) ?? 1.0;
      bestByName.set(combo.name, Math.max(existing, combo.bonus));
    }
  }
  let multiplier = 1.0;
  for (const bonus of bestByName.values()) multiplier *= bonus;
  return multiplier;
}
