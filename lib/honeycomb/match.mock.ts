/**
 * Match.mock — deterministic mock for tests.
 */

import { Effect, Layer, PubSub, Ref, Stream } from "effect";
import { type Card, CARD_DEFINITIONS, createCard } from "./cards";
import { CONDITIONS } from "./conditions";
import {
  Match,
  type MatchCommand,
  type MatchError,
  type MatchEvent,
  type MatchSnapshot,
} from "./match.port";
import { rngFromSeed } from "./seed";
import { ELEMENT_ORDER, getDailyElement } from "./wuxing";

function defaultMockSnapshot(seed: string): MatchSnapshot {
  const rng = rngFromSeed(seed);
  const collection: Card[] = Array.from({ length: 12 }, (_, i) =>
    createCard(rng.pick(CARD_DEFINITIONS), new Date(2026, 4, 12 + i)),
  );
  return {
    phase: "idle",
    seed,
    weather: getDailyElement(),
    opponentElement: ELEMENT_ORDER[0],
    condition: CONDITIONS[ELEMENT_ORDER[0]],
    playerElement: null,
    hasSeenTutorial: false,
    collection,
    selectedIndices: [],
    p1Lineup: [],
    p2Lineup: [],
    currentRound: 0,
    rounds: [],
    winner: null,
    p1Combos: [],
    p2Combos: [],
    chainBonusAtRoundStart: 0,
    clashSequence: [],
    visibleClashIdx: -1,
    activeClashPhase: null,
    stamps: [],
    dyingP1: [],
    dyingP2: [],
    shieldedP1: [],
    shieldedP2: [],
    selectedIndex: null,
    lastWhisper: null,
    playerClashWins: 0,
    opponentClashWins: 0,
    lastPlayed: null,
    lastGenerated: null,
    lastOvercome: null,
    animState: "idle",
  };
}

export const MatchMock = (seedSnapshot?: Partial<MatchSnapshot>): Layer.Layer<Match> =>
  Layer.scoped(
    Match,
    Effect.gen(function* () {
      const initial: MatchSnapshot = { ...defaultMockSnapshot("mock-match-seed"), ...seedSnapshot };
      const stateRef = yield* Ref.make<MatchSnapshot>(initial);
      const pubsub = yield* PubSub.unbounded<MatchEvent>();

      const invoke = (_cmd: MatchCommand): Effect.Effect<void, MatchError> => Effect.void;

      return Match.of({
        current: Ref.get(stateRef),
        events: Stream.fromPubSub(pubsub),
        invoke,
      });
    }),
  );
