/**
 * Regression substrate · Noop implementation (production layer per ADR-9)
 *
 * Production AppLayer uses this — NEVER ships Playwright into the production
 * bundle. Satisfies the port interface so consumers can call `RegressionCheck`
 * without runtime errors; all operations return "no-op success" semantics.
 *
 * Per ADR-9: env-gated wiring lives in `lib/runtime/runtime.ts`:
 *   if (process.env.NODE_ENV === 'development' || process.env.LOA_REGRESSION === '1') {
 *     // import { RegressionCheckLive } from './regression.live'
 *   } else {
 *     // RegressionCheckNoopLive
 *   }
 */

import { Effect, Layer } from "effect";
import { RegressionCheck, RegressionError } from "./regression.port";
import type { Baseline, RenderTarget, Snapshot } from "./schema";

const noopCheck: RegressionCheck = {
  capture: () =>
    Effect.fail(
      new RegressionError("RegressionCheck.capture called in production (noop layer)"),
    ),
  diff: () => Effect.succeed({ _tag: "Match" as const, boundingBox: { x: 0, y: 0, width: 0, height: 0 }, sha256: "noop" }),
  approve: () =>
    Effect.fail(
      new RegressionError("RegressionCheck.approve called in production (noop layer)"),
    ),
  getBaseline: () => Effect.succeed(null),
};

export const RegressionCheckNoopLive = Layer.succeed(RegressionCheck, noopCheck);
