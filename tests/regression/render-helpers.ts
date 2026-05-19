/**
 * Test-side render helpers · S1a.T7
 *
 * Per ADR-14 determinism playbook: timers mocked, animations frozen, locale
 * locked. Playwright context settings live in `lib/regression/regression.live.ts`.
 *
 * Public helpers:
 *   - runRegressionCheck(target) — capture + diff against baseline
 *   - captureBaseline(target, reason) — capture + approve (creates baseline)
 *
 * Used by:
 *   - tests/regression/canary.test.ts
 *   - tests/regression/cards/*.snapshot.test.ts
 *   - .claude/hooks/post-tool-use/lab-render-regression.sh (via vitest)
 *   - .husky/pre-commit (via vitest)
 */

import { Effect } from "effect";
import { RegressionCheck } from "../../lib/regression/regression.port";
import type { DiffResult, RenderTarget, Snapshot } from "../../lib/regression/schema";
import { closeBrowser } from "../../lib/regression/regression.live";

/**
 * Capture + diff a target against its stored baseline.
 * Returns `DiffResult` — `Match` is the pass case; everything else is drift
 * or missing-baseline.
 */
export async function runRegressionCheck(target: RenderTarget): Promise<DiffResult> {
  // Lazy import so tests that don't touch regression don't pull Playwright.
  const { RegressionCheckLive } = await import("../../lib/regression/regression.live");
  const program = Effect.gen(function* () {
    const check = yield* RegressionCheck;
    const snap = yield* check.capture(target);
    return yield* check.diff(snap);
  });
  const provided = Effect.provide(program, RegressionCheckLive);
  return Effect.runPromise(provided);
}

/**
 * Capture + approve (writes new baseline). Used by `pnpm regression:approve`.
 * NEVER call from test code — approval is governance-gated.
 */
export async function captureBaseline(
  target: RenderTarget,
  reason: string,
): Promise<{ snap: Snapshot; reason: string }> {
  if (!reason || reason.trim().length === 0) {
    throw new Error("captureBaseline requires a non-empty reason (per IMP-010)");
  }
  const { RegressionCheckLive } = await import("../../lib/regression/regression.live");
  const program = Effect.gen(function* () {
    const check = yield* RegressionCheck;
    const snap = yield* check.capture(target);
    yield* check.approve(snap, reason);
    return snap;
  });
  const provided = Effect.provide(program, RegressionCheckLive);
  const snap = await Effect.runPromise(provided);
  return { snap, reason };
}

/**
 * Vitest teardown helper — closes the singleton browser between test runs
 * to keep CI workers tidy.
 */
export async function teardownPlaywright(): Promise<void> {
  await closeBrowser();
}
