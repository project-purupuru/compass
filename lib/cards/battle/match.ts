/**
 * Match orchestrator — the phase state machine for a full battle:
 *   arrange → clashing → between-rounds → arrange/clashing → … → result
 *
 * Pure step functions (createMatch / withPlayerLineup / lockIn / advanceClash /
 * concludeRound) — the round logic itself lives in ./resolve (Gumi's canon);
 * this just sequences phases and attrition. No React, no Effect: pure
 * substrate. The MatchEngine (./match-engine.live) drives these on the
 * runtime; the surface never touches them directly.
 *
 * Cycle-1 scope: a fixed starting hand (no SELECT-from-collection yet) vs a
 * generated PvE opponent. The loop is the playable thing.
 */

import { ELEMENT_ORDER, type Element } from "../synergy/wuxing";

import { createBattleCard, type BattleCard } from "./card-defs";
import { CONDITIONS, type BattleCondition } from "./conditions";
import { aiRearrange, generatePvELineup } from "./opponent";
import { resolveRound, type RoundResult } from "./resolve";

export type MatchPhase = "arrange" | "clashing" | "between-rounds" | "result";
export type MatchWinner = "player" | "opponent" | "draw" | null;

export interface MatchState {
  readonly phase: MatchPhase;
  readonly round: number;
  readonly weather: Element;
  readonly condition: BattleCondition;
  readonly playerLineup: readonly BattleCard[];
  readonly opponentLineup: readonly BattleCard[];
  /** The round just resolved — present while phase === "clashing". */
  readonly roundResult: RoundResult | null;
  /** How many of roundResult's clashes the surface has played through. */
  readonly revealedClashes: number;
  readonly history: readonly RoundResult[];
  readonly winner: MatchWinner;
}

/** A fixed starting hand for cycle-1 — tuned to show the Setup-Strike / Shēng
 *  tradeoff. SELECT-from-collection is a later milestone. */
const STARTING_HAND: readonly string[] = [
  "caretaker-a-fire",
  "jani-fire",
  "caretaker-b-earth",
  "jani-metal",
  "jani-water",
];

/** Hard safety cap — attrition guarantees termination well before this. */
const MAX_ROUNDS = 10;

export interface CreateMatchOptions {
  /** Override the imbalance element (drives weather + condition + opponent). */
  readonly imbalanceElement?: Element;
}

/** Start a fresh match. */
export function createMatch(opts?: CreateMatchOptions): MatchState {
  const imbalance =
    opts?.imbalanceElement ?? ELEMENT_ORDER[Math.floor(Math.random() * ELEMENT_ORDER.length)];
  const condition = CONDITIONS[imbalance];
  const playerLineup = STARTING_HAND.map((defId) => createBattleCard(defId));
  const opponentLineup = generatePvELineup(imbalance, imbalance);
  return {
    phase: "arrange",
    round: 1,
    weather: imbalance,
    condition,
    playerLineup,
    opponentLineup,
    roundResult: null,
    revealedClashes: 0,
    history: [],
    winner: null,
  };
}

/** Replace the player's lineup (drag/swap reorder) — only during arrange phases. */
export function withPlayerLineup(state: MatchState, lineup: readonly BattleCard[]): MatchState {
  if (state.phase !== "arrange" && state.phase !== "between-rounds") return state;
  return { ...state, playerLineup: lineup };
}

/** Lock in both lineups and resolve the round. arrange/between-rounds → clashing. */
export function lockIn(state: MatchState): MatchState {
  if (state.phase !== "arrange" && state.phase !== "between-rounds") return state;
  const roundResult = resolveRound(
    state.round,
    state.playerLineup,
    state.opponentLineup,
    state.weather,
    state.condition,
  );
  return { ...state, phase: "clashing", roundResult, revealedClashes: 0 };
}

/** Reveal one more clash of the resolving round. */
export function advanceClash(state: MatchState): MatchState {
  if (state.phase !== "clashing" || !state.roundResult) return state;
  const next = Math.min(state.revealedClashes + 1, state.roundResult.clashes.length);
  return { ...state, revealedClashes: next };
}

/** True once every clash of the current round has been revealed. */
export function clashesExhausted(state: MatchState): boolean {
  return (
    state.phase === "clashing" &&
    state.roundResult !== null &&
    state.revealedClashes >= state.roundResult.clashes.length
  );
}

/**
 * Apply this round's attrition and transition: someone eliminated → result,
 * otherwise → between-rounds with the opponent rearranged.
 */
export function concludeRound(state: MatchState): MatchState {
  if (state.phase !== "clashing" || !state.roundResult) return state;
  const dead = new Set(state.roundResult.eliminated);
  const playerSurvivors = state.playerLineup.filter((c) => !dead.has(c.uid));
  const opponentSurvivors = state.opponentLineup.filter((c) => !dead.has(c.uid));
  const history = [...state.history, state.roundResult];

  let winner: MatchWinner = null;
  if (playerSurvivors.length === 0 && opponentSurvivors.length === 0) winner = "draw";
  else if (playerSurvivors.length === 0) winner = "opponent";
  else if (opponentSurvivors.length === 0) winner = "player";
  else if (state.round >= MAX_ROUNDS) {
    // Safety: cap reached — the larger surviving side takes the tide.
    winner =
      playerSurvivors.length > opponentSurvivors.length
        ? "player"
        : opponentSurvivors.length > playerSurvivors.length
          ? "opponent"
          : "draw";
  }

  if (winner) {
    return {
      ...state,
      phase: "result",
      playerLineup: playerSurvivors,
      opponentLineup: opponentSurvivors,
      roundResult: null,
      history,
      winner,
    };
  }

  // Next round — opponent rearranges by personality; player rearranges in-phase.
  const playerFront = playerSurvivors[0]?.element;
  return {
    ...state,
    phase: "between-rounds",
    round: state.round + 1,
    playerLineup: playerSurvivors,
    opponentLineup: aiRearrange(opponentSurvivors, state.weather, state.weather, playerFront),
    roundResult: null,
    revealedClashes: 0,
    history,
  };
}

/** A "tide favored X" result line — the pitch's no-numbers verdict. */
export function resultLine(state: MatchState): string {
  const el = state.weather;
  const cap = el.charAt(0).toUpperCase() + el.slice(1);
  if (state.winner === "player") return `The tide favored ${cap}. Your roots held.`;
  if (state.winner === "opponent") return `${cap}'s moment passed to them. The current was theirs.`;
  return "A perfect balance. Neither yields.";
}

/**
 * The caretaker's read of the current moment — the line she speaks. One
 * string per phase: the arrange instruction, the live clash narration (reason
 * + whisper), or the result verdict. The surface routes this into the
 * CaretakerCorner's bubble so the helper text lives with the character, not
 * floating over the world.
 */
export function clashMessage(state: MatchState): string {
  if (state.phase === "result") return resultLine(state);
  if (state.phase === "clashing") {
    const clash =
      state.roundResult && state.revealedClashes > 0
        ? state.roundResult.clashes[state.revealedClashes - 1]
        : null;
    if (!clash) return "The lineups meet…";
    return clash.whisper ? `${clash.reason} — “${clash.whisper}”` : clash.reason;
  }
  return state.round === 1
    ? "Arrange your lineup — order is the puzzle. Drag, or tap two cards to swap."
    : "Rearrange the survivors — the chain shifts as the lineup shrinks.";
}
