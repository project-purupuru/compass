/**
 * Clash.mock — fixture-injectable mock for tests.
 *
 * Tests that want to inject a specific RoundResult sequence (without driving
 * the real resolveRound) compose this layer with a fixture stream.
 */

import { Effect, Layer, PubSub, Stream } from "effect";
import { Clash, type RoundResult } from "./clash.port";

export const ClashMock = (fixtures?: readonly RoundResult[]): Layer.Layer<Clash> =>
  Layer.scoped(
    Clash,
    Effect.gen(function* () {
      const pubsub = yield* PubSub.unbounded<RoundResult>();
      let fixtureIdx = 0;

      return Clash.of({
        resolveRound: () =>
          Effect.gen(function* () {
            const result =
              fixtures?.[fixtureIdx] ??
              ({
                round: fixtureIdx,
                clashes: [],
                eliminated: [],
                survivors: { p1: [], p2: [] },
                chainBonusAtRoundStart: 0,
                chainBonusAtRoundEnd: 0,
                gardenGraceFired: false,
              } satisfies RoundResult);
            fixtureIdx += 1;
            yield* PubSub.publish(pubsub, result);
            return result;
          }),
        applyCondition: (clashes) => clashes,
        emit: Stream.fromPubSub(pubsub),
      });
    }),
  );
