/**
 * Battle substrate — barrel. The card-game loop for /battle-v2, ported from
 * Gumi's purupuru-game engine and built on lib/cards/synergy.
 */

export {
  CARD_DEFINITIONS,
  RARITY_BY_CARDTYPE,
  createBattleCard,
  definitionsByElement,
  getDefinition,
  type BattleCard,
  type CardDefinition,
  type CardType,
} from "./card-defs";

export { CONDITIONS, type BattleCondition, type ConditionEffect } from "./conditions";

export { resolveClash, resolveRound, type ClashResult, type RoundResult } from "./resolve";

export { aiRearrange, generatePvELineup, type DifficultyMods } from "./opponent";

export {
  advanceClash,
  clashesExhausted,
  clashMessage,
  concludeRound,
  createMatch,
  lockIn,
  resultLine,
  withPlayerLineup,
  type CreateMatchOptions,
  type MatchPhase,
  type MatchState,
  type MatchWinner,
} from "./match";

export type { ClashEvent, ClashEventType } from "./events";

export { MatchEngine } from "./match-engine.port";
export { MatchEngineLive } from "./match-engine.live";
