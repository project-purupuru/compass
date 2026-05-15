/**
 * Clash + round resolution — ported verbatim-in-logic from Gumi's purupuru-game
 * (prototype/src/lib/game/battle.ts). The element matchups, combo multipliers,
 * weather bonus, conditions, Caretaker-A shield, Metal "precise", and the
 * tiebreaker safety are all unchanged. Decoupled only from the $lib imports;
 * BattleCard is the flat shape from ./card-defs.
 *
 * Pure given its inputs, except `pickWhisper` (cosmetic text only — outcomes
 * are deterministic).
 */

import { detectCombos, getPositionMultiplier } from "../synergy";
import { getInteraction, type Element, type ElementInteraction } from "../synergy/wuxing";

import type { BattleCard } from "./card-defs";
import type { BattleCondition } from "./conditions";

export interface ClashResult {
  p1Card: BattleCard;
  p2Card: BattleCard;
  p1Power: number;
  p2Power: number;
  shift: number;
  interaction: ElementInteraction;
  whisper: string | null;
  vfx: string;
  loser: "p1" | "p2" | "draw";
  /** Brief reason for the outcome, surfaced during the clash. */
  reason: string;
}

export interface RoundResult {
  readonly round: number;
  readonly clashes: readonly ClashResult[];
  /** uids of cards eliminated this round. */
  readonly eliminated: readonly string[];
}

/** Element that OVERCOMES the given element (used by The Forge). */
const OVERCOMES: Record<Element, Element> = {
  wood: "metal",
  fire: "water",
  earth: "wood",
  metal: "fire",
  water: "earth",
};

const TYPE_POWER: Record<string, number> = {
  jani: 1.25,
  caretaker_a: 1.0,
  caretaker_b: 1.05,
  transcendence: 1.3,
};

const WEATHER_BONUS = 0.2;

function getClashVfx(el1: Element, el2: Element): string {
  if (el1 === el2) return "resonance";
  const pair = [el1, el2].sort().join("-");
  const map: Record<string, string> = {
    "fire-water": "steam",
    "metal-wood": "sparks",
    "earth-wood": "roots",
    "fire-metal": "melt",
    "earth-water": "absorb",
    "fire-wood": "blaze",
    "earth-metal": "forge",
    "metal-water": "flow",
    "earth-fire": "ash",
    "water-wood": "bloom",
  };
  return map[pair] ?? "clash";
}

const WHISPERS: Record<Element, { win: string[]; lose: string[]; close: string[] }> = {
  wood: {
    win: ["The garden blooms.", "Everything in its time."],
    lose: ["The seeds are still there. Under everything."],
    close: ["Be patient."],
  },
  fire: {
    win: ["NOW.", "Did you see that?"],
    lose: ["...next time I go harder."],
    close: ["The spark is ready."],
  },
  earth: {
    win: ["Still here.", "The mountain does not move."],
    lose: ["The kitchen will still be warm."],
    close: ["Mm. This is fine."],
  },
  metal: {
    win: ["One cut. Clean.", "As predicted."],
    lose: ["Recalculating."],
    close: ["Calculating."],
  },
  water: {
    win: ["Here it is back.", "The tide doesn't care."],
    lose: ["Hurt is just water moving through you."],
    close: ["Feel the current."],
  },
};

function pickWhisper(el: Element, ctx: "win" | "lose" | "close"): string {
  const opts = WHISPERS[el][ctx];
  return opts[Math.floor(Math.random() * opts.length)];
}

/** Resolve one pair of cards clashing. */
export function resolveClash(
  p1Card: BattleCard,
  p2Card: BattleCard,
  p1ComboMult: number,
  p2ComboMult: number,
  weatherElement: Element,
  condition: BattleCondition,
): ClashResult {
  let effectiveP1Element = p1Card.element;
  let effectiveP2Element = p2Card.element;
  let p1Power = TYPE_POWER[p1Card.cardType];
  let p2Power = TYPE_POWER[p2Card.cardType];
  let abilityReason = "";

  // Caretaker B "Adapt": becomes the weather element.
  if (p1Card.cardType === "caretaker_b" && weatherElement) {
    effectiveP1Element = weatherElement;
    if (effectiveP1Element !== p1Card.element) abilityReason = "adapt → " + weatherElement;
  }
  if (p2Card.cardType === "caretaker_b" && weatherElement) {
    effectiveP2Element = weatherElement;
  }

  // ── Transcendence abilities ──
  const p1Resonance = p1Card.resonance ?? (p1Card.cardType === "transcendence" ? 1 : 0);
  const p2Resonance = p2Card.resonance ?? (p2Card.cardType === "transcendence" ? 1 : 0);

  // The Forge: becomes the Kè counter of the opponent's element.
  if (p1Card.defId === "transcendence-forge") {
    effectiveP1Element = OVERCOMES[p2Card.element];
    abilityReason = `forge → ${effectiveP1Element}`;
    if (p1Resonance >= 2) p1Power *= 1.1;
  }
  if (p2Card.defId === "transcendence-forge") {
    effectiveP2Element = OVERCOMES[p1Card.element];
    if (p2Resonance >= 2) p2Power *= 1.1;
  }

  // The Void: copies the opponent's base power and card type.
  if (p1Card.defId === "transcendence-void") {
    const mirrorMult = p1Resonance >= 2 ? 1.1 : 1.0;
    p1Power = Math.max(p1Power, TYPE_POWER[p2Card.cardType] * mirrorMult);
    abilityReason = abilityReason ? abilityReason + " · void mirrors" : "void mirrors";
  }
  if (p2Card.defId === "transcendence-void") {
    const mirrorMult = p2Resonance >= 2 ? 1.1 : 1.0;
    p2Power = Math.max(p2Power, TYPE_POWER[p1Card.cardType] * mirrorMult);
  }

  const interaction = getInteraction(effectiveP1Element, effectiveP2Element);

  p1Power *= 1 + interaction.advantage;
  p2Power *= 1 - interaction.advantage;

  p1Power *= p1ComboMult;
  p2Power *= p2ComboMult;

  if (effectiveP1Element === weatherElement) p1Power += WEATHER_BONUS;
  if (effectiveP2Element === weatherElement) p2Power += WEATHER_BONUS;

  let shift = p1Power - p2Power;

  if (condition.effect.type === "tidal") {
    shift *= condition.effect.multiplier;
  }

  let loser: "p1" | "p2" | "draw";
  if (Math.abs(shift) < 0.03) {
    loser = "draw";
  } else {
    loser = shift > 0 ? "p2" : "p1";
  }

  let whisper: string | null;
  if (loser === "p2") whisper = pickWhisper(p1Card.element, "win");
  else if (loser === "p1") whisper = pickWhisper(p2Card.element, "win");
  else whisper = pickWhisper(p1Card.element, "close");

  let reason = abilityReason
    ? abilityReason + " · " + interaction.description
    : interaction.description;
  if (p1ComboMult > 1.01 || p2ComboMult > 1.01) {
    const comboSide = p1ComboMult > p2ComboMult ? "your combos" : "their combos";
    reason += ` · ${comboSide}`;
  }
  if (p1Card.element === weatherElement || p2Card.element === weatherElement) {
    reason += " · ☀️";
  }

  return {
    p1Card,
    p2Card,
    p1Power,
    p2Power,
    shift,
    interaction,
    whisper,
    vfx: getClashVfx(p1Card.element, p2Card.element),
    loser,
    reason,
  };
}

/**
 * Resolve a full round: all matching pairs clash, left to right.
 * Number of clashes = min(p1.length, p2.length); extra cards sit out.
 */
export function resolveRound(
  round: number,
  p1Lineup: readonly BattleCard[],
  p2Lineup: readonly BattleCard[],
  weatherElement: Element,
  condition: BattleCondition,
): RoundResult {
  const numClashes = Math.min(p1Lineup.length, p2Lineup.length);
  const p1Combos = detectCombos(p1Lineup, weatherElement);
  const p2Combos = detectCombos(p2Lineup, weatherElement);

  const clashes: ClashResult[] = [];
  const eliminated: string[] = [];
  const p1Advantage = p1Lineup.length > p2Lineup.length;
  const p2Advantage = p2Lineup.length > p1Lineup.length;

  for (let i = 0; i < numClashes; i++) {
    let p1Mult = getPositionMultiplier(i, p1Combos);
    let p2Mult = getPositionMultiplier(i, p2Combos);

    // Position-based conditions apply to BOTH sides.
    if (condition.effect.type === "position_scale" && i < condition.effect.scales.length) {
      p1Mult *= condition.effect.scales[i];
      p2Mult *= condition.effect.scales[i];
    }

    const clash = resolveClash(p1Lineup[i], p2Lineup[i], p1Mult, p2Mult, weatherElement, condition);

    // Numbers advantage breaks draws (unless R3+ transcendence is involved).
    const p1HasR3 =
      clash.p1Card.cardType === "transcendence" && (clash.p1Card.resonance ?? 1) >= 3;
    const p2HasR3 =
      clash.p2Card.cardType === "transcendence" && (clash.p2Card.resonance ?? 1) >= 3;
    if (clash.loser === "draw" && !p1HasR3 && !p2HasR3) {
      if (p1Advantage) {
        clash.loser = "p2";
        clash.whisper = "Outnumbered. The weight of numbers.";
        clash.reason = "outnumbered";
      } else if (p2Advantage) {
        clash.loser = "p1";
        clash.whisper = "Outnumbered. The weight of numbers.";
        clash.reason = "outnumbered";
      }
    }

    clashes.push(clash);

    if (clash.loser === "p1") eliminated.push(clash.p1Card.uid);
    else if (clash.loser === "p2") eliminated.push(clash.p2Card.uid);
  }

  // Caretaker A "Shield": a surviving Caretaker A saves one adjacent eliminated ally.
  for (let i = 0; i < numClashes; i++) {
    const p1Card = p1Lineup[i];
    if (p1Card.cardType === "caretaker_a" && !eliminated.includes(p1Card.uid)) {
      for (const adj of [i - 1, i + 1]) {
        if (adj >= 0 && adj < p1Lineup.length && eliminated.includes(p1Lineup[adj].uid)) {
          eliminated.splice(eliminated.indexOf(p1Lineup[adj].uid), 1);
          clashes[adj].reason = (clashes[adj].reason ?? "") + " · 🛡️ shielded";
          clashes[adj].loser = "draw";
          break;
        }
      }
    }
    const p2Card = p2Lineup[i];
    if (p2Card && p2Card.cardType === "caretaker_a" && !eliminated.includes(p2Card.uid)) {
      for (const adj of [i - 1, i + 1]) {
        if (adj >= 0 && adj < p2Lineup.length && eliminated.includes(p2Lineup[adj].uid)) {
          eliminated.splice(eliminated.indexOf(p2Lineup[adj].uid), 1);
          break;
        }
      }
    }
  }

  // Metal "Precise": double the largest absolute clash shift.
  if (condition.effect.type === "precise" && clashes.length > 0) {
    let maxIdx = 0;
    let maxShift = 0;
    for (let i = 0; i < clashes.length; i++) {
      if (Math.abs(clashes[i].shift) > maxShift) {
        maxShift = Math.abs(clashes[i].shift);
        maxIdx = i;
      }
    }
    const boosted = clashes[maxIdx];
    boosted.shift *= 2;
    boosted.reason = (boosted.reason ?? "") + " · ⚔️ precise";
    if (Math.abs(boosted.shift) >= 0.03) {
      const newLoser = boosted.shift > 0 ? "p2" : "p1";
      if (boosted.loser !== newLoser) {
        const oldLoserUid =
          boosted.loser === "p1"
            ? boosted.p1Card.uid
            : boosted.loser === "p2"
              ? boosted.p2Card.uid
              : null;
        if (oldLoserUid) {
          const idx = eliminated.indexOf(oldLoserUid);
          if (idx >= 0) eliminated.splice(idx, 1);
        }
        boosted.loser = newLoser;
        const newLoserUid = newLoser === "p1" ? boosted.p1Card.uid : boosted.p2Card.uid;
        if (!eliminated.includes(newLoserUid)) eliminated.push(newLoserUid);
      }
    }
  }

  // Safety: if nobody was eliminated, tip the closest clash (prevent stalls).
  if (eliminated.length === 0 && clashes.length > 0) {
    let weakestIdx = 0;
    let weakestShift = Infinity;
    for (let i = 0; i < clashes.length; i++) {
      if (Math.abs(clashes[i].shift) < weakestShift) {
        weakestShift = Math.abs(clashes[i].shift);
        weakestIdx = i;
      }
    }
    const tiebreaker = clashes[weakestIdx];
    if (tiebreaker.shift >= 0) {
      tiebreaker.loser = "p2";
      eliminated.push(tiebreaker.p2Card.uid);
    } else {
      tiebreaker.loser = "p1";
      eliminated.push(tiebreaker.p1Card.uid);
    }
    tiebreaker.whisper = "The smallest crack decides.";
    tiebreaker.reason = "tiebreaker";
  }

  return { round, clashes, eliminated };
}
