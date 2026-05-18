/**
 * Clash.live — pure round resolution implementation.
 *
 * Ported from purupuru-game/prototype/src/lib/game/battle.ts (Session 75
 * Gumi alignment). Adapted for compass's Honeycomb substrate (Effect ports
 * + Stream emission).
 *
 * Closes invariants in purupuru-game/prototype/INVARIANTS.md per AC-4:
 *   · clashes per round = min(p1, p2)
 *   · at least one elimination per round (safety tiebreak)
 *   · numbers advantage breaks draws
 *   · R3 transcendence immune to numbers-advantage tiebreak
 *   · Metal Precise doubles largest shift
 *   · all 5 conditions operative
 *   · Forge auto-counters opponent element
 *   · Void mirrors opponent power
 *   · Garden grace carries chain bonus across rounds
 *   · type power hierarchy (transcendence > jani > caretaker_b > caretaker_a)
 */

import { Effect, Layer, PubSub, Stream } from "effect";
import {
  Clash,
  type ClashCard,
  type ClashResult,
  type ClashVfx,
  type ResolveRoundInput,
  type RoundResult,
} from "./clash.port";
import type { Card } from "./cards";
import { TYPE_POWER } from "./cards";
import { getPositionMultiplier } from "./combos";
import type { BattleCondition } from "./conditions";
import { rngFromSeed } from "./seed";
import { getInteraction, KE, type Element } from "./wuxing";

/**
 * Inverse of KE — "what element overcomes X?"
 * Forge uses this: it becomes the element that overcomes the opponent.
 * Computed once at module load to avoid wuxing.ts coupling.
 */
const OVERCOMES_LOOKUP: Record<Element, Element> = (() => {
  const inverse: Partial<Record<Element, Element>> = {};
  for (const [attacker, defender] of Object.entries(KE) as Array<[Element, Element]>) {
    inverse[defender] = attacker;
  }
  return inverse as Record<Element, Element>;
})();

const WEATHER_BONUS = 0.15;

/** Map element-pair to a clash VFX category. Pairs are unordered. */
function vfxFor(el1: Element, el2: Element): ClashVfx {
  if (el1 === el2) return "resonance";
  const pair = [el1, el2].sort().join("-");
  const map: Record<string, ClashVfx> = {
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

/** Resolve transcendence ability effects on element + power before clash math. */
function applyTranscendence(
  myCard: Card,
  theirCard: Card,
  myEffectiveElement: Element,
  myPower: number,
): { effectiveElement: Element; power: number; reason: string } {
  let effectiveElement = myEffectiveElement;
  let power = myPower;
  let reason = "";

  if (myCard.cardType !== "transcendence") return { effectiveElement, power, reason };

  // Resonance defaults to 1 for transcendence cards (FR-5 / pinned invariant 7).
  const resonance = myCard.resonance ?? 1;

  // The Forge (克 · metal-element transcendence): become the element that overcomes
  // opponent. OVERCOMES_LOOKUP gives us "what element kè-counters X?".
  if (myCard.defId === "transcendence-forge") {
    effectiveElement = OVERCOMES_LOOKUP[theirCard.element] ?? theirCard.element;
    reason = `forge → overcomes ${theirCard.element}`;
    if (resonance >= 2) power *= 1.1; // R2 bonus (canonical battle.ts:134)
  }

  // The Void (無 · water-element transcendence): mirror opponent's base type+power
  if (myCard.defId === "transcendence-void") {
    // R1: mirror + small advantage (compass form, unchanged).
    // R2: strengthen the mirrored value by 1.1× (canonical battle.ts:143).
    const mirrorMult = resonance >= 2 ? 1.1 : 1.0;
    power = TYPE_POWER[theirCard.cardType] * mirrorMult + 0.1;
    effectiveElement = theirCard.element;
    reason = `void → mirror ${theirCard.cardType}`;
  }

  // The Garden (生 · wood-element transcendence): keeps its base element/power;
  // its grace effect is handled at round level (in resolveRound).
  if (myCard.defId === "transcendence-garden") {
    reason = "garden · grace pending";
  }

  return { effectiveElement, power, reason };
}

/**
 * Resolve a single pair of cards clashing.
 * Pure function. Order of operations:
 *   1. Apply transcendence abilities (Forge auto-counter, Void mirror, Garden marker)
 *   2. Apply Caretaker B "Adapt" (becomes weather element in round ≥2)
 *   3. Apply type power
 *   4. Apply weather bonus (+15%)
 *   5. Apply combo multipliers (position-aware)
 *   6. Apply wuxing interaction shift
 *   7. Compute loser via power comparison
 */
function resolveClash(
  p1Card: Card,
  p2Card: Card,
  p1Position: number,
  p2Position: number,
  weather: Element,
  round: number,
  _condition: BattleCondition,
  p1ComboMult: number,
  p2ComboMult: number,
): ClashResult {
  // Initialize effective element + power from base
  let p1Element = p1Card.element;
  let p2Element = p2Card.element;
  let p1Power = TYPE_POWER[p1Card.cardType];
  let p2Power = TYPE_POWER[p2Card.cardType];
  let p1Reason = "";
  let p2Reason = "";

  // Transcendence abilities (Forge / Void / Garden)
  const p1Trans = applyTranscendence(p1Card, p2Card, p1Element, p1Power);
  p1Element = p1Trans.effectiveElement;
  p1Power = p1Trans.power;
  p1Reason = p1Trans.reason;

  const p2Trans = applyTranscendence(p2Card, p1Card, p2Element, p2Power);
  p2Element = p2Trans.effectiveElement;
  p2Power = p2Trans.power;
  p2Reason = p2Trans.reason;

  // Caretaker B "Adapt" — becomes weather element in round ≥2
  if (p1Card.cardType === "caretaker_b" && round >= 2 && p1Element !== weather) {
    p1Element = weather;
    p1Reason = p1Reason || `adapt → ${weather}`;
  }
  if (p2Card.cardType === "caretaker_b" && round >= 2 && p2Element !== weather) {
    p2Element = weather;
    p2Reason = p2Reason || `adapt → ${weather}`;
  }

  // Weather bonus (matching element)
  if (p1Element === weather) p1Power *= 1 + WEATHER_BONUS;
  if (p2Element === weather) p2Power *= 1 + WEATHER_BONUS;

  // Combo multipliers
  p1Power *= p1ComboMult;
  p2Power *= p2ComboMult;

  // Wuxing interaction shift
  const interaction = getInteraction(p1Element, p2Element);
  p1Power *= interaction.attackerShift;
  p2Power *= interaction.defenderShift;

  const shift = Math.abs(p1Power - p2Power);
  const EPSILON = 0.001;
  let loser: "p1" | "p2" | "draw";
  if (Math.abs(p1Power - p2Power) < EPSILON) {
    loser = "draw";
  } else if (p1Power < p2Power) {
    loser = "p1";
  } else {
    loser = "p2";
  }

  const reason = [p1Reason, p2Reason].filter((r) => r).join(" · ") || interaction.type;

  return {
    p1Card: { card: p1Card, position: p1Position },
    p2Card: { card: p2Card, position: p2Position },
    p1Power,
    p2Power,
    shift,
    loser,
    interaction,
    vfx: vfxFor(p1Element, p2Element),
    reason,
  };
}

/**
 * Apply a condition's post-processing to clash sequence.
 * Mostly handled inline during resolveClash via combo multipliers, but
 * "precise" + "entrenched" + "tidal" need post-pass.
 */
function applyCondition(
  clashes: readonly ClashResult[],
  condition: BattleCondition,
): readonly ClashResult[] {
  switch (condition.effect.type) {
    case "precise": {
      // Metal Precise: largest shift × 2.
      if (clashes.length === 0) return clashes;
      let maxIdx = 0;
      for (let i = 1; i < clashes.length; i++) {
        if ((clashes[i]?.shift ?? 0) > (clashes[maxIdx]?.shift ?? 0)) maxIdx = i;
      }
      return clashes.map((c, i) => (i === maxIdx ? { ...c, shift: c.shift * 2 } : c));
    }
    case "tidal": {
      // Water Tidal: all shifts amplified.
      const multiplier = condition.effect.multiplier;
      return clashes.map((c) => ({ ...c, shift: c.shift * multiplier }));
    }
    case "entrenched":
      // Earth Steady: handled by tiebreak (close clashes go to bigger lineup).
      return clashes;
    case "position_scale":
      // Wood Growing / Fire Volatile: handled via combo multipliers inline.
      return clashes;
  }
}

/**
 * Apply position scale from a condition (called BEFORE resolveClash).
 * Returns the multiplier for a given position (0..4).
 */
function positionConditionMultiplier(position: number, condition: BattleCondition): number {
  if (condition.effect.type === "position_scale") {
    return condition.effect.scales[position] ?? 1.0;
  }
  return 1.0;
}

/** Numbers-advantage tiebreaker — when sizes differ and clash is a draw. */
function applyNumbersTiebreak(
  result: ClashResult,
  p1Size: number,
  p2Size: number,
  condition: BattleCondition,
): ClashResult {
  if (result.loser !== "draw") return result;
  if (p1Size === p2Size) return result;

  // R3 transcendence immune to numbers-advantage tiebreak.
  const p1Resonance = result.p1Card.card.resonance ?? 0;
  const p2Resonance = result.p2Card.card.resonance ?? 0;
  if (result.p1Card.card.cardType === "transcendence" && p1Resonance >= 3 && p1Size < p2Size) {
    return result;
  }
  if (result.p2Card.card.cardType === "transcendence" && p2Resonance >= 3 && p2Size < p1Size) {
    return result;
  }

  const isEntrenched = condition.effect.type === "entrenched";
  // Default: bigger side wins ties. Entrenched (Earth): also bigger side wins.
  const loser: "p1" | "p2" = p1Size < p2Size ? "p1" : "p2";
  void isEntrenched; // entrenched and default coincide for now; documented for evolution
  return { ...result, loser };
}

function resolveRoundImpl(input: ResolveRoundInput): RoundResult {
  const {
    p1Lineup,
    p2Lineup,
    weather,
    condition,
    round,
    seed,
    p1CombosAtRoundStart,
    p2CombosAtRoundStart,
    previousChainBonus = 0,
  } = input;

  const _rng = rngFromSeed(`${seed}|round-${round}`);
  void _rng; // currently deterministic with no rng needs; kept for future stochastic abilities

  // Number of clashes = min size
  const clashCount = Math.min(p1Lineup.length, p2Lineup.length);
  let clashes: ClashResult[] = [];

  for (let i = 0; i < clashCount; i++) {
    const p1Card = p1Lineup[i];
    const p2Card = p2Lineup[i];
    if (!p1Card || !p2Card) continue;

    const p1ComboMult =
      getPositionMultiplier(i, p1CombosAtRoundStart) * positionConditionMultiplier(i, condition);
    const p2ComboMult =
      getPositionMultiplier(i, p2CombosAtRoundStart) * positionConditionMultiplier(i, condition);

    let result = resolveClash(
      p1Card,
      p2Card,
      i,
      i,
      weather,
      round,
      condition,
      p1ComboMult,
      p2ComboMult,
    );
    result = applyNumbersTiebreak(result, p1Lineup.length, p2Lineup.length, condition);
    clashes.push(result);
  }

  // Post-apply condition (Precise / Tidal)
  clashes = applyCondition(clashes, condition) as ClashResult[];

  // Safety tiebreak: if all clashes are draws AND no eliminations, force one based on
  // largest absolute shift. Per AC-4 "no zero-elimination rounds".
  const hasElimination = clashes.some((c) => c.loser !== "draw");
  if (!hasElimination && clashes.length > 0) {
    let maxShiftIdx = 0;
    for (let i = 1; i < clashes.length; i++) {
      if ((clashes[i]?.shift ?? 0) > (clashes[maxShiftIdx]?.shift ?? 0)) maxShiftIdx = i;
    }
    const target = clashes[maxShiftIdx];
    if (target) {
      // Bigger lineup wins; if equal, p2 wins (arbitrary deterministic tiebreak)
      const loser: "p1" | "p2" =
        p1Lineup.length < p2Lineup.length ? "p1" : p2Lineup.length < p1Lineup.length ? "p2" : "p2";
      clashes[maxShiftIdx] = { ...target, loser };
    }
  }

  // Compute eliminations
  const eliminated: string[] = [];
  const p1EliminatedIdx = new Set<number>();
  const p2EliminatedIdx = new Set<number>();
  for (let i = 0; i < clashes.length; i++) {
    const c = clashes[i];
    if (!c) continue;
    if (c.loser === "p1") {
      p1EliminatedIdx.add(c.p1Card.position);
      eliminated.push(c.p1Card.card.id);
    } else if (c.loser === "p2") {
      p2EliminatedIdx.add(c.p2Card.position);
      eliminated.push(c.p2Card.card.id);
    }
  }

  const p1Survivors = p1Lineup.filter((_, idx) => !p1EliminatedIdx.has(idx));
  const p2Survivors = p2Lineup.filter((_, idx) => !p2EliminatedIdx.has(idx));

  // Garden grace: if Garden survives this round AND was in the lineup,
  // preserve the chain bonus.
  const gardenWasInLineup = p1Lineup.some((c) => c.defId === "transcendence-garden");
  const gardenSurvived = p1Survivors.some((c) => c.defId === "transcendence-garden");
  const gardenGraceFired = gardenWasInLineup && gardenSurvived;
  const chainBonusAtRoundStart = previousChainBonus;
  const chainBonusAtRoundEnd = gardenGraceFired ? chainBonusAtRoundStart : 0;

  return {
    round,
    clashes,
    eliminated,
    survivors: { p1: p1Survivors, p2: p2Survivors },
    chainBonusAtRoundStart,
    chainBonusAtRoundEnd,
    gardenGraceFired,
  };
}

export const ClashLive: Layer.Layer<Clash> = Layer.scoped(
  Clash,
  Effect.gen(function* () {
    const pubsub = yield* PubSub.unbounded<RoundResult>();

    const resolveRound = (input: ResolveRoundInput): Effect.Effect<RoundResult> =>
      Effect.gen(function* () {
        const result = resolveRoundImpl(input);
        yield* PubSub.publish(pubsub, result);
        return result;
      });

    return Clash.of({
      resolveRound,
      applyCondition: (clashes, condition) => applyCondition(clashes, condition),
      emit: Stream.fromPubSub(pubsub),
    });
  }),
);

/** Exported for testing — invariant tests call resolveRoundImpl directly to skip the Effect wrap. */
export const __test = { resolveRoundImpl, resolveClash, applyCondition };

// Suppress unused-export warning for ClashCard re-export (consumers import from port).
export type { ClashCard };
