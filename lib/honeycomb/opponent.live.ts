/**
 * Opponent.live — parameterized policy AI per PRD D11.
 *
 * For each lineup decision:
 *   1. Sample N candidate arrangements from the collection (default N=24)
 *   2. Score each candidate via element-specific policy coefficients
 *   3. Pick the highest-scoring arrangement
 *
 * Deterministic given seed · NO network · NO LLM. AC-5 behavioral fingerprint
 * is enforced via the policy table (POLICIES in opponent.port.ts).
 */

import { Effect, Layer } from "effect";
import type { Card } from "./cards";
import { detectCombos } from "./combos";
import {
  Opponent,
  type OpponentArrangement,
  POLICIES,
  type PolicyCoefficients,
} from "./opponent.port";
import { rngFromSeed } from "./seed";
import { SHENG, type Element } from "./wuxing";

const N_CANDIDATES = 24;

/** Score a candidate lineup against the element's policy. */
function scoreLineup(
  lineup: readonly Card[],
  policy: PolicyCoefficients,
  weather: Element,
): number {
  if (lineup.length === 0) return 0;

  let score = 0;

  // Aggression: front-row aggression (pos-0 jani OR setup-strike pos-0-1)
  const first = lineup[0];
  if (first && first.cardType === "jani") {
    score += policy.aggression * 1.5;
  }
  if (
    lineup.length >= 2 &&
    (lineup[0]?.cardType === "caretaker_a" || lineup[0]?.cardType === "caretaker_b") &&
    lineup[1]?.cardType === "jani" &&
    lineup[0]?.element === lineup[1]?.element
  ) {
    score += policy.aggression * 1.2;
  }

  // Chain preference: count adjacent Shēng pairs.
  let chainPairs = 0;
  for (let i = 0; i < lineup.length - 1; i++) {
    const a = lineup[i];
    const b = lineup[i + 1];
    if (a && b && SHENG[a.element] === b.element) chainPairs++;
  }
  score += policy.chainPreference * chainPairs;

  // Surge preference: same-element lineup count.
  if (lineup.length === 5) {
    const firstEl = lineup[0]?.element;
    if (firstEl && lineup.every((c) => c.element === firstEl)) {
      score += policy.surgePreference * 5;
    }
  }

  // Weather bias: count weather-matching cards.
  const weatherCount = lineup.filter((c) => c.element === weather).length;
  score += policy.weatherBias * weatherCount;

  // Variance target: compute element diversity vs policy target.
  const uniqueElements = new Set(lineup.map((c) => c.element)).size;
  const variance = uniqueElements / 5; // 0..1
  const varianceDelta = Math.abs(variance - policy.varianceTarget);
  score += (1 - varianceDelta) * 0.5; // bonus for matching target

  return score;
}

/** Sample a random 5-card lineup from collection using the rng. */
function sampleLineup(
  collection: readonly Card[],
  rng: ReturnType<typeof rngFromSeed>,
): readonly Card[] {
  if (collection.length < 5) return [...collection];
  const shuffled = rng.shuffle(collection);
  return shuffled.slice(0, 5);
}

/** Generate N candidate lineups and pick the highest-scored. */
function chooseLineup(
  collection: readonly Card[],
  policy: PolicyCoefficients,
  weather: Element,
  seed: string,
): OpponentArrangement {
  const rng = rngFromSeed(seed);
  let best: { lineup: readonly Card[]; score: number } = {
    lineup: sampleLineup(collection, rng),
    score: -Infinity,
  };

  for (let i = 0; i < N_CANDIDATES; i++) {
    const candidate = sampleLineup(collection, rng);
    const candidateScore = scoreLineup(candidate, policy, weather);
    if (candidateScore > best.score) {
      best = { lineup: candidate, score: candidateScore };
    }
  }

  const elements = new Set(best.lineup.map((c) => c.element));
  const rationale = `policy: aggression=${policy.aggression.toFixed(2)} chain=${policy.chainPreference.toFixed(2)} surge=${policy.surgePreference.toFixed(2)} weather=${policy.weatherBias.toFixed(2)} · elements=[${[...elements].join(",")}]`;

  return { lineup: best.lineup, rationale, score: best.score };
}

export const OpponentLive: Layer.Layer<Opponent> = Layer.succeed(
  Opponent,
  Opponent.of({
    buildLineup: (collection, element, weather, seed) =>
      Effect.succeed(chooseLineup(collection, POLICIES[element], weather, seed)),
    rearrange: (currentLineup, element, weather, seed, round) =>
      Effect.gen(function* () {
        const policy = POLICIES[element];
        const rng = rngFromSeed(`${seed}|rearrange-${round}`);
        // Probability check: only rearrange if rng draw < rearrangeRate
        if (rng.next() > policy.rearrangeRate) {
          return {
            lineup: currentLineup,
            rationale: "no-rearrange · below rearrange-rate threshold",
            score: scoreLineup(currentLineup, policy, weather),
          } satisfies OpponentArrangement;
        }
        // Rearrange: shuffle survivors + score
        const shuffled = rng.shuffle(currentLineup);
        const score = scoreLineup(shuffled, policy, weather);
        return {
          lineup: shuffled,
          rationale: `rearrange · ${policy.rearrangeRate.toFixed(2)} rate fired`,
          score,
        } satisfies OpponentArrangement;
      }),
    policyFor: (element) => POLICIES[element],
  }),
);

/** Exported for testing — direct access to scoring without Effect wrapper. */
export const __test = { scoreLineup, chooseLineup };
