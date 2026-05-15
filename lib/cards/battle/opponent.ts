/**
 * Opponent AI — ported from Gumi's purupuru-game (prototype/src/lib/game/
 * battle.ts): generatePvELineup, aiRearrange, optimizeForCombos. Element-
 * personality: fire front-loads the strongest card, wood back-loads, metal
 * saves its Jani for the center, water counters the player's front.
 *
 * Decoupled from $lib + getDailyElement — `weather` is passed in so the
 * combo-optimization pass is deterministic against the match's weather.
 */

import { detectCombos } from "../synergy";
import { getInteraction, type Element } from "../synergy/wuxing";

import { CARD_DEFINITIONS, createBattleCard, type BattleCard, type CardDefinition } from "./card-defs";

const TYPE_POWER: Record<string, number> = {
  jani: 1.25,
  caretaker_a: 1.0,
  caretaker_b: 1.05,
  transcendence: 1.3,
};

export interface DifficultyMods {
  readonly skipCombos?: boolean;
  readonly aiCardCount?: number;
  readonly weakenComposition?: boolean;
}

function comboScore(lineup: readonly BattleCard[], weather: Element): number {
  return detectCombos(lineup, weather).reduce(
    (s, c) => s + (c.bonus - 1) * c.beneficiaries.length,
    0,
  );
}

/** Hill-climb the lineup toward more combo value via adjacent swaps. */
function optimizeForCombos(lineup: readonly BattleCard[], weather: Element): BattleCard[] {
  let best = [...lineup];
  let bestScore = comboScore(best, weather);
  for (let pass = 0; pass < 5; pass++) {
    let improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      const sw = [...best];
      [sw[i], sw[i + 1]] = [sw[i + 1], sw[i]];
      const score = comboScore(sw, weather);
      if (score > bestScore) {
        best = sw;
        bestScore = score;
        improved = true;
      }
    }
    if (!improved) break;
  }
  return best;
}

/** Generate a PvE opponent lineup from the card catalog, with element personality. */
export function generatePvELineup(
  surplusElement: Element,
  weather: Element,
  mods?: DifficultyMods,
): BattleCard[] {
  const allElements: Element[] = ["wood", "fire", "earth", "metal", "water"];
  const others = allElements.filter((e) => e !== surplusElement);
  const secondEl = others[Math.floor(Math.random() * others.length)];
  const thirdEl = others[Math.floor(Math.random() * others.length)];

  const pickDef = (element: Element, cardType: CardDefinition["cardType"]): CardDefinition | undefined =>
    CARD_DEFINITIONS.find((d) => d.element === element && d.cardType === cardType);

  const picked: (CardDefinition | undefined)[] = mods?.weakenComposition
    ? [
        // Buster Principle: no jani, all caretakers
        pickDef(surplusElement, "caretaker_a"),
        pickDef(surplusElement, "caretaker_b"),
        pickDef(secondEl, "caretaker_b"),
        pickDef(secondEl, "caretaker_a"),
        pickDef(thirdEl, "caretaker_b"),
      ]
    : [
        // Normal: caretaker_a + jani of surplus (Setup Strike pair), plus diversity
        pickDef(surplusElement, "caretaker_a"),
        pickDef(surplusElement, "jani"),
        pickDef(surplusElement, "caretaker_b"),
        pickDef(secondEl, "jani"),
        pickDef(thirdEl, "caretaker_b"),
      ];

  let cards: BattleCard[] = picked
    .filter((d): d is CardDefinition => d !== undefined)
    .map((def) => createBattleCard(def.defId));

  switch (surplusElement) {
    case "fire":
      cards.sort((a, b) => TYPE_POWER[b.cardType] - TYPE_POWER[a.cardType]);
      break;
    case "wood":
      cards.sort((a, b) => TYPE_POWER[a.cardType] - TYPE_POWER[b.cardType]);
      break;
    case "metal": {
      const ji = cards.findIndex((c) => c.cardType === "jani");
      if (ji >= 0 && ji !== 2) [cards[ji], cards[2]] = [cards[2], cards[ji]];
      break;
    }
    default:
      break;
  }

  if (!mods?.skipCombos) cards = optimizeForCombos(cards, weather);
  if (mods?.aiCardCount && mods.aiCardCount < cards.length) {
    cards = cards.slice(0, mods.aiCardCount);
  }
  return cards;
}

/** AI rearranges its surviving cards between rounds, by element personality. */
export function aiRearrange(
  lineup: readonly BattleCard[],
  surplusElement: Element,
  weather: Element,
  playerFrontElement?: Element,
): BattleCard[] {
  if (lineup.length <= 1) return [...lineup];
  const nl = [...lineup];

  switch (surplusElement) {
    case "fire":
      nl.sort((a, b) => TYPE_POWER[b.cardType] - TYPE_POWER[a.cardType]);
      break;
    case "wood":
      nl.sort((a, b) => TYPE_POWER[a.cardType] - TYPE_POWER[b.cardType]);
      break;
    case "water":
      if (playerFrontElement) {
        const ci = nl.findIndex(
          (c) => getInteraction(c.element, playerFrontElement).type === "overcomes",
        );
        if (ci > 0) [nl[0], nl[ci]] = [nl[ci], nl[0]];
      }
      break;
    default:
      break;
  }

  return optimizeForCombos(nl, weather);
}
