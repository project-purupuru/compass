/**
 * Opponent.mock — deterministic stub for tests.
 */

import { Effect, Layer } from "effect";
import { Opponent, type OpponentArrangement, POLICIES } from "./opponent.port";

export const OpponentMock = (fixture?: OpponentArrangement): Layer.Layer<Opponent> =>
  Layer.succeed(
    Opponent,
    Opponent.of({
      buildLineup: () =>
        Effect.succeed(
          fixture ?? {
            lineup: [],
            rationale: "mock",
            score: 0,
          },
        ),
      rearrange: () =>
        Effect.succeed(
          fixture ?? {
            lineup: [],
            rationale: "mock",
            score: 0,
          },
        ),
      policyFor: (element) => POLICIES[element],
    }),
  );
