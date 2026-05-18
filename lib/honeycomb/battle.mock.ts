/**
 * Battle.mock — deterministic test substrate.
 *
 * Same shape as `BattleLive`, but with two ergonomic affordances:
 *   - takes an optional seed snapshot for fixture-style state injection
 *   - publishes events synchronously through the same PubSub mechanic
 *
 * Tests that need a complete `BattleSnapshot` should construct one
 * explicitly; the mock will deep-merge over the default initial state.
 */

import { Effect, Layer, PubSub, Ref, Stream } from "effect";
import {
  Battle,
  type BattleCommand,
  type BattleError,
  type BattleEvent,
  type BattleSnapshot,
} from "./battle.port";
import { CARD_DEFINITIONS, createCard } from "./cards";
import { CONDITIONS } from "./conditions";
import { DEFAULT_KAIRONIC_WEIGHTS } from "./curves";
import { rngFromSeed } from "./seed";
import { ELEMENT_ORDER, getDailyElement } from "./wuxing";

function defaultMockSnapshot(seed: string): BattleSnapshot {
  const rng = rngFromSeed(seed);
  const collection = Array.from({ length: 12 }, (_, i) =>
    createCard(rng.pick(CARD_DEFINITIONS), new Date(2026, 4, 12 + i)),
  );
  return {
    phase: "idle",
    seed,
    weather: getDailyElement(),
    opponentElement: ELEMENT_ORDER[0],
    condition: CONDITIONS[ELEMENT_ORDER[0]],
    collection,
    selectedIndices: [],
    lineup: [],
    combos: [],
    comboSummary: { count: 0, totalBonus: 0 },
    kaironic: DEFAULT_KAIRONIC_WEIGHTS,
    lastWhisper: null,
    whisperCounter: 0,
  };
}

export const BattleMock = (seedSnapshot?: Partial<BattleSnapshot>): Layer.Layer<Battle> =>
  Layer.scoped(
    Battle,
    Effect.gen(function* () {
      const initial: BattleSnapshot = { ...defaultMockSnapshot("mock-seed"), ...seedSnapshot };
      const stateRef = yield* Ref.make<BattleSnapshot>(initial);
      const pubsub = yield* PubSub.unbounded<BattleEvent>();

      const invoke = (_cmd: BattleCommand): Effect.Effect<void, BattleError> => Effect.void;

      return Battle.of({
        current: Ref.get(stateRef),
        events: Stream.fromPubSub(pubsub),
        invoke,
      });
    }),
  );
